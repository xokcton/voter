import {
  Logger,
  ValidationPipe,
  UsePipes,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';
import { Namespace } from 'socket.io';
import { SocketWithAuth } from './polls.types';
import { WsCatchAllFilter } from 'src/exceptions/ws-catchAll.filter';
import { GatewayAdminGuard } from './gateway-admin.guard';
import {
  CANCEL_POLL,
  CLOSE_POLL,
  NOMINATE,
  POLLS,
  POLL_CANCELLED,
  POLL_UPDATED,
  REMOVE_NOMINATION,
  REMOVE_PARTICIPANT,
  START_VOTE,
  SUBMIT_RANKINGS,
} from 'shared';
import { NominationDto } from './polls.dtos';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  namespace: POLLS,
})
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);

  constructor(private readonly pollsService: PollsService) {}

  @WebSocketServer() io: Namespace;

  afterInit(): void {
    this.logger.log('Websocket Gateway initialized.');
  }

  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets;
    const roomName = client.pollID;
    await client.join(roomName);
    const connectedClients = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit(POLL_UPDATED, updatedPoll);
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;
    const { pollID, userID } = client;
    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );
    const connectedClients = this.io.adapter.rooms?.get(pollID)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${pollID}': ${connectedClients}`,
    );

    if (updatedPoll) {
      this.io.to(pollID).emit(POLL_UPDATED, updatedPoll);
    }
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage(REMOVE_PARTICIPANT)
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove participant ${id} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant(
      client.pollID,
      id,
    );

    if (updatedPoll) {
      this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
    }
  }

  @SubscribeMessage(NOMINATE)
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to add nomination for user ${client.userID} to poll ${client.pollID}\n${nomination.text}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });

    this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage(REMOVE_NOMINATION)
  async removeNomination(
    @MessageBody('id') nominationID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove nomination ${nominationID} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeNomination(
      client.pollID,
      nominationID,
    );

    this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage(START_VOTE)
  async startVote(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Attempting to start voting for poll ${client.pollID}`);

    const updatedPoll = await this.pollsService.startPoll(client.pollID);

    this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
  }

  @SubscribeMessage(SUBMIT_RANKINGS)
  async submitRankings(
    @MessageBody('rankings') rankings: string[],
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Submitting votes for user: ${client.userID} belonging to pollID: "${client.pollID}"`,
    );

    const updatedPoll = await this.pollsService.submitRankings({
      pollID: client.pollID,
      userID: client.userID,
      rankings,
    });

    this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage(CLOSE_POLL)
  async closePoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Closing poll: ${client.pollID} and computing results`);

    const updatedPoll = await this.pollsService.computeResults(client.pollID);

    this.io.to(client.pollID).emit(POLL_UPDATED, updatedPoll);
  }

  @UseGuards(GatewayAdminGuard)
  @SubscribeMessage(CANCEL_POLL)
  async cancelPoll(@ConnectedSocket() client: SocketWithAuth): Promise<void> {
    this.logger.debug(`Cancelling poll with id: "${client.pollID}"`);

    await this.pollsService.cancelPoll(client.pollID);

    this.io.to(client.pollID).emit(POLL_CANCELLED);
  }
}

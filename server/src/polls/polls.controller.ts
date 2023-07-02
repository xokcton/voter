import { PollsService } from './polls.service';
import { Controller, Logger, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './polls.dtos';
import { ControllerAuthGuard } from './controller-auth.guard';
import { RequestWithAuth } from './polls.types';

@Controller('polls')
export class PollsController {
  private readonly logger = new Logger(PollsController.name);

  constructor(private readonly pollsService: PollsService) {}

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    this.logger.log('In create!');
    const result = await this.pollsService.createPoll(createPollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    this.logger.log('In join!');
    const result = await this.pollsService.joinPoll(joinPollDto);
    return result;
  }

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    this.logger.log('In rejoin!');
    const result = await this.pollsService.rejoinPoll({
      name: request.name,
      pollID: request.pollID,
      userID: request.userID,
    });
    return result;
  }
}

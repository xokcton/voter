import { PollsService } from './polls.service';
import { Controller, Logger, Post, Body } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './polls.dtos';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    Logger.log('[Polls Controller] In create!');
    const result = await this.pollsService.createPoll(createPollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    Logger.log('[Polls Controller] In join!');
    const result = await this.pollsService.joinPoll(joinPollDto);
    return result;
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('[Polls Controller] In rejoin!');
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'From token',
      userID: 'From token',
    });
    return result;
  }
}

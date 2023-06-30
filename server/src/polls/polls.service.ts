import { createPollID, createUserID } from 'src/utils/ids';
import {
  CreatePollFields,
  JoinPollFields,
  RejoinPollFields,
} from './polls.types';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {
    Logger.log('[Polls Service] In createPoll!');
    const pollID = createPollID();
    const userID = createUserID();

    return {
      ...fields,
      userID,
      pollID,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    Logger.log('[Polls Service] In joinPoll!');
    const userID = createUserID();

    return {
      ...fields,
      userID,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    Logger.log('[Polls Service] In rejoinPoll');
    return fields;
  }
}

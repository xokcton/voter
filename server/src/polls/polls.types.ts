import { Request } from 'express';
import { Nomination } from 'shared';
import { Socket } from 'socket.io';

type DefaultType = {
  pollID: string;
  userID: string;
  name: string;
};

// service
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = DefaultType;

export type AddParticipantFields = DefaultType;

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
};

export type SubmitRankingsFields = AddParticipantRankingsData;

// repository
export type CreatePollData = {
  pollID: string;
  userID: string;
  topic: string;
  votesPerVoter: number;
};

export type AddParticipantData = DefaultType;

export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};

export type AddParticipantRankingsData = {
  pollID: string;
  userID: string;
  rankings: string[];
};

// guard
export type AuthPayload = DefaultType;

export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;

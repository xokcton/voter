import {
  ArgumentsHost,
  BadGatewayException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { SocketWithAuth } from 'src/polls/polls.types';
import {
  WsBadRequestException,
  WsTypeException,
  WsUnknownException,
} from './ws-exceptions';
import { EXCEPTION } from 'shared';

@Catch()
export class WsCatchAllFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const socket: SocketWithAuth = host.switchToWs().getClient();

    if (exception instanceof BadGatewayException) {
      const exceptionData = exception.getResponse();
      const exceptionsMessage =
        exceptionData['message'] ?? exceptionData ?? exception.name;
      const wsException = new WsBadRequestException(exceptionsMessage);

      socket.emit(EXCEPTION, wsException.getError());
      return;
    }

    if (exception instanceof WsTypeException) {
      socket.emit(EXCEPTION, exception.getError());
      return;
    }

    const wsException = new WsUnknownException(exception.message);
    socket.emit(EXCEPTION, wsException.getError());
  }
}

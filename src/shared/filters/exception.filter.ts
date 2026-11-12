import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const { status, message, } = this.toResponse(exception);

    response.status(status).json({
      status: false,
      message,
    });
  }

  private toResponse(exception: any): { status: number; message: unknown } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.getResponse()['message'] || exception.message,
      };
    }
    // findOneOrFail: its message lists the query, so it is not passed to the client
    if (exception instanceof EntityNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: 'Not found', };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
    };
  }
}

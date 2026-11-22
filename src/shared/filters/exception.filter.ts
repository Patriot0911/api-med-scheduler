import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EntityNotFoundError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, message, } = this.toResponse(exception);

    response.status(status).json({
      status: false,
      message,
    });
  }

  private toResponse(exception: unknown): { status: number; message: unknown } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message = typeof body === 'object' && 'message' in body ? body.message : undefined;
      return {
        status: exception.getStatus(),
        message: message || exception.message,
      };
    }
    // findOneOrFail: its message lists the query, so it is not passed to the client
    if (exception instanceof EntityNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: 'Not found', };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: (exception instanceof Error && exception.message) || 'Internal server error',
    };
  }
}

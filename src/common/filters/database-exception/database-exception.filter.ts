import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { QueryFailedError, TypeORMError } from 'typeorm';
import { Response } from 'express';
@Catch(TypeORMError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const code =
      exception instanceof QueryFailedError
        ? (exception.driverError as { code?: string }).code
        : undefined;
    const status =
      code === '55P03' ||
      code === '23505' ||
      code === '23503' ||
      code === '40001' ||
      code === '40P01'
        ? 409
        : code === '23502' || code === '23514' || code === '22P02'
          ? 400
          : 500;
    if (status === 500) this.logger.error('Database operation failed');
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        message:
          status === 409
            ? 'Conflicting resource or concurrent change; retry if appropriate'
            : status === 400
              ? 'Invalid data'
              : 'Database operation failed',
      });
  }
}

import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual, createHash } from 'crypto';
import { Request } from 'express';
import { apiKeys } from '../config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}
  private readonly keys = apiKeys();
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Only the dedicated controller can bypass credentials; never match arbitrary URLs.
    if (
      this.reflector.get<boolean>('publicHealth', context.getClass()) === true
    )
      return true;
    const supplied = request.header('x-api-key');
    if (!supplied) throw new UnauthorizedException();
    const equal = (key: string) =>
      timingSafeEqual(
        createHash('sha256').update(supplied).digest(),
        createHash('sha256').update(key).digest(),
      );
    if (equal(this.keys.write)) return true;
    if (!equal(this.keys.read)) throw new UnauthorizedException();
    if (!['GET', 'HEAD'].includes(request.method))
      throw new ForbiddenException('Read-only credential');
    return true;
  }
}

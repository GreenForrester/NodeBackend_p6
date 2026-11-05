import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
describe('API credentials', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.API_READ_KEY = 'r'.repeat(32);
    process.env.API_WRITE_KEY = 'w'.repeat(32);
  });
  afterAll(() => {
    process.env = env;
  });
  function context(method: string, key?: string): ExecutionContext {
    return {
      getClass: () => class CustomersController {},
      switchToHttp: () => ({
        getRequest: () => ({ method, header: () => key }),
      }),
    } as unknown as ExecutionContext;
  }
  it('denies anonymous requests', () =>
    expect(() => new AuthGuard().canActivate(context('GET'))).toThrow(
      UnauthorizedException,
    ));
  it('denies writes with a read key', () =>
    expect(() =>
      new AuthGuard().canActivate(context('PATCH', 'r'.repeat(32))),
    ).toThrow(ForbiddenException));
  it('allows reads with a read key', () =>
    expect(new AuthGuard().canActivate(context('GET', 'r'.repeat(32)))).toBe(
      true,
    ));
  it('allows writes with a write key', () =>
    expect(new AuthGuard().canActivate(context('POST', 'w'.repeat(32)))).toBe(
      true,
    ));
});

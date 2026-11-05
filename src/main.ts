import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setup } from './setup';
import { integer } from './config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  setup(app);
  await app.listen(integer('PORT', 3000), '0.0.0.0');
}
void bootstrap().catch((error: unknown) => {
  Logger.error(error);
  process.exitCode = 1;
});

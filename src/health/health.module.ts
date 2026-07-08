import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [TerminusModule, MessagingModule],
  controllers: [HealthController],
})
export class HealthModule {}

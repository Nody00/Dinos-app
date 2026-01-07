import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventOutboxRepository } from './outbox/event-outbox.repository';
import { EventOutboxService } from './outbox/event-outbox.service';
import { EventPublisherService } from './outbox/event-publisher.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [EventOutboxRepository, EventOutboxService, EventPublisherService],
  exports: [EventOutboxService, EventOutboxRepository],
})
export class EventsCommonModule {}

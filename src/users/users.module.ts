import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserCreatedHandler } from './events/handlers/user-created.handler';
import { UserUpdatedHandler } from './events/handlers/user-updated.handler';
import { UserDeletedHandler } from './events/handlers/user-deleted.handler';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserCreatedHandler,
    UserUpdatedHandler,
    UserDeletedHandler,
  ],
  exports: [UsersService],
})
export class UsersModule {}

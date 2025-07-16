import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeormExceptionFilter } from './common/filters/typeorm-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [UsersModule, RolesModule, GroupsModule, ApplicationsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: TypeormExceptionFilter,
    },
  ],
})
export class AppModule {}

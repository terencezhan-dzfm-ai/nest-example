import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [UsersModule, RolesModule, GroupsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

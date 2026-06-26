import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional } from 'class-validator';

import { type JwtUserPayload } from '../auth/auth.types';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  priceDropsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  receiptOutcomesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  optimizationReadyEnabled?: boolean;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  list(
    @CurrentUser() user: JwtUserPayload,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.list(user.sub, unreadOnly === 'true');
  }

  @Patch('notifications/:id/read')
  markRead(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('notifications/read-all')
  markAllRead(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Get('notification-preferences')
  preferences(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Patch('notification-preferences')
  updatePreferences(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.sub, body);
  }
}

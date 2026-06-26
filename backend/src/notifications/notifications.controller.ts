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
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

class RequestEmailDestinationDto {
  @IsEmail()
  email!: string;
}

class ConfirmEmailDestinationDto {
  @IsString()
  token!: string;
}

class UnsubscribeEmailDto {
  @IsString()
  token!: string;

  @IsOptional()
  @IsIn(['all', 'price_drop', 'receipt_outcome', 'optimization'])
  category?: 'all' | 'price_drop' | 'receipt_outcome' | 'optimization';
}

class RegisterPushDeviceDto {
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsString()
  @MinLength(16)
  deviceToken!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  list(
    @CurrentUser() user: JwtUserPayload,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.list(user.sub, unreadOnly === 'true');
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Get('notification-preferences')
  @UseGuards(JwtAuthGuard)
  preferences(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Patch('notification-preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.sub, body);
  }

  @Get('notification-email-destination')
  @UseGuards(JwtAuthGuard)
  emailDestination(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.getEmailDestination(user.sub);
  }

  @Post('notification-email-destination')
  @UseGuards(JwtAuthGuard)
  requestEmailDestination(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: RequestEmailDestinationDto,
  ) {
    return this.notificationsService.requestEmailDestination(
      user.sub,
      body.email,
    );
  }

  @Post('notification-email-destination/confirm')
  confirmEmailDestination(@Body() body: ConfirmEmailDestinationDto) {
    return this.notificationsService.confirmEmailDestination(body.token);
  }

  @Post('notification-email-unsubscribe')
  unsubscribeEmail(@Body() body: UnsubscribeEmailDto) {
    return this.notificationsService.unsubscribeEmail(body);
  }

  @Get('notification-push-devices')
  @UseGuards(JwtAuthGuard)
  pushDevices(@CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.listPushDevices(user.sub);
  }

  @Post('notification-push-devices')
  @UseGuards(JwtAuthGuard)
  registerPushDevice(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: RegisterPushDeviceDto,
  ) {
    return this.notificationsService.registerPushDevice(user.sub, body);
  }

  @Post('notification-push-devices/:id/revoke')
  @UseGuards(JwtAuthGuard)
  revokePushDevice(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.notificationsService.revokePushDevice(user.sub, id);
  }
}

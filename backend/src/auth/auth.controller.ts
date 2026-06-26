import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePreferredRegionDto } from './dto/update-preferred-region.dto';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { type JwtUserPayload } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respondWithSession(await this.authService.register(body), response);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respondWithSession(await this.authService.login(body), response);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.respondWithSession(
      await this.authService.refresh(this.readRefreshCookie(request)),
      response,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(this.readRefreshCookie(request));
    this.clearRefreshCookie(response);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtUserPayload) {
    return this.authService.getCurrentUser(user.sub);
  }

  @Patch('preferred-region')
  @UseGuards(JwtAuthGuard)
  async updatePreferredRegion(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: UpdatePreferredRegionDto,
  ) {
    return this.authService.updatePreferredRegion(user.sub, body.regionSlug);
  }

  private respondWithSession(
    session: Awaited<ReturnType<AuthService['login']>>,
    response: Response,
  ) {
    this.setRefreshCookie(response, session.refreshToken);
    const { refreshToken: _refreshToken, ...publicSession } = session;
    return publicSession;
  }

  private readRefreshCookie(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    return cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('pricely_refresh='))
      ?.split('=')
      .slice(1)
      .join('=');
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie('pricely_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie('pricely_refresh', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
  }
}

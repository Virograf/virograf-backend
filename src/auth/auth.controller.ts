import { Body, Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(
        @Request() req,
        @Body() refreshTokenDto: RefreshTokenDto,
    ) {
        // Extract the token from the Authorization header
      const authHeader = req.headers.authorization || '';
      const accessToken = authHeader.split(' ')[1];
      return this.authService.refreshTokens(
        req.user.userId,
        refreshTokenDto.refreshToken,
        accessToken
      );
    }


    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization || '';
        const accessToken = authHeader.split(' ')[1];

        return this.authService.logout(req.user.userId, accessToken);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @HttpCode(HttpStatus.OK)
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

}

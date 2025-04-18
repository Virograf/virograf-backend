import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private tokenBlacklistService: TokenBlacklistService,
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        try {
            const user = await this.usersService.findByEmail(email, true);
            if (user && await bcrypt.compare(password, user.password)) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { password, refreshToken, ...result } = user;
              return result;
            }
            return null;
          } catch (error) {
            throw new UnauthorizedException('Authentication failed');
        }
    }

    async getTokens(userId: number, email: string) {
        const [accessToken, refreshToken] = await Promise.all([
          this.jwtService.signAsync(
            { sub: userId, email },
            {
              secret: this.configService.get<string>('JWT_SECRET'),
              expiresIn: '1h',
            },
          ),
          this.jwtService.signAsync(
            { sub: userId, email },
            {
              secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
              expiresIn: '7d',
            },
          ),
        ]);
    
        return {
          accessToken,
          refreshToken,
        };
    }
    
    async updateRefreshToken(userId: number, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(userId, {
          refreshToken: hashedRefreshToken,
        });
    }

    async login(loginDto: LoginDto) {
        try {
            const user = await this.validateUser(loginDto.email, loginDto.password);
            if (!user) {
                throw new UnauthorizedException('Invalid email or password');
            }
        
            const tokens = await this.getTokens(user.id, user.email);
            await this.updateRefreshToken(user.id, tokens.refreshToken)
            return {
                user: await this.usersService.findOne(user.id),
                ...tokens
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException('Login failed. Please try again later.');
        }
    }

    async register(createUserDto: CreateUserDto) {
        try {
          // The UsersService.create method already checks for existing email
          // and hashes the password, so we can use it directly
          const newUser = await this.usersService.create(createUserDto);

          const tokens = await this.getTokens(newUser.id, newUser.email);
          await this.updateRefreshToken(newUser.id, tokens.refreshToken);
          
          return {
            user: newUser,
            ...tokens,
          };
        } catch (error) {
          if (error.message.includes('already exists')) {
            throw new ConflictException('User with this email already exists');
          }
          throw new BadRequestException('Registration failed. Please try again later.');;
        }
    }

    async refreshTokens(userId: number, refreshToken: string, currentAccessToken: string) {
        try {
          const user = await this.usersService.findByIdWithRefreshToken(userId);
          
          if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
          }
          
          const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
          
          if (!refreshTokenMatches) {
            throw new UnauthorizedException('Access denied');
          }

           // Blacklist the current access token
          if (currentAccessToken) {
            await this.tokenBlacklistService.blacklist(currentAccessToken);
          }
          
          const tokens = await this.getTokens(user.id, user.email);
          await this.updateRefreshToken(user.id, tokens.refreshToken);
          
          return tokens;
        } catch (error) {
          throw new UnauthorizedException('Could not refresh tokens');
        }
    }

    async logout(userId: number, accessToken: string) {
        try {
           // Blacklist the current access token
          if (accessToken) {
            await this.tokenBlacklistService.blacklist(accessToken);
          }
          // Clear refresh token in database
          return this.usersService.update(userId, { refreshToken: null });
        } catch (error) {
          throw new BadRequestException('Logout failed');
        }
    }

    async getProfile(userId: number) {
        try {
            return this.usersService.findOne(userId);
          } catch (error) {
            throw new BadRequestException('Could not retrieve profile');
        }
    }
}

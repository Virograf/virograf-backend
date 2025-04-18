import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, UseGuards, Request, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) {}
    

    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
        try {
          return await this.profilesService.create(req.user.userId, createProfileDto);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw new ConflictException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('Failed to create profile');
        }
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll() {
        try {
            return await this.profilesService.findAll();
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve profiles');
        }
      }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async findMyProfile(@Request() req) {
        try {
            return await this.profilesService.findByUserId(req.user.userId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                return { profileExists: false, message: 'Profile not found' }
            }
            throw new InternalServerErrorException('Failed to retrieve profile');
        }
    }

    /**
   * Check if the authenticated user has a profile
   */
    @UseGuards(JwtAuthGuard)
    @Get('me/exists')
    @HttpCode(HttpStatus.OK)
    async checkProfileExists(@Request() req) {
        try {
            const exists = await this.profilesService.hasProfile(req.user.userId);
            return { exists };
        } catch (error) {
            throw new InternalServerErrorException('Failed to check profile existence');
        }
    }



    /**
   * Update the authenticated user's profile
   */
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @HttpCode(HttpStatus.OK)
    async updateMyProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        try {
            return await this.profilesService.updateByUserId(req.user.userId, updateProfileDto);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to update profile');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeMyProfile(@Request() req) {
        try {
            await this.profilesService.removeByUserId(req.user.userId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException('Profile not found');
            }
            throw new InternalServerErrorException('Failed to delete profile');
        } 
    }
      

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
        try {
            return await this.profilesService.update(+id, updateProfileDto);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to update profile');
        }
    }

     /**
   * Get a specific profile by ID
   */
     @UseGuards(JwtAuthGuard)
     @Get(':id')
     @HttpCode(HttpStatus.OK)
     async findOne(@Param('id') id: string) {
         try {
             return await this.profilesService.findOne(+id);
         } catch (error) {
             if (error instanceof NotFoundException) {
                 throw new NotFoundException(error.message);
             }
             throw new InternalServerErrorException('Failed to retrieve profile');
         }
     }

    

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        try {
            await this.profilesService.remove(+id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException('Failed to delete profile');
        }
    }

    

    @UseGuards(JwtAuthGuard)
    @Get('me/matches')
    @HttpCode(HttpStatus.OK)
    async findMyMatches(@Request() req) {
        try {
            return await this.profilesService.findMatches(req.user.userId);
        } catch (error) {
            if (error instanceof BadRequestException) {
            throw new BadRequestException(error.message);
        }
        throw new InternalServerErrorException('Failed to find matches');
    }
  }


}

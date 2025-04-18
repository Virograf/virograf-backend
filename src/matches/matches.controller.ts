import { BadRequestException, Controller, Get, HttpCode, Request, HttpStatus, InternalServerErrorException, Post, UseGuards, NotFoundException, Param, Body, Patch } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';

@Controller('matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) {}


    /**
   * Generate matches for the authenticated user
   */
    @UseGuards(JwtAuthGuard)
    @Post('generate')
    @HttpCode(HttpStatus.OK)
    async generateMatches(@Request() req) {
        try {
            return await this.matchesService.generateMatches(req.user.userId);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to generate matches');
        }
    }

    /**
   * Get all matches for the authenticated user
   */
    @UseGuards(JwtAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getMatches(@Request() req) {
        try {
            return await this.matchesService.getMatches(req.user.userId);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to retrieve matches');
        }
    }

    /**
   * Get a specific match by ID
   */
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getMatch(@Param('id') id: string, @Request() req) {
        try {
            return await this.matchesService.getMatch(+id, req.user.userId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to retrieve match');
        }
    }

    /**
   * Update match status (accept, reject, etc.)
   */
    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    async updateMatchStatus(
        @Param('id') id: string,
        @Body() updateMatchStatusDto: UpdateMatchStatusDto,
        @Request() req,
    ) {
        try {
            return await this.matchesService.updateMatchStatus(
                +id,
                req.user.userId,
                updateMatchStatusDto,
            );
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw new InternalServerErrorException('Failed to update match status');
        }
    }
}

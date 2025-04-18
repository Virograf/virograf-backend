import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PERSONALITY_TRAITS, SKILL_CATEGORIES } from '../constants';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private profilesRepository: Repository<Profile>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private dataSource: DataSource
    ) {}

    async create(userId: number, createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
        this.validateSkillsAndTraits(createProfileDto);
    
        // Use a transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Check if user exists
            const user = await this.usersRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            // Check if profile already exists for this user
            const existingProfile = await this.profilesRepository.findOne({
                where: { user: { id: userId } },
            });
        
            if (existingProfile) {
                throw new ConflictException('Profile already exists for this user');
            }

            // Create new profile
            const profile = this.profilesRepository.create({
                ...createProfileDto,
                user,
            });

            const savedProfile = await queryRunner.manager.save(profile);
            await queryRunner.commitTransaction();
            
            return new ProfileResponseDto(savedProfile);
        } catch (error) {
            await queryRunner.rollbackTransaction();
        
            if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
        
            throw new InternalServerErrorException('Failed to create profile: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

     /**
      * Find all profiles (admin only)
      */
    async findAll(): Promise<ProfileResponseDto[]> {
        try {
            const profiles = await this.profilesRepository.find({
                relations: ['user'],
            });
      
            return profiles.map(profile => new ProfileResponseDto(profile));
        } catch (error) {
            throw new InternalServerErrorException('Failed to retrieve profiles: ' + error.message);
        }
    }

    async findOne(id: number): Promise<ProfileResponseDto> {
        try {
            const profile = await this.profilesRepository.findOne({
                where: { id },
                relations: ['user'],
            });
              
            if (!profile) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
              
            return new ProfileResponseDto(profile);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
              }
              
              throw new InternalServerErrorException('Failed to retrieve profile: ' + error.message);
        }
    }

    async findByUserId(userId: number): Promise<ProfileResponseDto> {
        try {
            const profile = await this.profilesRepository.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
              
            if (!profile) {
                throw new NotFoundException(`Profile not found for user with ID ${userId}`);
            }
              
            return new ProfileResponseDto(profile);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
              
            throw new InternalServerErrorException('Failed to retrieve profile: ' + error.message);
        }
    }

    async hasProfile(userId: number): Promise<boolean> {
        try {
          const profile = await this.profilesRepository.findOne({
            where: { user: { id: userId } },
          });
          
          return !!profile;
        } catch (error) {
          throw new InternalServerErrorException('Failed to check profile existence: ' + error.message);
        }
    }

    async updateByUserId(userId: number, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            // Get the existing profile
            const profile = await this.profilesRepository.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
          
            if (!profile) {
                throw new NotFoundException(`Profile not found for user with ID ${userId}`);
            }
          
            // Apply updates to the entity instance directly
            Object.assign(profile, updateProfileDto);
            
            // Save the entity instance
            const savedProfile = await queryRunner.manager.save(profile);
            await queryRunner.commitTransaction();
            
            return new ProfileResponseDto(savedProfile);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            
            throw new InternalServerErrorException(`Failed to update profile: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
        // Validate skills and personality traits if they're being updated
        this.validateSkillsAndTraits(updateProfileDto);
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            // Get the existing profile
            const profile = await this.profilesRepository.findOne({
                where: { id },
                relations: ['user'],
            });
          
            if (!profile) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
          
            // Apply updates
            const updatedProfile = { ...profile, ...updateProfileDto };
          
            // Save the updated profile
            const savedProfile = await queryRunner.manager.save(updatedProfile);
            await queryRunner.commitTransaction();
          
            return new ProfileResponseDto(savedProfile);
        } catch (error) {
            await queryRunner.rollbackTransaction();
          
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
          
            throw new InternalServerErrorException('Failed to update profile: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }


    /**
   * Delete a profile by ID
   */
    async remove(id: number): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const profile = await this.profilesRepository.findOne({
                where: { id },
            });
          
            if (!profile) {
                throw new NotFoundException(`Profile with ID ${id} not found`);
            }
          
            await queryRunner.manager.remove(profile);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException) {
                throw error;
            }
          
            throw new InternalServerErrorException('Failed to delete profile: ' + error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async removeByUserId(userId: number): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const profile = await this.profilesRepository.findOne({
                where: { user: { id: userId } },
            });
          
            if (!profile) {
                throw new NotFoundException(`Profile not found for user with ID ${userId}`);
            }
          
            await queryRunner.manager.remove(profile);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            
            if (error instanceof NotFoundException) {
                throw error;
            }
          
            throw new InternalServerErrorException('Failed to delete profile: ' + error.message);
        } finally {
            await queryRunner.release();
        }
      }

    /**
   * Find profiles based on matching criteria
   * (This is a placeholder for the matching algorithm we'll implement later)
   */
    async findMatches(userId: number): Promise<ProfileResponseDto[]> {
        try {
            // First check if the user has a profile
            const userProfile = await this.findByUserId(userId);
          
            // For now, just return all other profiles
            // (We'll replace this with actual matching algorithm later)
            const allProfiles = await this.profilesRepository.find({
                where: { user: { id: Not(userId) } },
                relations: ['user'],
            });
          
            return allProfiles.map(profile => new ProfileResponseDto(profile));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new BadRequestException('You must create a profile before finding matches');
            }
            
            throw new InternalServerErrorException('Failed to find matches: ' + error.message);
        }
    }

    private validateSkillsAndTraits(profileDto: CreateProfileDto | UpdateProfileDto): void {
        // Validate personality traits
        if (profileDto.personalityTraits) {
          const invalidTraits = profileDto.personalityTraits.filter(
            trait => !PERSONALITY_TRAITS.includes(trait)
          );
          
          if (invalidTraits.length > 0) {
            throw new BadRequestException(`Invalid personality traits: ${invalidTraits.join(', ')}`);
          }
        }
        
        // Validate preferred personality traits
        if (profileDto.preferredPersonalityTraits) {
          const invalidTraits = profileDto.preferredPersonalityTraits.filter(
            trait => !PERSONALITY_TRAITS.includes(trait)
          );
          
          if (invalidTraits.length > 0) {
            throw new BadRequestException(`Invalid preferred personality traits: ${invalidTraits.join(', ')}`);
          }
        }
        
        // Validate skills
        if (profileDto.skills) {
          const invalidSkills = profileDto.skills.filter(
            skill => !SKILL_CATEGORIES.includes(skill)
          );
          
          if (invalidSkills.length > 0) {
            throw new BadRequestException(`Invalid skills: ${invalidSkills.join(', ')}`);
          }
        }
        
        // Validate preferred skills
        if (profileDto.preferredSkills) {
          const invalidSkills = profileDto.preferredSkills.filter(
            skill => !SKILL_CATEGORIES.includes(skill)
          );
          
          if (invalidSkills.length > 0) {
            throw new BadRequestException(`Invalid preferred skills: ${invalidSkills.join(', ')}`);
          }
        }
    }
}

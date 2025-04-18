import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async create(createUserDto: CreateUserDto): Promise<UserDto> {
        const existingUser = await this.findByEmail(createUserDto.email, true);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword
        });
        const savedUser = await this.usersRepository.save(user);
        return new UserDto(savedUser);
    }

    async findOne(id: number): Promise<UserDto> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return new UserDto(user);
    }

    async findByEmail(email: string, includePassword = false): Promise<any> {
        const user  = await this.usersRepository.findOne({ where: {email}});
        if (!user) {
            return undefined;
        }

        if(includePassword) {
            return user;
        }

        return new UserDto(user);
    }

    async update(id: number, updateData: Partial<User>): Promise<UserDto> {
        await this.usersRepository.update(id, updateData);
        const updatedUser = await this.findOne(id);
        return updatedUser;
    }

    async findByIdWithRefreshToken(id: number): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { id } });
    }
}

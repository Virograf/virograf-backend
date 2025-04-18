import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    
    if (!userId) {
      throw new UnauthorizedException();
    }
    
    const user = await this.usersService.findOne(userId);
    
    if (!user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    
    return true;
  }
}
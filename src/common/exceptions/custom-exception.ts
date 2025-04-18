import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseException extends HttpException {
  constructor(message: string = 'Database operation failed') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class AuthenticationException extends HttpException {
  constructor(message: string = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends HttpException {
  constructor(message: string = 'Validation failed') {
    super({ message, errors: {} }, HttpStatus.BAD_REQUEST);
  }
}
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

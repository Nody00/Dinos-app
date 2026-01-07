import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';

class CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserDto,
    @Request() req: { user?: { id: string } },
  ) {
    // Get actor ID from authenticated user if available
    const actorId = req.user?.id;
    return await this.usersService.create(dto, actorId);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user?: { id: string } },
  ) {
    // Get actor ID from authenticated user if available
    const actorId = req.user?.id;
    return await this.usersService.update(id, dto, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } },
  ) {
    // Get actor ID from authenticated user if available
    const actorId = req.user?.id;
    await this.usersService.delete(id, actorId);
  }
}

import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.favoritesService.findAll(user.id);
  }

  @Get('check/:songId')
  check(@CurrentUser() user: AuthUser, @Param('songId') songId: string) {
    return this.favoritesService.check(user.id, songId);
  }

  @Post(':songId')
  add(@CurrentUser() user: AuthUser, @Param('songId') songId: string) {
    return this.favoritesService.add(user.id, songId);
  }

  @Delete(':songId')
  remove(@CurrentUser() user: AuthUser, @Param('songId') songId: string) {
    return this.favoritesService.remove(user.id, songId);
  }
}

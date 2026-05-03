import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SongStatus, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSongDto, UpdateSongDto } from './dto';
import { SongsService } from './songs.service';

type RequestWithOptionalUser = Request & {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
};

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('artistId') artistId?: string,
    @Query('genre') genre?: string,
    @Query('status') status?: SongStatus,
    @Query('includeDrafts') includeDrafts?: string,
    @Req() request?: RequestWithOptionalUser,
  ) {
    return this.songsService.findAll(
      {
        search,
        artistId,
        genre,
        status,
        includeDrafts: includeDrafts === 'true',
      },
      request?.user,
    );
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAllForAdmin() {
    return this.songsService.findAllForAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findById(@Param('id') id: string) {
    return this.songsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateSongDto, @Req() request: RequestWithOptionalUser) {
    return this.songsService.create(dto, request.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  update(@Param('id') id: string, @Body() dto: UpdateSongDto) {
    return this.songsService.update(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  publish(@Param('id') id: string) {
    return this.songsService.publish(id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  archive(@Param('id') id: string) {
    return this.songsService.archive(id);
  }

  @Post(':id/view')
  registerView(@Param('id') id: string) {
    return this.songsService.registerView(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.songsService.remove(id);
  }

  // IMPORTANTE: rota dinâmica sempre por último
  @Get(':artistSlug/:songSlug')
  findPublicBySlugs(
    @Param('artistSlug') artistSlug: string,
    @Param('songSlug') songSlug: string,
  ) {
    return this.songsService.findPublicBySlugs(artistSlug, songSlug);
  }
}
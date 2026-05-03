import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AudioTrackStatus, AudioTrackType, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AudioTracksService } from './audio-tracks.service';
import { CreateAudioTrackDto, UpdateAudioTrackDto } from './dto';

@Controller('audio-tracks')
export class AudioTracksController {
  constructor(private readonly audioTracksService: AudioTracksService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('songId') songId?: string,
    @Query('type') type?: AudioTrackType,
    @Query('status') status?: AudioTrackStatus,
    @Query('includeDrafts') includeDrafts?: string,
  ) {
    return this.audioTracksService.findAll({
      search,
      songId,
      type,
      status,
      includeDrafts: includeDrafts === 'true',
    });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAllForAdmin() {
    return this.audioTracksService.findAllForAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findByIdForAdmin(@Param('id') id: string) {
    return this.audioTracksService.findByIdForAdmin(id);
  }

  @Get('song/:songId')
  findBySong(@Param('songId') songId: string) {
    return this.audioTracksService.findBySong(songId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.audioTracksService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateAudioTrackDto) {
    return this.audioTracksService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  update(@Param('id') id: string, @Body() dto: UpdateAudioTrackDto) {
    return this.audioTracksService.update(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  publish(@Param('id') id: string) {
    return this.audioTracksService.publish(id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  archive(@Param('id') id: string) {
    return this.audioTracksService.archive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.audioTracksService.remove(id);
  }
}

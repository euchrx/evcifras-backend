import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AddSongToRepertoireDto,
  CreateRepertoireDto,
  UpdateRepertoireDto,
  UpdateRepertoireItemPositionDto,
} from './dto';
import { RepertoiresService } from './repertoires.service';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

@UseGuards(JwtAuthGuard)
@Controller('repertoires')
export class RepertoiresController {
  constructor(private readonly repertoiresService: RepertoiresService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.repertoiresService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.repertoiresService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRepertoireDto) {
    return this.repertoiresService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRepertoireDto,
  ) {
    return this.repertoiresService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.repertoiresService.remove(user.id, id);
  }

  @Post(':id/songs')
  addSong(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddSongToRepertoireDto,
  ) {
    return this.repertoiresService.addSong(user.id, id, dto);
  }

  @Patch(':id/items/:itemId/position')
  updateItemPosition(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateRepertoireItemPositionDto,
  ) {
    return this.repertoiresService.updateItemPosition(user.id, id, itemId, dto);
  }

  @Delete(':id/songs/:songId')
  removeSong(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('songId') songId: string,
  ) {
    return this.repertoiresService.removeSong(user.id, id, songId);
  }
}

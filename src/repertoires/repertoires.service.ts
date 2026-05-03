import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddSongToRepertoireDto,
  CreateRepertoireDto,
  UpdateRepertoireDto,
  UpdateRepertoireItemPositionDto,
} from './dto';

@Injectable()
export class RepertoiresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.repertoire.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const repertoire = await this.prisma.repertoire.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
          include: {
            song: {
              include: {
                artist: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    imageUrl: true,
                    mainGenre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!repertoire) {
      throw new NotFoundException('Repertório não encontrado.');
    }

    return repertoire;
  }

  async create(userId: string, dto: CreateRepertoireDto) {
    const name = dto.name.trim();

    return this.prisma.repertoire.create({
      data: {
        userId,
        name,
        description: this.cleanOptional(dto.description),
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateRepertoireDto) {
    await this.ensureRepertoireOwner(userId, id);

    return this.prisma.repertoire.update({
      where: {
        id,
      },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description:
          dto.description !== undefined
            ? this.cleanOptional(dto.description)
            : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureRepertoireOwner(userId, id);

    await this.prisma.repertoire.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Repertório excluído com sucesso.',
    };
  }

  async addSong(userId: string, repertoireId: string, dto: AddSongToRepertoireDto) {
    await this.ensureRepertoireOwner(userId, repertoireId);

    const song = await this.prisma.song.findUnique({
      where: {
        id: dto.songId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!song || song.status !== 'PUBLISHED') {
      throw new NotFoundException('Música não encontrada ou não publicada.');
    }

    const existingItem = await this.prisma.repertoireItem.findUnique({
      where: {
        repertoireId_songId: {
          repertoireId,
          songId: dto.songId,
        },
      },
    });

    if (existingItem) {
      throw new ConflictException('Esta música já está neste repertório.');
    }

    const position =
      dto.position !== undefined
        ? dto.position
        : await this.getNextPosition(repertoireId);

    return this.prisma.repertoireItem.create({
      data: {
        repertoireId,
        songId: dto.songId,
        position,
      },
      include: {
        song: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                mainGenre: true,
              },
            },
          },
        },
      },
    });
  }

  async updateItemPosition(
    userId: string,
    repertoireId: string,
    itemId: string,
    dto: UpdateRepertoireItemPositionDto,
  ) {
    await this.ensureRepertoireOwner(userId, repertoireId);

    const item = await this.prisma.repertoireItem.findFirst({
      where: {
        id: itemId,
        repertoireId,
      },
    });

    if (!item) {
      throw new NotFoundException('Item do repertório não encontrado.');
    }

    return this.prisma.repertoireItem.update({
      where: {
        id: itemId,
      },
      data: {
        position: dto.position,
      },
    });
  }

  async removeSong(userId: string, repertoireId: string, songId: string) {
    await this.ensureRepertoireOwner(userId, repertoireId);

    const item = await this.prisma.repertoireItem.findUnique({
      where: {
        repertoireId_songId: {
          repertoireId,
          songId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Música não encontrada neste repertório.');
    }

    await this.prisma.repertoireItem.delete({
      where: {
        id: item.id,
      },
    });

    return {
      success: true,
      message: 'Música removida do repertório.',
    };
  }

  private async ensureRepertoireOwner(userId: string, id: string) {
    const repertoire = await this.prisma.repertoire.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!repertoire) {
      throw new NotFoundException('Repertório não encontrado.');
    }

    return repertoire;
  }

  private async getNextPosition(repertoireId: string) {
    const lastItem = await this.prisma.repertoireItem.findFirst({
      where: {
        repertoireId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    return lastItem ? lastItem.position + 1 : 0;
  }

  private cleanOptional(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
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

  async check(userId: string, songId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    return {
      favorited: Boolean(favorite),
      favoriteId: favorite?.id ?? null,
    };
  }

  async add(userId: string, songId: string) {
    const song = await this.prisma.song.findUnique({
      where: {
        id: songId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!song || song.status !== 'PUBLISHED') {
      throw new NotFoundException('Música não encontrada ou não publicada.');
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Esta música já está nos seus favoritos.');
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        songId,
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

  async remove(userId: string, songId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_songId: {
          userId,
          songId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorito não encontrado.');
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return {
      success: true,
      message: 'Música removida dos favoritos.',
    };
  }
}

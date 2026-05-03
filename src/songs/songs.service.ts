import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SongStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto, UpdateSongDto } from './dto';

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type FindAllSongsFilters = {
  search?: string;
  artistId?: string;
  genre?: string;
  status?: SongStatus;
  includeDrafts?: boolean;
};

@Injectable()
export class SongsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filters: FindAllSongsFilters = {}, user?: AuthenticatedUser) {
    const canSeeDrafts =
      user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

    const normalizedSearch = filters.search?.trim();
    const normalizedGenre = filters.genre?.trim();

    const statusFilter = this.resolveStatusFilter({
      requestedStatus: filters.status,
      includeDrafts: filters.includeDrafts,
      canSeeDrafts,
    });

    return this.prisma.song.findMany({
      where: {
        status: statusFilter,
        ...(filters.artistId
          ? {
            artistId: filters.artistId,
          }
          : {}),
        ...(normalizedGenre
          ? {
            genre: {
              equals: normalizedGenre,
              mode: 'insensitive',
            },
          }
          : {}),
        ...(normalizedSearch
          ? {
            OR: [
              {
                title: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                lyrics: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                chords: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                artist: {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
          : {}),
      },
      orderBy: [
        {
          views: 'desc',
        },
        {
          title: 'asc',
        },
      ],
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.song.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
            mainGenre: true,
          },
        },
      },
    });
  }

  async findPublicBySlugs(artistSlug: string, songSlug: string) {
    const song = await this.prisma.song.findFirst({
      where: {
        slug: songSlug,
        status: SongStatus.PUBLISHED,
        artist: {
          slug: artistSlug,
          active: true,
        },
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            bio: true,
            mainGenre: true,
          },
        },
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    return song;
  }

  async findById(id: string) {
    const song = await this.prisma.song.findUnique({
      where: {
        id,
      },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    return song;
  }

  async create(dto: CreateSongDto, user: AuthenticatedUser) {
    const artist = await this.prisma.artist.findUnique({
      where: {
        id: dto.artistId,
      },
    });

    if (!artist || !artist.active) {
      throw new NotFoundException('Artista não encontrado.');
    }

    const title = dto.title.trim();
    const slug = await this.generateUniqueSlug(title, dto.artistId);

    const existingSong = await this.prisma.song.findFirst({
      where: {
        artistId: dto.artistId,
        title: {
          equals: title,
          mode: 'insensitive',
        },
      },
    });

    if (existingSong) {
      throw new ConflictException('Já existe uma música com este título para este artista.');
    }

    return this.prisma.song.create({
      data: {
        title,
        slug,
        artistId: dto.artistId,
        lyrics: dto.lyrics.trim(),
        chords: dto.chords.trim(),
        originalKey: this.cleanOptional(dto.originalKey),
        currentKey: this.cleanOptional(dto.currentKey),
        capo: this.cleanOptional(dto.capo),
        genre: this.cleanOptional(dto.genre),
        difficulty: dto.difficulty ?? 'BEGINNER',
        status: dto.status ?? 'DRAFT',
        youtubeUrl: this.cleanOptional(dto.youtubeUrl),
        createdById: user.id,
      },
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
    });
  }

  async update(id: string, dto: UpdateSongDto) {
    const song = await this.prisma.song.findUnique({
      where: {
        id,
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    let nextTitle = song.title;
    let nextArtistId = song.artistId;
    let nextSlug = song.slug;

    if (dto.artistId !== undefined && dto.artistId !== song.artistId) {
      const artist = await this.prisma.artist.findUnique({
        where: {
          id: dto.artistId,
        },
      });

      if (!artist || !artist.active) {
        throw new NotFoundException('Artista não encontrado.');
      }

      nextArtistId = dto.artistId;
    }

    if (dto.title !== undefined) {
      nextTitle = dto.title.trim();
    }

    if (dto.title !== undefined || dto.artistId !== undefined) {
      const titleAlreadyInUse = await this.prisma.song.findFirst({
        where: {
          id: {
            not: id,
          },
          artistId: nextArtistId,
          title: {
            equals: nextTitle,
            mode: 'insensitive',
          },
        },
      });

      if (titleAlreadyInUse) {
        throw new ConflictException('Já existe outra música com este título para este artista.');
      }

      nextSlug = await this.generateUniqueSlug(nextTitle, nextArtistId, id);
    }

    return this.prisma.song.update({
      where: {
        id,
      },
      data: {
        title: nextTitle,
        slug: nextSlug,
        artistId: nextArtistId,
        lyrics: dto.lyrics !== undefined ? dto.lyrics.trim() : undefined,
        chords: dto.chords !== undefined ? dto.chords.trim() : undefined,
        originalKey:
          dto.originalKey !== undefined ? this.cleanOptional(dto.originalKey) : undefined,
        currentKey:
          dto.currentKey !== undefined ? this.cleanOptional(dto.currentKey) : undefined,
        capo: dto.capo !== undefined ? this.cleanOptional(dto.capo) : undefined,
        genre: dto.genre !== undefined ? this.cleanOptional(dto.genre) : undefined,
        difficulty: dto.difficulty ?? undefined,
        status: dto.status ?? undefined,
        youtubeUrl:
          dto.youtubeUrl !== undefined ? this.cleanOptional(dto.youtubeUrl) : undefined,
      },
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
    });
  }

  async publish(id: string) {
    await this.ensureSongExists(id);

    return this.prisma.song.update({
      where: {
        id,
      },
      data: {
        status: SongStatus.PUBLISHED,
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async archive(id: string) {
    await this.ensureSongExists(id);

    return this.prisma.song.update({
      where: {
        id,
      },
      data: {
        status: SongStatus.ARCHIVED,
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async registerView(id: string) {
    await this.ensureSongExists(id);

    return this.prisma.song.update({
      where: {
        id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        views: true,
      },
    });
  }

  async remove(id: string) {
    const song = await this.prisma.song.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            favorites: true,
            repertoireItems: true,
          },
        },
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    if (song._count.favorites > 0 || song._count.repertoireItems > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma música que possui favoritos ou repertórios vinculados. Arquive a música em vez de excluir.',
      );
    }

    await this.prisma.song.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Música excluída com sucesso.',
    };
  }

  private resolveStatusFilter(params: {
    requestedStatus?: SongStatus;
    includeDrafts?: boolean;
    canSeeDrafts: boolean;
  }) {
    if (!params.canSeeDrafts) {
      return SongStatus.PUBLISHED;
    }

    if (params.requestedStatus) {
      return params.requestedStatus;
    }

    if (params.includeDrafts) {
      return undefined;
    }

    return SongStatus.PUBLISHED;
  }

  private async ensureSongExists(id: string) {
    const song = await this.prisma.song.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    return song;
  }

  private async generateUniqueSlug(title: string, artistId: string, ignoreSongId?: string) {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.song.findFirst({
        where: {
          artistId,
          slug,
        },
      });

      if (!existing || existing.id === ignoreSongId) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private cleanOptional(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }
}

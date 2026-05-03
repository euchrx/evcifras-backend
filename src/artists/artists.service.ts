import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto, UpdateArtistDto } from './dto';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.artist.findMany({
      where: {
        active: true,
        ...(normalizedSearch
          ? {
              OR: [
                {
                  name: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  mainGenre: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            songs: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const artist = await this.prisma.artist.findUnique({
      where: {
        slug,
      },
      include: {
        songs: {
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            title: 'asc',
          },
          select: {
            id: true,
            title: true,
            slug: true,
            originalKey: true,
            currentKey: true,
            genre: true,
            difficulty: true,
            views: true,
            createdAt: true,
          },
        },
      },
    });

    if (!artist || !artist.active) {
      throw new NotFoundException('Artista não encontrado.');
    }

    return artist;
  }

  async create(dto: CreateArtistDto) {
    const name = dto.name.trim();
    const slug = await this.generateUniqueSlug(name);

    const existingArtist = await this.prisma.artist.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingArtist) {
      throw new ConflictException('Já existe um artista com este nome.');
    }

    return this.prisma.artist.create({
      data: {
        name,
        slug,
        imageUrl: this.cleanOptional(dto.imageUrl),
        bio: this.cleanOptional(dto.bio),
        mainGenre: this.cleanOptional(dto.mainGenre),
      },
    });
  }

  async update(id: string, dto: UpdateArtistDto) {
    const artist = await this.prisma.artist.findUnique({
      where: {
        id,
      },
    });

    if (!artist) {
      throw new NotFoundException('Artista não encontrado.');
    }

    let nextSlug = artist.slug;
    let nextName = artist.name;

    if (dto.name !== undefined) {
      nextName = dto.name.trim();

      const nameAlreadyInUse = await this.prisma.artist.findFirst({
        where: {
          id: {
            not: id,
          },
          name: {
            equals: nextName,
            mode: 'insensitive',
          },
        },
      });

      if (nameAlreadyInUse) {
        throw new ConflictException('Já existe outro artista com este nome.');
      }

      if (nextName !== artist.name) {
        nextSlug = await this.generateUniqueSlug(nextName, id);
      }
    }

    return this.prisma.artist.update({
      where: {
        id,
      },
      data: {
        name: nextName,
        slug: nextSlug,
        imageUrl:
          dto.imageUrl !== undefined
            ? this.cleanOptional(dto.imageUrl)
            : undefined,
        bio: dto.bio !== undefined ? this.cleanOptional(dto.bio) : undefined,
        mainGenre:
          dto.mainGenre !== undefined
            ? this.cleanOptional(dto.mainGenre)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            songs: true,
          },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artista não encontrado.');
    }

    if (artist._count.songs > 0) {
      throw new BadRequestException(
        'Não é possível excluir um artista que possui músicas vinculadas.',
      );
    }

    await this.prisma.artist.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Artista excluído com sucesso.',
    };
  }

  private async generateUniqueSlug(name: string, ignoreArtistId?: string) {
    const baseSlug = this.slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.artist.findUnique({
        where: {
          slug,
        },
      });

      if (!existing || existing.id === ignoreArtistId) {
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
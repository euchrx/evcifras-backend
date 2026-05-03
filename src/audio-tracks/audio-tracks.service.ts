import { Injectable, NotFoundException } from '@nestjs/common';
import { AudioTrackStatus, AudioTrackType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAudioTrackDto, UpdateAudioTrackDto } from './dto';

type FindAllAudioTracksFilters = {
  search?: string;
  songId?: string;
  type?: AudioTrackType;
  status?: AudioTrackStatus;
  includeDrafts?: boolean;
};

@Injectable()
export class AudioTracksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FindAllAudioTracksFilters = {}) {
    const normalizedSearch = filters.search?.trim();

    return this.prisma.audioTrack.findMany({
      where: {
        ...(filters.includeDrafts
          ? {}
          : {
              status: AudioTrackStatus.PUBLISHED,
            }),
        ...(filters.songId
          ? {
              songId: filters.songId,
            }
          : {}),
        ...(filters.type
          ? {
              type: filters.type,
            }
          : {}),
        ...(filters.status
          ? {
              status: filters.status,
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
                  description: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  song: {
                    title: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  song: {
                    artist: {
                      name: {
                        contains: normalizedSearch,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            originalKey: true,
            currentKey: true,
            genre: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.audioTrack.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const track = await this.prisma.audioTrack.findUnique({
      where: {
        id,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            originalKey: true,
            currentKey: true,
            genre: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!track || track.status !== AudioTrackStatus.PUBLISHED) {
      throw new NotFoundException('Áudio não encontrado.');
    }

    return track;
  }

  async findByIdForAdmin(id: string) {
    const track = await this.prisma.audioTrack.findUnique({
      where: {
        id,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Áudio não encontrado.');
    }

    return track;
  }

  async findBySong(songId: string) {
    const song = await this.prisma.song.findUnique({
      where: {
        id: songId,
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    return this.prisma.audioTrack.findMany({
      where: {
        songId,
        status: AudioTrackStatus.PUBLISHED,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async create(dto: CreateAudioTrackDto) {
    const song = await this.prisma.song.findUnique({
      where: {
        id: dto.songId,
      },
    });

    if (!song) {
      throw new NotFoundException('Música não encontrada.');
    }

    return this.prisma.audioTrack.create({
      data: {
        title: dto.title.trim(),
        description: this.cleanOptional(dto.description),
        type: dto.type ?? AudioTrackType.OTHER,
        status: dto.status ?? AudioTrackStatus.DRAFT,
        audioUrl: dto.audioUrl.trim(),
        durationSec: dto.durationSec ?? null,
        sizeBytes: dto.sizeBytes ?? null,
        mimeType: this.cleanOptional(dto.mimeType),
        songId: dto.songId,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateAudioTrackDto) {
    await this.ensureTrackExists(id);

    if (dto.songId !== undefined) {
      const song = await this.prisma.song.findUnique({
        where: {
          id: dto.songId,
        },
      });

      if (!song) {
        throw new NotFoundException('Música não encontrada.');
      }
    }

    return this.prisma.audioTrack.update({
      where: {
        id,
      },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined
            ? this.cleanOptional(dto.description)
            : undefined,
        type: dto.type ?? undefined,
        status: dto.status ?? undefined,
        audioUrl: dto.audioUrl !== undefined ? dto.audioUrl.trim() : undefined,
        durationSec: dto.durationSec !== undefined ? dto.durationSec : undefined,
        sizeBytes: dto.sizeBytes !== undefined ? dto.sizeBytes : undefined,
        mimeType:
          dto.mimeType !== undefined ? this.cleanOptional(dto.mimeType) : undefined,
        songId: dto.songId ?? undefined,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async publish(id: string) {
    await this.ensureTrackExists(id);

    return this.prisma.audioTrack.update({
      where: {
        id,
      },
      data: {
        status: AudioTrackStatus.PUBLISHED,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async archive(id: string) {
    await this.ensureTrackExists(id);

    return this.prisma.audioTrack.update({
      where: {
        id,
      },
      data: {
        status: AudioTrackStatus.ARCHIVED,
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            slug: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.ensureTrackExists(id);

    await this.prisma.audioTrack.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Áudio excluído com sucesso.',
    };
  }

  private async ensureTrackExists(id: string) {
    const track = await this.prisma.audioTrack.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!track) {
      throw new NotFoundException('Áudio não encontrado.');
    }

    return track;
  }

  private cleanOptional(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }
}

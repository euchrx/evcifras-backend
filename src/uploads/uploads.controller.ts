import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';

const AUDIO_UPLOAD_DIR = join(process.cwd(), 'uploads', 'audio');

const allowedAudioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
]);

function ensureAudioUploadDir() {
  if (!existsSync(AUDIO_UPLOAD_DIR)) {
    mkdirSync(AUDIO_UPLOAD_DIR, {
      recursive: true,
    });
  }
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('audio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureAudioUploadDir();
          callback(null, AUDIO_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const originalExtension = extname(file.originalname);
          const baseName = sanitizeFileName(
            file.originalname.replace(originalExtension, ''),
          );

          const safeBaseName = baseName || 'audio';
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1_000_000_000);
          const filename = `${safeBaseName}-${timestamp}-${random}${originalExtension.toLowerCase()}`;

          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!allowedAudioMimeTypes.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Arquivo inválido. Envie um áudio MP3, WAV, M4A, AAC, OGG ou WEBM.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadAudio(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de áudio enviado.');
    }

    return this.uploadsService.buildAudioUploadResponse(file);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type CreatePresignedUploadInput = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly audioPrefix: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (!accountId) {
      throw new Error('R2_ACCOUNT_ID não configurado.');
    }

    if (!accessKeyId) {
      throw new Error('R2_ACCESS_KEY_ID não configurado.');
    }

    if (!secretAccessKey) {
      throw new Error('R2_SECRET_ACCESS_KEY não configurado.');
    }

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME não configurado.');
    }

    if (!publicUrl) {
      throw new Error('R2_PUBLIC_URL não configurado.');
    }

    this.bucketName = bucketName;
    this.publicUrl = publicUrl.replace(/\/$/, '');
    this.audioPrefix =
      this.configService.get<string>('R2_AUDIO_PREFIX') || 'audios';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createAudioPresignedUpload(input: CreatePresignedUploadInput) {
    this.validateAudioFile(input);

    const extension = this.getSafeExtension(input.fileName, input.contentType);
    const safeBaseName = this.sanitizeFileName(
      input.fileName.replace(/\.[^/.]+$/, ''),
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const random = crypto.randomUUID();
    const key = `${this.audioPrefix}/${year}/${month}/${safeBaseName}-${random}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: input.contentType,
    });

    const expiresIn = 60 * 5;

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    const publicAudioUrl = `${this.publicUrl}/${key}`;

    return {
      uploadUrl,
      publicUrl: publicAudioUrl,
      key,
      expiresIn,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    };
  }

  private validateAudioFile(input: CreatePresignedUploadInput) {
    const allowedTypes = new Set([
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
      'audio/wav',
      'audio/x-wav',
    ]);

    if (!allowedTypes.has(input.contentType)) {
      throw new BadRequestException(
        'Arquivo inválido. Envie MP3, M4A, AAC ou WAV.',
      );
    }

    const maxSizeBytes = 30 * 1024 * 1024;

    if (input.sizeBytes > maxSizeBytes) {
      throw new BadRequestException('O áudio deve ter no máximo 30 MB.');
    }
  }

  private sanitizeFileName(value: string) {
    const safeName = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return safeName || 'audio';
  }

  private getSafeExtension(fileName: string, contentType: string) {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.endsWith('.mp3')) {
      return '.mp3';
    }

    if (lowerFileName.endsWith('.m4a')) {
      return '.m4a';
    }

    if (lowerFileName.endsWith('.aac')) {
      return '.aac';
    }

    if (lowerFileName.endsWith('.wav')) {
      return '.wav';
    }

    if (contentType === 'audio/mpeg' || contentType === 'audio/mp3') {
      return '.mp3';
    }

    if (contentType === 'audio/mp4' || contentType === 'audio/x-m4a') {
      return '.m4a';
    }

    if (contentType === 'audio/aac') {
      return '.aac';
    }

    if (contentType === 'audio/wav' || contentType === 'audio/x-wav') {
      return '.wav';
    }

    return '.mp3';
  }
}

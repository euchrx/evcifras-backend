import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type UploadedAudioFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  buildAudioUploadResponse(file: UploadedAudioFile) {
    const publicBaseUrl =
      this.configService.get<string>('PUBLIC_BACKEND_URL') ||
      `http://localhost:${this.configService.get<string>('PORT') || '3000'}`;

    const normalizedBaseUrl = publicBaseUrl.replace(/\/$/, '');
    const audioUrl = `${normalizedBaseUrl}/uploads/audio/${file.filename}`;

    return {
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      audioUrl,
    };
  }
}

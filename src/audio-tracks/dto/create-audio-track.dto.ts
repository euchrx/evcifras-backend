import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AudioTrackStatus, AudioTrackType } from '@prisma/client';

export class CreateAudioTrackDto {
  @IsString({ message: 'Título deve ser um texto.' })
  @MaxLength(160, { message: 'Título deve ter no máximo 160 caracteres.' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto.' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres.' })
  description?: string;

  @IsOptional()
  @IsEnum(AudioTrackType, { message: 'Tipo de áudio inválido.' })
  type?: AudioTrackType;

  @IsOptional()
  @IsEnum(AudioTrackStatus, { message: 'Status inválido.' })
  status?: AudioTrackStatus;

  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'URL do áudio inválida.' },
  )
  audioUrl!: string;

  @IsOptional()
  @IsInt({ message: 'Duração deve ser um número inteiro.' })
  @Min(0, { message: 'Duração inválida.' })
  durationSec?: number;

  @IsOptional()
  @IsInt({ message: 'Tamanho deve ser um número inteiro.' })
  @Min(0, { message: 'Tamanho inválido.' })
  sizeBytes?: number;

  @IsOptional()
  @IsString({ message: 'MIME type deve ser um texto.' })
  @MaxLength(120, { message: 'MIME type deve ter no máximo 120 caracteres.' })
  mimeType?: string;

  @IsUUID('4', { message: 'songId inválido.' })
  songId!: string;
}

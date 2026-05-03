import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Difficulty, SongStatus } from '@prisma/client';

export class CreateSongDto {
  @IsString({ message: 'Título deve ser um texto.' })
  @MinLength(2, { message: 'Título deve ter no mínimo 2 caracteres.' })
  @MaxLength(160, { message: 'Título deve ter no máximo 160 caracteres.' })
  title!: string;

  @IsUUID('4', { message: 'artistId inválido.' })
  artistId!: string;

  @IsString({ message: 'Letra deve ser um texto.' })
  @MinLength(1, { message: 'Letra é obrigatória.' })
  lyrics!: string;

  @IsString({ message: 'Cifra deve ser um texto.' })
  @MinLength(1, { message: 'Cifra é obrigatória.' })
  chords!: string;

  @IsOptional()
  @IsString({ message: 'Tom original deve ser um texto.' })
  @MaxLength(20, { message: 'Tom original deve ter no máximo 20 caracteres.' })
  originalKey?: string;

  @IsOptional()
  @IsString({ message: 'Tom atual deve ser um texto.' })
  @MaxLength(20, { message: 'Tom atual deve ter no máximo 20 caracteres.' })
  currentKey?: string;

  @IsOptional()
  @IsString({ message: 'Capotraste deve ser um texto.' })
  @MaxLength(80, { message: 'Capotraste deve ter no máximo 80 caracteres.' })
  capo?: string;

  @IsOptional()
  @IsString({ message: 'Gênero deve ser um texto.' })
  @MaxLength(80, { message: 'Gênero deve ter no máximo 80 caracteres.' })
  genre?: string;

  @IsOptional()
  @IsEnum(Difficulty, { message: 'Dificuldade inválida.' })
  difficulty?: Difficulty;

  @IsOptional()
  @IsEnum(SongStatus, { message: 'Status inválido.' })
  status?: SongStatus;

  @IsOptional()
  @IsUrl({}, { message: 'URL do YouTube inválida.' })
  youtubeUrl?: string;
}

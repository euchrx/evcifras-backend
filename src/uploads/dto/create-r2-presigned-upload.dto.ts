import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateR2PresignedUploadDto {
  @IsString({ message: 'Nome do arquivo deve ser um texto.' })
  @IsNotEmpty({ message: 'Nome do arquivo é obrigatório.' })
  @MaxLength(180, { message: 'Nome do arquivo muito longo.' })
  fileName!: string;

  @IsString({ message: 'Tipo do arquivo deve ser um texto.' })
  @IsNotEmpty({ message: 'Tipo do arquivo é obrigatório.' })
  contentType!: string;

  @IsInt({ message: 'Tamanho do arquivo deve ser um número inteiro.' })
  @Min(1, { message: 'Tamanho do arquivo inválido.' })
  @Max(30 * 1024 * 1024, {
    message: 'O áudio deve ter no máximo 30 MB.',
  })
  sizeBytes!: number;
}

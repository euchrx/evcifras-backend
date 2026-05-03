import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateArtistDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres.' })
  name!: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL da imagem inválida.' })
  imageUrl?: string;

  @IsOptional()
  @IsString({ message: 'Biografia deve ser um texto.' })
  @MaxLength(2000, { message: 'Biografia deve ter no máximo 2000 caracteres.' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Gênero principal deve ser um texto.' })
  @MaxLength(80, { message: 'Gênero principal deve ter no máximo 80 caracteres.' })
  mainGenre?: string;
}
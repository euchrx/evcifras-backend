import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRepertoireDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto.' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres.' })
  description?: string;
}

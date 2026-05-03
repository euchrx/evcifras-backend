import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSongToRepertoireDto {
  @IsUUID('4', { message: 'songId inválido.' })
  songId!: string;

  @IsOptional()
  @IsInt({ message: 'position deve ser um número inteiro.' })
  @Min(0, { message: 'position não pode ser negativo.' })
  position?: number;
}

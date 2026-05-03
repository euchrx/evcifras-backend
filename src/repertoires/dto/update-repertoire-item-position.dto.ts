import { IsInt, Min } from 'class-validator';

export class UpdateRepertoireItemPositionDto {
  @IsInt({ message: 'position deve ser um número inteiro.' })
  @Min(0, { message: 'position não pode ser negativo.' })
  position!: number;
}

import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString({ message: 'Senha deve ser um texto.' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres.' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Confirmação de senha deve ser um texto.' })
  passwordConfirmation?: string;
}

import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString({ message: 'Senha deve ser um texto.' })
  @MinLength(1, { message: 'Senha é obrigatória.' })
  password!: string;
}

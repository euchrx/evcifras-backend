import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { LoginDto, RegisterDto } from './dto';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser, JwtPayload } from '../common/types/authenticated-user.type';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    if (dto.passwordConfirmation && dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('As senhas não conferem.');
    }

    const passwordHash = await hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.active) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const safeUser = this.usersService.toSafeUser(user);

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: safeUser,
      accessToken,
    };
  }

  me(user: AuthenticatedUser) {
    return user;
  }

  private async signToken(payload: JwtPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    const JWT_EXPIRES_IN: StringValue = '7d';

    return this.jwtService.signAsync(payload, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}

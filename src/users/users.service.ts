import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findSafeById(id: string): Promise<SafeUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.toSafeUser(user);
  }

  async create(params: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<SafeUser> {
    const email = params.email.toLowerCase().trim();
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const user = await this.prisma.user.create({
      data: {
        name: params.name.trim(),
        email,
        passwordHash: params.passwordHash,
        role: params.role ?? UserRole.USER,
      },
    });

    return this.toSafeUser(user);
  }

  toSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

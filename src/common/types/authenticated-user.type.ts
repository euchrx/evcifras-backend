import { UserRole } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

import { PrismaClient, UserRole, SongStatus, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não encontrada no .env');
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  const passwordHash = await bcrypt.hash('C733800@m', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'christian@evsystem.com.br',
    },
    update: {
      name: 'Christian Evangelista',
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    create: {
      name: 'Christian Evangelista',
      email: 'christian@evsystem.com.br',
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const gusttavo = await prisma.artist.upsert({
    where: {
      slug: 'gusttavo-lima',
    },
    update: {
      name: 'Gusttavo Lima',
      imageUrl: 'https://example.com/gusttavo-lima.jpg',
      bio: 'Cantor sertanejo brasileiro.',
      mainGenre: 'Sertanejo',
      active: true,
    },
    create: {
      name: 'Gusttavo Lima',
      slug: 'gusttavo-lima',
      imageUrl: 'https://example.com/gusttavo-lima.jpg',
      bio: 'Cantor sertanejo brasileiro.',
      mainGenre: 'Sertanejo',
      active: true,
    },
  });

  const fernandinho = await prisma.artist.upsert({
    where: {
      slug: 'fernandinho',
    },
    update: {
      name: 'Fernandinho',
      imageUrl: 'https://example.com/fernandinho.jpg',
      bio: 'Cantor e compositor brasileiro de música cristã.',
      mainGenre: 'Gospel',
      active: true,
    },
    create: {
      name: 'Fernandinho',
      slug: 'fernandinho',
      imageUrl: 'https://example.com/fernandinho.jpg',
      bio: 'Cantor e compositor brasileiro de música cristã.',
      mainGenre: 'Gospel',
      active: true,
    },
  });

  const apelidoSlug = slugify('Apelido Carinhoso');

  await prisma.song.upsert({
    where: {
      artistId_slug: {
        artistId: gusttavo.id,
        slug: apelidoSlug,
      },
    },
    update: {
      title: 'Apelido Carinhoso',
      lyrics: `O que que eu faço agora
Se você foi embora
E eu fiquei aqui

Tô tentando disfarçar
Mas tá difícil aceitar
Ficar sem você`,
      chords: `[Intro] G  D  Em  C

G
O que que eu faço agora
D
Se você foi embora
Em
E eu fiquei aqui
C
Sem saber pra onde ir

G
Tô tentando disfarçar
D
Mas tá difícil aceitar
Em
Ficar sem você
C
Não dá pra entender`,
      originalKey: 'G',
      currentKey: 'G',
      capo: null,
      genre: 'Sertanejo',
      difficulty: Difficulty.BEGINNER,
      status: SongStatus.PUBLISHED,
      youtubeUrl: 'https://www.youtube.com/',
      createdById: admin.id,
    },
    create: {
      title: 'Apelido Carinhoso',
      slug: apelidoSlug,
      lyrics: `O que que eu faço agora
Se você foi embora
E eu fiquei aqui

Tô tentando disfarçar
Mas tá difícil aceitar
Ficar sem você`,
      chords: `[Intro] G  D  Em  C

G
O que que eu faço agora
D
Se você foi embora
Em
E eu fiquei aqui
C
Sem saber pra onde ir

G
Tô tentando disfarçar
D
Mas tá difícil aceitar
Em
Ficar sem você
C
Não dá pra entender`,
      originalKey: 'G',
      currentKey: 'G',
      capo: null,
      genre: 'Sertanejo',
      difficulty: Difficulty.BEGINNER,
      status: SongStatus.PUBLISHED,
      youtubeUrl: 'https://www.youtube.com/',
      artistId: gusttavo.id,
      createdById: admin.id,
    },
  });

  const galileuSlug = slugify('Galileu');

  await prisma.song.upsert({
    where: {
      artistId_slug: {
        artistId: fernandinho.id,
        slug: galileuSlug,
      },
    },
    update: {
      title: 'Galileu',
      lyrics: `Deixou Sua glória
Foi por amor, foi por amor
E o Seu sangue derramou
Que grande amor`,
      chords: `[Intro] D  A  Bm  G

D
Deixou Sua glória
A
Foi por amor, foi por amor
Bm
E o Seu sangue derramou
G
Que grande amor

D
Galileu
A
Jesus, Jesus
Bm
Galileu
G
Jesus, Jesus`,
      originalKey: 'D',
      currentKey: 'D',
      capo: null,
      genre: 'Gospel',
      difficulty: Difficulty.BEGINNER,
      status: SongStatus.PUBLISHED,
      youtubeUrl: 'https://www.youtube.com/',
      createdById: admin.id,
    },
    create: {
      title: 'Galileu',
      slug: galileuSlug,
      lyrics: `Deixou Sua glória
Foi por amor, foi por amor
E o Seu sangue derramou
Que grande amor`,
      chords: `[Intro] D  A  Bm  G

D
Deixou Sua glória
A
Foi por amor, foi por amor
Bm
E o Seu sangue derramou
G
Que grande amor

D
Galileu
A
Jesus, Jesus
Bm
Galileu
G
Jesus, Jesus`,
      originalKey: 'D',
      currentKey: 'D',
      capo: null,
      genre: 'Gospel',
      difficulty: Difficulty.BEGINNER,
      status: SongStatus.PUBLISHED,
      youtubeUrl: 'https://www.youtube.com/',
      artistId: fernandinho.id,
      createdById: admin.id,
    },
  });

  console.log('Seed executado com sucesso.');
  console.log('Admin: christian@evsystem.com.br');
  console.log('Senha: C733800@m');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
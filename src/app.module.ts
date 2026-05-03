import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArtistsModule } from './artists/artists.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SongsModule } from './songs/songs.module';
import { UsersModule } from './users/users.module';
import { FavoritesModule } from './favorites/favorites.module';
import { RepertoiresModule } from './repertoires/repertoires.module';
import { AudioTracksModule } from './audio-tracks/audio-tracks.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    SongsModule,
    FavoritesModule,
    RepertoiresModule,
    AudioTracksModule,
    UploadsModule
  ],
})
export class AppModule {}
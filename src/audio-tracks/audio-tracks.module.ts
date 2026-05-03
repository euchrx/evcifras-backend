import { Module } from '@nestjs/common';
import { AudioTracksController } from './audio-tracks.controller';
import { AudioTracksService } from './audio-tracks.service';

@Module({
  controllers: [AudioTracksController],
  providers: [AudioTracksService],
  exports: [AudioTracksService],
})
export class AudioTracksModule {}

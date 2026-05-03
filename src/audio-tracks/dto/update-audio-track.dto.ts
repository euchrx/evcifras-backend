import { PartialType } from '@nestjs/mapped-types';
import { CreateAudioTrackDto } from './create-audio-track.dto';

export class UpdateAudioTrackDto extends PartialType(CreateAudioTrackDto) {}

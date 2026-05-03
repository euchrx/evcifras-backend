import { PartialType } from '@nestjs/mapped-types';
import { CreateRepertoireDto } from './create-repertoire.dto';

export class UpdateRepertoireDto extends PartialType(CreateRepertoireDto) {}

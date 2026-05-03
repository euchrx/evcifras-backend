import { Module } from '@nestjs/common';
import { RepertoiresController } from './repertoires.controller';
import { RepertoiresService } from './repertoires.service';

@Module({
  controllers: [RepertoiresController],
  providers: [RepertoiresService],
  exports: [RepertoiresService],
})
export class RepertoiresModule {}

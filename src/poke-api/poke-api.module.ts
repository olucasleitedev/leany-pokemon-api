import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PokeApiService } from './poke-api.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 3,
    }),
  ],
  providers: [PokeApiService],
  exports: [PokeApiService],
})
export class PokeApiModule {}

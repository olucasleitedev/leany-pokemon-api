import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokemonCache } from './entities/pokemon-cache.entity';
import { PokemonCacheRepository } from './pokemon-cache.repository';
import { PokemonCacheService } from './pokemon-cache.service';
import { PokeApiModule } from '../poke-api/poke-api.module';

@Module({
  imports: [TypeOrmModule.forFeature([PokemonCache]), PokeApiModule],
  providers: [PokemonCacheRepository, PokemonCacheService],
  exports: [PokemonCacheService, PokemonCacheRepository],
})
export class PokemonCacheModule {}

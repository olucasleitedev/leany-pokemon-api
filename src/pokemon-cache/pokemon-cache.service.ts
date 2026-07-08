import { Injectable } from '@nestjs/common';
import { PokemonCacheRepository } from './pokemon-cache.repository';
import { PokeApiService } from '../poke-api/poke-api.service';
import { PokeApiPokemonSummary } from '../poke-api/interfaces/poke-api-pokemon.interface';
import { PokemonCache } from './entities/pokemon-cache.entity';

@Injectable()
export class PokemonCacheService {
  constructor(
    private readonly pokemonCacheRepository: PokemonCacheRepository,
    private readonly pokeApiService: PokeApiService,
  ) {}

  async syncAndCache(identifier: string): Promise<PokemonCache> {
    const summary = await this.pokeApiService.fetchPokemonSummary(identifier);
    return this.pokemonCacheRepository.upsert(summary);
  }

  async findCached(identifier: string): Promise<PokemonCache | null> {
    return this.pokemonCacheRepository.findByIdentifier(identifier);
  }

  async findManyCached(identifiers: string[]): Promise<PokemonCache[]> {
    return this.pokemonCacheRepository.findByIdentifiers(identifiers);
  }

  summaryFromCache(cache: PokemonCache): PokeApiPokemonSummary {
    return {
      pokeapiId: cache.pokeapiId,
      nome: cache.nome,
      tipos: cache.tipos,
      sprite: cache.sprite,
      habilidades: cache.habilidades ?? [],
      identifier: cache.pokemonIdentifier,
    };
  }
}

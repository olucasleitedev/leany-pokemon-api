import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PokemonCache } from './entities/pokemon-cache.entity';
import { PokeApiPokemonSummary } from '../poke-api/interfaces/poke-api-pokemon.interface';

@Injectable()
export class PokemonCacheRepository {
  constructor(
    @InjectRepository(PokemonCache)
    private readonly repository: Repository<PokemonCache>,
  ) {}

  findByIdentifier(identifier: string): Promise<PokemonCache | null> {
    return this.repository.findOne({
      where: { pokemonIdentifier: identifier.toLowerCase() },
    });
  }

  findByIdentifiers(identifiers: string[]): Promise<PokemonCache[]> {
    if (identifiers.length === 0) {
      return Promise.resolve([]);
    }

    return this.repository
      .createQueryBuilder('cache')
      .where('cache.pokemon_identifier IN (:...identifiers)', {
        identifiers: identifiers.map((id) => id.toLowerCase()),
      })
      .getMany();
  }

  async upsert(summary: PokeApiPokemonSummary): Promise<PokemonCache> {
    const entity = this.repository.create({
      pokemonIdentifier: summary.identifier,
      pokeapiId: summary.pokeapiId,
      nome: summary.nome,
      tipos: summary.tipos,
      sprite: summary.sprite,
      habilidades: summary.habilidades,
    });

    await this.repository.upsert(entity, ['pokemonIdentifier']);
    return this.findByIdentifier(summary.identifier) as Promise<PokemonCache>;
  }
}

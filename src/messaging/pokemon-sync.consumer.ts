import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import {
  POKEMON_EVENTS_EXCHANGE,
  POKEMON_SYNC_QUEUE,
  POKEMON_SYNC_ROUTING_KEY,
} from '../common/constants/pokemon.constants';
import { PokemonSyncMessage } from './interfaces/pokemon-sync.message';
import { PokemonCacheService } from '../pokemon-cache/pokemon-cache.service';
import { TeamPokemonsRepository } from '../team-pokemons/team-pokemons.repository';
import { PokemonSyncStatus } from '../common/enums/pokemon-sync-status.enum';

@Injectable()
export class PokemonSyncConsumer {
  private readonly logger = new Logger(PokemonSyncConsumer.name);

  constructor(
    private readonly pokemonCacheService: PokemonCacheService,
    private readonly teamPokemonsRepository: TeamPokemonsRepository,
  ) {}

  @RabbitSubscribe({
    exchange: POKEMON_EVENTS_EXCHANGE,
    routingKey: POKEMON_SYNC_ROUTING_KEY,
    queue: POKEMON_SYNC_QUEUE,
    queueOptions: {
      durable: true,
    },
  })
  async handlePokemonSync(message: PokemonSyncMessage): Promise<void | Nack> {
    try {
      await this.pokemonCacheService.syncAndCache(message.pokemonIdentifier);
      await this.teamPokemonsRepository.updateSyncStatus(
        message.teamPokemonId,
        PokemonSyncStatus.SYNCED,
      );

      this.logger.log(
        `Pokémon "${message.pokemonIdentifier}" sincronizado com sucesso`,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao sincronizar Pokémon "${message.pokemonIdentifier}"`,
        error instanceof Error ? error.stack : undefined,
      );

      return new Nack(true);
    }
  }
}

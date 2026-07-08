import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  POKEMON_EVENTS_EXCHANGE,
  POKEMON_SYNC_ROUTING_KEY,
} from '../common/constants/pokemon.constants';
import { PokemonSyncMessage } from './interfaces/pokemon-sync.message';

@Injectable()
export class PokemonSyncPublisher {
  private readonly logger = new Logger(PokemonSyncPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publishSync(message: PokemonSyncMessage): Promise<void> {
    await this.amqpConnection.publish(
      POKEMON_EVENTS_EXCHANGE,
      POKEMON_SYNC_ROUTING_KEY,
      message,
      { persistent: true },
    );

    this.logger.log(
      `Evento de sync publicado para Pokémon "${message.pokemonIdentifier}"`,
    );
  }
}

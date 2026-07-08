import { Module, forwardRef } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  POKEMON_EVENTS_EXCHANGE,
  POKEMON_SYNC_QUEUE,
} from '../common/constants/pokemon.constants';
import { PokemonSyncPublisher } from './pokemon-sync.publisher';
import { PokemonSyncConsumer } from './pokemon-sync.consumer';
import { PokemonCacheModule } from '../pokemon-cache/pokemon-cache.module';
import { TeamPokemonsModule } from '../team-pokemons/team-pokemons.module';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('RABBITMQ_URI'),
        exchanges: [
          {
            name: POKEMON_EVENTS_EXCHANGE,
            type: 'topic',
            options: { durable: true },
          },
        ],
        queues: [
          {
            name: POKEMON_SYNC_QUEUE,
            exchange: POKEMON_EVENTS_EXCHANGE,
            routingKey: 'pokemon.sync.#',
            options: { durable: true },
          },
        ],
        connectionInitOptions: { wait: true, timeout: 30_000 },
        enableControllerDiscovery: true,
      }),
    }),
    PokemonCacheModule,
    forwardRef(() => TeamPokemonsModule),
  ],
  providers: [PokemonSyncPublisher, PokemonSyncConsumer],
  exports: [PokemonSyncPublisher],
})
export class MessagingModule {}

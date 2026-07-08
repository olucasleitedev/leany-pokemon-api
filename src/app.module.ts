import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainersModule } from './trainers/trainers.module';
import { TeamsModule } from './teams/teams.module';
import { TeamPokemonsModule } from './team-pokemons/team-pokemons.module';
import { PokeApiModule } from './poke-api/poke-api.module';
import { PokemonCacheModule } from './pokemon-cache/pokemon-cache.module';
import { MessagingModule } from './messaging/messaging.module';
import { HealthModule } from './health/health.module';
import { Trainer } from './trainers/entities/trainer.entity';
import { Team } from './teams/entities/team.entity';
import { TeamPokemon } from './team-pokemons/entities/team-pokemon.entity';
import { PokemonCache } from './pokemon-cache/entities/pokemon-cache.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'pokemon'),
        password: configService.get<string>('DB_PASSWORD', 'pokemon'),
        database: configService.get<string>('DB_DATABASE', 'pokemon_teams'),
        entities: [Trainer, Team, TeamPokemon, PokemonCache],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TrainersModule,
    TeamsModule,
    TeamPokemonsModule,
    PokeApiModule,
    PokemonCacheModule,
    MessagingModule,
    HealthModule,
  ],
})
export class AppModule {}

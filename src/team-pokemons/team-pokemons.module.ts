import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamPokemon } from './entities/team-pokemon.entity';
import { TeamPokemonsController } from './team-pokemons.controller';
import { TeamPokemonsService } from './team-pokemons.service';
import { TeamPokemonsRepository } from './team-pokemons.repository';
import { TeamsModule } from '../teams/teams.module';
import { PokeApiModule } from '../poke-api/poke-api.module';
import { PokemonCacheModule } from '../pokemon-cache/pokemon-cache.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamPokemon]),
    TeamsModule,
    PokeApiModule,
    PokemonCacheModule,
    forwardRef(() => MessagingModule),
  ],
  controllers: [TeamPokemonsController],
  providers: [TeamPokemonsService, TeamPokemonsRepository],
  exports: [TeamPokemonsRepository, TeamPokemonsService],
})
export class TeamPokemonsModule {}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryFailedError } from 'typeorm';
import { TeamPokemonsRepository } from './team-pokemons.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { PokeApiService } from '../poke-api/poke-api.service';
import { PokemonCacheService } from '../pokemon-cache/pokemon-cache.service';
import { PokemonSyncPublisher } from '../messaging/pokemon-sync.publisher';
import { AddTeamPokemonDto } from './dto/add-team-pokemon.dto';
import { TeamPokemonDetailsDto } from './dto/team-pokemon-details.dto';
import { TeamPokemon } from './entities/team-pokemon.entity';
import { PokemonCache } from '../pokemon-cache/entities/pokemon-cache.entity';

@Injectable()
export class TeamPokemonsService {
  private readonly maxPokemonPerTeam: number;

  constructor(
    private readonly teamPokemonsRepository: TeamPokemonsRepository,
    private readonly teamsRepository: TeamsRepository,
    private readonly pokeApiService: PokeApiService,
    private readonly pokemonCacheService: PokemonCacheService,
    private readonly pokemonSyncPublisher: PokemonSyncPublisher,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.maxPokemonPerTeam = this.parseMaxPokemonPerTeam(
      this.configService.get<string>('MAX_POKEMON_PER_TEAM', '6'),
    );
  }

  async addPokemon(
    teamId: string,
    dto: AddTeamPokemonDto,
  ): Promise<TeamPokemonDetailsDto> {
    await this.ensureTeamExists(teamId);

    const summary = await this.pokeApiService.fetchPokemonSummary(
      dto.pokemonIdOuNome,
    );
    const canonicalIdentifier = summary.identifier;

    let teamPokemon: TeamPokemon;

    try {
      teamPokemon = await this.dataSource.transaction(async (manager) => {
        const count = await this.teamPokemonsRepository.countByTeamId(
          teamId,
          manager,
        );

        if (count >= this.maxPokemonPerTeam) {
          throw new BadRequestException(
            `O time já atingiu o limite de ${this.maxPokemonPerTeam} Pokémon`,
          );
        }

        const exists = await manager.count(TeamPokemon, {
          where: { timeId: teamId, pokemonIdOuNome: canonicalIdentifier },
        });

        if (exists > 0) {
          throw new ConflictException(
            `O Pokémon "${canonicalIdentifier}" já faz parte deste time`,
          );
        }

        return this.teamPokemonsRepository.create(
          teamId,
          canonicalIdentifier,
          manager,
        );
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          `O Pokémon "${canonicalIdentifier}" já faz parte deste time`,
        );
      }
      throw error;
    }

    try {
      await this.pokemonSyncPublisher.publishSync({
        teamPokemonId: teamPokemon.id,
        pokemonIdentifier: canonicalIdentifier,
      });
    } catch {
      await this.teamPokemonsRepository.delete(teamPokemon.id);
      throw new BadRequestException(
        'Pokémon salvo, mas falha ao publicar sincronização no RabbitMQ. Tente novamente.',
      );
    }

    return this.toDetailsDto(teamPokemon);
  }

  async listTeamPokemons(teamId: string): Promise<TeamPokemonDetailsDto[]> {
    await this.ensureTeamExists(teamId);

    const teamPokemons = await this.teamPokemonsRepository.findByTeamId(teamId);
    const identifiers = teamPokemons.map((pokemon) => pokemon.pokemonIdOuNome);
    const cachedPokemons =
      await this.pokemonCacheService.findManyCached(identifiers);
    const cacheMap = new Map(
      cachedPokemons.map((cache) => [cache.pokemonIdentifier, cache]),
    );

    return teamPokemons.map((teamPokemon) =>
      this.toDetailsDto(teamPokemon, cacheMap.get(teamPokemon.pokemonIdOuNome)),
    );
  }

  async removePokemon(teamId: string, teamPokemonId: string): Promise<void> {
    await this.ensureTeamExists(teamId);

    const teamPokemon = await this.teamPokemonsRepository.findById(teamPokemonId);
    if (!teamPokemon || teamPokemon.timeId !== teamId) {
      throw new NotFoundException(
        `Pokémon ${teamPokemonId} não encontrado no time ${teamId}`,
      );
    }

    await this.teamPokemonsRepository.delete(teamPokemonId);
  }

  private parseMaxPokemonPerTeam(raw: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(
        `MAX_POKEMON_PER_TEAM inválido: "${raw}". Use um número inteiro maior que zero.`,
      );
    }
    return parsed;
  }

  private async ensureTeamExists(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Time ${teamId} não encontrado`);
    }
  }

  private toDetailsDto(
    teamPokemon: TeamPokemon,
    cache?: PokemonCache,
  ): TeamPokemonDetailsDto {
    return {
      id: teamPokemon.id,
      pokemonIdOuNome: teamPokemon.pokemonIdOuNome,
      syncStatus: teamPokemon.syncStatus,
      pokeapiId: cache?.pokeapiId,
      nome: cache?.nome,
      tipos: cache?.tipos,
      sprite: cache?.sprite,
      habilidades: cache?.habilidades,
      createdAt: teamPokemon.createdAt,
    };
  }
}

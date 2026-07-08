import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamPokemonsRepository } from './team-pokemons.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { PokeApiService } from '../poke-api/poke-api.service';
import { PokemonCacheService } from '../pokemon-cache/pokemon-cache.service';
import { PokemonSyncPublisher } from '../messaging/pokemon-sync.publisher';
import { AddTeamPokemonDto } from './dto/add-team-pokemon.dto';
import { TeamPokemonDetailsDto } from './dto/team-pokemon-details.dto';
import { TeamPokemon } from './entities/team-pokemon.entity';
import { PokemonCache } from '../pokemon-cache/entities/pokemon-cache.entity';
import { PokemonSyncStatus } from '../common/enums/pokemon-sync-status.enum';

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
  ) {
    this.maxPokemonPerTeam = Number(
      this.configService.get('MAX_POKEMON_PER_TEAM', 6),
    );
  }

  async addPokemon(
    teamId: string,
    dto: AddTeamPokemonDto,
  ): Promise<TeamPokemonDetailsDto> {
    await this.ensureTeamExists(teamId);
    await this.ensurePokemonExistsInPokeApi(dto.pokemonIdOuNome);
    await this.ensureTeamCapacity(teamId);
    await this.ensurePokemonNotInTeam(teamId, dto.pokemonIdOuNome);

    const normalizedIdentifier = dto.pokemonIdOuNome.trim().toLowerCase();
    const teamPokemon = await this.teamPokemonsRepository.create(
      teamId,
      normalizedIdentifier,
    );

    await this.pokemonSyncPublisher.publishSync({
      teamPokemonId: teamPokemon.id,
      pokemonIdentifier: normalizedIdentifier,
    });

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

  private async ensureTeamExists(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findById(teamId);
    if (!team) {
      throw new NotFoundException(`Time ${teamId} não encontrado`);
    }
  }

  private async ensurePokemonExistsInPokeApi(identifier: string): Promise<void> {
    const exists = await this.pokeApiService.exists(identifier);
    if (!exists) {
      throw new NotFoundException(
        `Pokémon "${identifier}" não encontrado na PokéAPI`,
      );
    }
  }

  private async ensureTeamCapacity(teamId: string): Promise<void> {
    const count = await this.teamPokemonsRepository.countByTeamId(teamId);
    if (count >= this.maxPokemonPerTeam) {
      throw new BadRequestException(
        `O time já atingiu o limite de ${this.maxPokemonPerTeam} Pokémon`,
      );
    }
  }

  private async ensurePokemonNotInTeam(
    teamId: string,
    pokemonIdOuNome: string,
  ): Promise<void> {
    const exists = await this.teamPokemonsRepository.existsInTeam(
      teamId,
      pokemonIdOuNome,
    );
    if (exists) {
      throw new ConflictException(
        `O Pokémon "${pokemonIdOuNome}" já faz parte deste time`,
      );
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

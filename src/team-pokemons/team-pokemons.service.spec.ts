import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamPokemonsService } from './team-pokemons.service';
import { TeamPokemonsRepository } from './team-pokemons.repository';
import { TeamsRepository } from '../teams/teams.repository';
import { PokeApiService } from '../poke-api/poke-api.service';
import { PokemonCacheService } from '../pokemon-cache/pokemon-cache.service';
import { PokemonSyncPublisher } from '../messaging/pokemon-sync.publisher';
import { PokemonSyncStatus } from '../common/enums/pokemon-sync-status.enum';

describe('TeamPokemonsService', () => {
  let service: TeamPokemonsService;
  let teamPokemonsRepository: jest.Mocked<TeamPokemonsRepository>;
  let teamsRepository: jest.Mocked<TeamsRepository>;
  let pokeApiService: jest.Mocked<PokeApiService>;
  let pokemonSyncPublisher: jest.Mocked<PokemonSyncPublisher>;

  const team = {
    id: 'team-uuid',
    nomeDoTime: 'Time Elétrico',
    treinadorId: 'trainer-uuid',
    pokemons: [],
    treinador: {} as never,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    teamPokemonsRepository = {
      create: jest.fn(),
      findByTeamId: jest.fn(),
      findById: jest.fn(),
      countByTeamId: jest.fn(),
      existsInTeam: jest.fn(),
      updateSyncStatus: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TeamPokemonsRepository>;

    teamsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TeamsRepository>;

    pokeApiService = {
      exists: jest.fn(),
    } as unknown as jest.Mocked<PokeApiService>;

    pokemonSyncPublisher = {
      publishSync: jest.fn(),
    } as unknown as jest.Mocked<PokemonSyncPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamPokemonsService,
        { provide: TeamPokemonsRepository, useValue: teamPokemonsRepository },
        { provide: TeamsRepository, useValue: teamsRepository },
        { provide: PokeApiService, useValue: pokeApiService },
        {
          provide: PokemonCacheService,
          useValue: { findManyCached: jest.fn().mockResolvedValue([]) },
        },
        { provide: PokemonSyncPublisher, useValue: pokemonSyncPublisher },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(6) },
        },
      ],
    }).compile();

    service = module.get(TeamPokemonsService);
  });

  it('deve adicionar Pokémon ao time e publicar evento de sync', async () => {
    teamsRepository.findById.mockResolvedValue(team);
    pokeApiService.exists.mockResolvedValue(true);
    teamPokemonsRepository.countByTeamId.mockResolvedValue(0);
    teamPokemonsRepository.existsInTeam.mockResolvedValue(false);
    teamPokemonsRepository.create.mockResolvedValue({
      id: 'tp-uuid',
      timeId: team.id,
      pokemonIdOuNome: 'pikachu',
      syncStatus: PokemonSyncStatus.PENDING,
      time: team,
      createdAt: new Date(),
    });

    const result = await service.addPokemon(team.id, { pokemonIdOuNome: 'pikachu' });

    expect(result.pokemonIdOuNome).toBe('pikachu');
    expect(result.syncStatus).toBe(PokemonSyncStatus.PENDING);
    expect(pokemonSyncPublisher.publishSync).toHaveBeenCalledWith({
      teamPokemonId: 'tp-uuid',
      pokemonIdentifier: 'pikachu',
    });
  });

  it('deve impedir adicionar mais de 6 Pokémon', async () => {
    teamsRepository.findById.mockResolvedValue(team);
    pokeApiService.exists.mockResolvedValue(true);
    teamPokemonsRepository.countByTeamId.mockResolvedValue(6);

    await expect(
      service.addPokemon(team.id, { pokemonIdOuNome: 'pikachu' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve impedir Pokémon duplicado no mesmo time', async () => {
    teamsRepository.findById.mockResolvedValue(team);
    pokeApiService.exists.mockResolvedValue(true);
    teamPokemonsRepository.countByTeamId.mockResolvedValue(1);
    teamPokemonsRepository.existsInTeam.mockResolvedValue(true);

    await expect(
      service.addPokemon(team.id, { pokemonIdOuNome: 'pikachu' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TeamPokemon } from './entities/team-pokemon.entity';
import { PokemonSyncStatus } from '../common/enums/pokemon-sync-status.enum';
import { normalizePokemonIdentifier } from '../common/utils/normalize-pokemon-identifier';

@Injectable()
export class TeamPokemonsRepository {
  constructor(
    @InjectRepository(TeamPokemon)
    private readonly repository: Repository<TeamPokemon>,
  ) {}

  create(
    timeId: string,
    pokemonIdOuNome: string,
    manager?: EntityManager,
  ): Promise<TeamPokemon> {
    const repo = manager?.getRepository(TeamPokemon) ?? this.repository;
    const entity = repo.create({
      timeId,
      pokemonIdOuNome: normalizePokemonIdentifier(pokemonIdOuNome),
      syncStatus: PokemonSyncStatus.PENDING,
    });
    return repo.save(entity);
  }

  findByTeamId(teamId: string): Promise<TeamPokemon[]> {
    return this.repository.find({
      where: { timeId: teamId },
      order: { createdAt: 'ASC' },
    });
  }

  findById(id: string): Promise<TeamPokemon | null> {
    return this.repository.findOne({ where: { id } });
  }

  countByTeamId(teamId: string, manager?: EntityManager): Promise<number> {
    const repo = manager?.getRepository(TeamPokemon) ?? this.repository;
    return repo.count({ where: { timeId: teamId } });
  }

  async existsInTeam(teamId: string, pokemonIdOuNome: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        timeId: teamId,
        pokemonIdOuNome: normalizePokemonIdentifier(pokemonIdOuNome),
      },
    });
    return count > 0;
  }

  async updateSyncStatus(
    id: string,
    syncStatus: PokemonSyncStatus,
  ): Promise<void> {
    await this.repository.update(id, { syncStatus });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

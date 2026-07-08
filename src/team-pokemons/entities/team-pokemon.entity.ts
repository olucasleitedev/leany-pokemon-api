import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { PokemonSyncStatus } from '../../common/enums/pokemon-sync-status.enum';

@Entity('team_pokemons')
export class TeamPokemon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'time_id' })
  timeId: string;

  @Column({ name: 'pokemon_id_ou_nome', length: 100 })
  pokemonIdOuNome: string;

  @Column({
    name: 'sync_status',
    type: 'enum',
    enum: PokemonSyncStatus,
    default: PokemonSyncStatus.PENDING,
  })
  syncStatus: PokemonSyncStatus;

  @ManyToOne(() => Team, (team) => team.pokemons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'time_id' })
  time: Team;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

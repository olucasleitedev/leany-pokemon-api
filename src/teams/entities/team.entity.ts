import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trainer } from '../../trainers/entities/trainer.entity';
import { TeamPokemon } from '../../team-pokemons/entities/team-pokemon.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome_do_time', length: 100 })
  nomeDoTime: string;

  @Column({ name: 'treinador_id' })
  treinadorId: string;

  @ManyToOne(() => Trainer, (trainer) => trainer.times, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treinador_id' })
  treinador: Trainer;

  @OneToMany(() => TeamPokemon, (teamPokemon) => teamPokemon.time)
  pokemons: TeamPokemon[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

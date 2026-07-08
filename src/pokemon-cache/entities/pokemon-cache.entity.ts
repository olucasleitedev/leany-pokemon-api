import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pokemon_cache')
export class PokemonCache {
  @PrimaryColumn({ name: 'pokemon_identifier', length: 100 })
  pokemonIdentifier: string;

  @Column({ name: 'pokeapi_id', type: 'int' })
  pokeapiId: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'jsonb' })
  tipos: string[];

  @Column({ length: 500 })
  sprite: string;

  @Column({ type: 'jsonb', nullable: true })
  habilidades?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

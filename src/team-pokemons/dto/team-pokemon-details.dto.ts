import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PokemonSyncStatus } from '../../common/enums/pokemon-sync-status.enum';

export class TeamPokemonDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  pokemonIdOuNome: string;

  @ApiProperty({ enum: PokemonSyncStatus })
  syncStatus: PokemonSyncStatus;

  @ApiPropertyOptional()
  pokeapiId?: number;

  @ApiPropertyOptional()
  nome?: string;

  @ApiPropertyOptional({ type: [String] })
  tipos?: string[];

  @ApiPropertyOptional()
  sprite?: string;

  @ApiPropertyOptional({ type: [String] })
  habilidades?: string[];

  @ApiProperty()
  createdAt: Date;
}

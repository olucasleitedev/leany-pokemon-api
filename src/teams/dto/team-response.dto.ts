import { ApiProperty } from '@nestjs/swagger';
import { Team } from '../entities/team.entity';

export class TeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nomeDoTime: string;

  @ApiProperty()
  treinadorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(team: Team): TeamResponseDto {
    return {
      id: team.id,
      nomeDoTime: team.nomeDoTime,
      treinadorId: team.treinadorId,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}

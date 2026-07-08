import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Time Elétrico' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomeDoTime: string;

  @ApiProperty({ example: 'uuid-do-treinador' })
  @IsUUID()
  treinadorId: string;
}

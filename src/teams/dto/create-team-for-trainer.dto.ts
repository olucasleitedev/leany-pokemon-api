import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTeamForTrainerDto {
  @ApiProperty({ example: 'Time Elétrico' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomeDoTime: string;
}

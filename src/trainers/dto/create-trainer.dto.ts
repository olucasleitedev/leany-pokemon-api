import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({ example: 'Ash Ketchum' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiPropertyOptional({ example: 'Pallet Town' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidadeOrigem?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trainer } from '../entities/trainer.entity';

export class TrainerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiPropertyOptional()
  cidadeOrigem?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(trainer: Trainer): TrainerResponseDto {
    return {
      id: trainer.id,
      nome: trainer.nome,
      cidadeOrigem: trainer.cidadeOrigem,
      createdAt: trainer.createdAt,
      updatedAt: trainer.updatedAt,
    };
  }
}

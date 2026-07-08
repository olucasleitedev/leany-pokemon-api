import { Injectable, NotFoundException } from '@nestjs/common';
import { TrainersRepository } from './trainers.repository';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';

@Injectable()
export class TrainersService {
  constructor(private readonly trainersRepository: TrainersRepository) {}

  async create(dto: CreateTrainerDto): Promise<TrainerResponseDto> {
    const trainer = await this.trainersRepository.create(dto);
    return TrainerResponseDto.fromEntity(trainer);
  }

  async findAll(): Promise<TrainerResponseDto[]> {
    const trainers = await this.trainersRepository.findAll();
    return trainers.map(TrainerResponseDto.fromEntity);
  }

  async findOne(id: string): Promise<TrainerResponseDto> {
    const trainer = await this.trainersRepository.findById(id);
    if (!trainer) {
      throw new NotFoundException(`Treinador ${id} não encontrado`);
    }
    return TrainerResponseDto.fromEntity(trainer);
  }

  async update(id: string, dto: UpdateTrainerDto): Promise<TrainerResponseDto> {
    await this.findOne(id);
    const updated = await this.trainersRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Treinador ${id} não encontrado`);
    }
    return TrainerResponseDto.fromEntity(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.trainersRepository.delete(id);
  }
}

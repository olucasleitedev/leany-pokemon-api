import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@Injectable()
export class TrainersRepository {
  constructor(
    @InjectRepository(Trainer)
    private readonly repository: Repository<Trainer>,
  ) {}

  create(dto: CreateTrainerDto): Promise<Trainer> {
    const trainer = this.repository.create(dto);
    return this.repository.save(trainer);
  }

  findAll(): Promise<Trainer[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<Trainer | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateTrainerDto): Promise<Trainer | null> {
    await this.repository.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

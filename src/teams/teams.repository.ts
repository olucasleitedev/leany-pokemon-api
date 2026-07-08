import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsRepository {
  constructor(
    @InjectRepository(Team)
    private readonly repository: Repository<Team>,
  ) {}

  create(dto: CreateTeamDto): Promise<Team> {
    const team = this.repository.create(dto);
    return this.repository.save(team);
  }

  findAll(): Promise<Team[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  findByTrainerId(trainerId: string): Promise<Team[]> {
    return this.repository.find({
      where: { treinadorId: trainerId },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<Team | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Team | null> {
    await this.repository.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

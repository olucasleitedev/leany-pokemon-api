import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamsRepository } from './teams.repository';
import { TrainersRepository } from '../trainers/trainers.repository';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly trainersRepository: TrainersRepository,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    await this.ensureTrainerExists(dto.treinadorId);
    const team = await this.teamsRepository.create(dto);
    return TeamResponseDto.fromEntity(team);
  }

  async findAll(): Promise<TeamResponseDto[]> {
    const teams = await this.teamsRepository.findAll();
    return teams.map(TeamResponseDto.fromEntity);
  }

  async findByTrainer(trainerId: string): Promise<TeamResponseDto[]> {
    await this.ensureTrainerExists(trainerId);
    const teams = await this.teamsRepository.findByTrainerId(trainerId);
    return teams.map(TeamResponseDto.fromEntity);
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findById(id);
    if (!team) {
      throw new NotFoundException(`Time ${id} não encontrado`);
    }
    return TeamResponseDto.fromEntity(team);
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    await this.findOne(id);
    const updated = await this.teamsRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Time ${id} não encontrado`);
    }
    return TeamResponseDto.fromEntity(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.teamsRepository.delete(id);
  }

  private async ensureTrainerExists(trainerId: string): Promise<void> {
    const trainer = await this.trainersRepository.findById(trainerId);
    if (!trainer) {
      throw new NotFoundException(`Treinador ${trainerId} não encontrado`);
    }
  }
}

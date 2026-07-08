import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamForTrainerDto } from './dto/create-team-for-trainer.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';

@ApiTags('Times')
@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('trainers/:trainerId/teams')
  @ApiOperation({ summary: 'Criar time para um treinador' })
  @ApiResponse({ status: 201, type: TeamResponseDto })
  createForTrainer(
    @Param('trainerId', ParseUUIDPipe) trainerId: string,
    @Body() dto: CreateTeamForTrainerDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.create({ ...dto, treinadorId: trainerId });
  }

  @Get('trainers/:trainerId/teams')
  @ApiOperation({ summary: 'Listar times de um treinador' })
  @ApiResponse({ status: 200, type: [TeamResponseDto] })
  findByTrainer(
    @Param('trainerId', ParseUUIDPipe) trainerId: string,
  ): Promise<TeamResponseDto[]> {
    return this.teamsService.findByTrainer(trainerId);
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Buscar time por ID' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Patch('teams/:id')
  @ApiOperation({ summary: 'Atualizar time' })
  @ApiResponse({ status: 200, type: TeamResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, dto);
  }

  @Delete('teams/:id')
  @ApiOperation({ summary: 'Remover time' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.teamsService.remove(id);
  }
}

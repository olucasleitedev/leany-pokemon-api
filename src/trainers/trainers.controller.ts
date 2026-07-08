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
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerResponseDto } from './dto/trainer-response.dto';

@ApiTags('Treinadores')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar treinador' })
  @ApiResponse({ status: 201, type: TrainerResponseDto })
  create(@Body() dto: CreateTrainerDto): Promise<TrainerResponseDto> {
    return this.trainersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar treinadores' })
  @ApiResponse({ status: 200, type: [TrainerResponseDto] })
  findAll(): Promise<TrainerResponseDto[]> {
    return this.trainersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar treinador por ID' })
  @ApiResponse({ status: 200, type: TrainerResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrainerResponseDto> {
    return this.trainersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar treinador' })
  @ApiResponse({ status: 200, type: TrainerResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainerDto,
  ): Promise<TrainerResponseDto> {
    return this.trainersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover treinador' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.trainersService.remove(id);
  }
}

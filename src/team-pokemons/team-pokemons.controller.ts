import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeamPokemonsService } from './team-pokemons.service';
import { AddTeamPokemonDto } from './dto/add-team-pokemon.dto';
import { TeamPokemonDetailsDto } from './dto/team-pokemon-details.dto';

@ApiTags('Pokémon do Time')
@Controller('teams/:teamId/pokemons')
export class TeamPokemonsController {
  constructor(private readonly teamPokemonsService: TeamPokemonsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Adicionar Pokémon ao time' })
  @ApiResponse({ status: 201, type: TeamPokemonDetailsDto })
  addPokemon(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: AddTeamPokemonDto,
  ): Promise<TeamPokemonDetailsDto> {
    return this.teamPokemonsService.addPokemon(teamId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar Pokémon do time' })
  @ApiResponse({ status: 200, type: [TeamPokemonDetailsDto] })
  listPokemons(
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<TeamPokemonDetailsDto[]> {
    return this.teamPokemonsService.listTeamPokemons(teamId);
  }

  @Delete(':teamPokemonId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover Pokémon do time' })
  @ApiResponse({ status: 204 })
  async removePokemon(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('teamPokemonId', ParseUUIDPipe) teamPokemonId: string,
  ): Promise<void> {
    await this.teamPokemonsService.removePokemon(teamId, teamPokemonId);
  }
}

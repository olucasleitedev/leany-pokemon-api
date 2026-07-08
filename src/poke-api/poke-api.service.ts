import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  PokeApiPokemonResponse,
  PokeApiPokemonSummary,
} from './interfaces/poke-api-pokemon.interface';

@Injectable()
export class PokeApiService {
  private readonly logger = new Logger(PokeApiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('POKEAPI_BASE_URL');
  }

  async exists(identifier: string): Promise<boolean> {
    try {
      await this.fetchPokemon(identifier);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  async fetchPokemon(identifier: string): Promise<PokeApiPokemonResponse> {
    const normalized = this.normalizeIdentifier(identifier);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PokeApiPokemonResponse>(
          `${this.baseUrl}/pokemon/${normalized}`,
        ),
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new NotFoundException(
          `Pokémon "${identifier}" não encontrado na PokéAPI`,
        );
      }

      this.logger.error(
        `Falha ao consultar PokéAPI para "${identifier}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async fetchPokemonSummary(
    identifier: string,
  ): Promise<PokeApiPokemonSummary> {
    const pokemon = await this.fetchPokemon(identifier);
    return this.toSummary(pokemon, identifier);
  }

  toSummary(
    pokemon: PokeApiPokemonResponse,
    originalIdentifier: string,
  ): PokeApiPokemonSummary {
    return {
      pokeapiId: pokemon.id,
      nome: pokemon.name,
      tipos: pokemon.types.map((entry) => entry.type.name),
      sprite: pokemon.sprites.front_default ?? '',
      habilidades: pokemon.abilities.map((entry) => entry.ability.name),
      identifier: pokemon.name.toLowerCase(),
    };
  }

  private normalizeIdentifier(identifier: string): string {
    return identifier.trim().toLowerCase();
  }
}

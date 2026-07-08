import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosHeaders } from 'axios';
import { NotFoundException } from '@nestjs/common';
import { PokeApiService } from './poke-api.service';

describe('PokeApiService', () => {
  let service: PokeApiService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokeApiService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('https://pokeapi.co/api/v2'),
          },
        },
      ],
    }).compile();

    service = module.get(PokeApiService);
  });

  it('deve retornar true quando o Pokémon existe', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          id: 25,
          name: 'pikachu',
          types: [{ slot: 1, type: { name: 'electric', url: '' } }],
          abilities: [{ ability: { name: 'static', url: '' }, is_hidden: false, slot: 1 }],
          sprites: { front_default: 'https://sprite.url' },
        },
      }),
    );

    await expect(service.exists('pikachu')).resolves.toBe(true);
  });

  it('deve lançar NotFoundException quando o Pokémon não existe', async () => {
    const axiosError = new AxiosError('Not found');
    axiosError.response = {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {},
    };

    httpService.get.mockReturnValue(throwError(() => axiosError));

    await expect(service.fetchPokemon('invalid-mon')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve mapear o summary corretamente', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          id: 25,
          name: 'pikachu',
          types: [
            { slot: 1, type: { name: 'electric', url: '' } },
            { slot: 2, type: { name: 'flying', url: '' } },
          ],
          abilities: [
            { ability: { name: 'static', url: '' }, is_hidden: false, slot: 1 },
          ],
          sprites: { front_default: 'https://sprite.url/pikachu.png' },
        },
      }),
    );

    const summary = await service.fetchPokemonSummary('25');

    expect(summary.identifier).toBe('pikachu');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { TrainersRepository } from './trainers.repository';

describe('TrainersService', () => {
  let service: TrainersService;
  let repository: jest.Mocked<TrainersRepository>;

  const trainer = {
    id: 'trainer-uuid',
    nome: 'Ash Ketchum',
    cidadeOrigem: 'Pallet Town',
    times: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<TrainersRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainersService,
        { provide: TrainersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(TrainersService);
  });

  it('deve criar um treinador', async () => {
    repository.create.mockResolvedValue(trainer);

    const result = await service.create({
      nome: 'Ash Ketchum',
      cidadeOrigem: 'Pallet Town',
    });

    expect(result.nome).toBe('Ash Ketchum');
    expect(repository.create).toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando treinador não existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne('invalid-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

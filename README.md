# Leany Pokémon Teams API

API RESTful em NestJS para gerenciar Treinadores, Times e Pokémon, com integração à [PokéAPI](https://pokeapi.co/).

## Sobre o projeto

Solução para o desafio técnico da Leany. A API persiste Treinadores e Times no PostgreSQL e consulta a PokéAPI para validar e enriquecer os dados dos Pokémon.

Para o enriquecimento de detalhes (tipos, sprite, habilidades), optei por processar de forma assíncrona via RabbitMQ, com cache local no banco. A validação de existência do Pokémon continua síncrona, já que é requisito do case.

## Stack

- NestJS 11 + TypeScript
- PostgreSQL 16 (Docker)
- RabbitMQ 3.13 (Docker)
- TypeORM
- Swagger (OpenAPI)
- class-validator / class-transformer

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## Como rodar

```bash
git clone https://github.com/olucasleitedev/leany-pokemon-api.git
cd leany-pokemon-api

npm install
cp .env.example .env

docker compose up -d
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- RabbitMQ Management: http://localhost:15672 (usuário/senha: `pokemon`)

## Docker Compose

O `docker-compose.yml` sobe PostgreSQL e RabbitMQ com um comando. Não precisa instalar nada manualmente além do Docker.

- **postgres** — PostgreSQL 16 na porta 5432, banco `pokemon_teams`, usuário/senha `pokemon`. Tem healthcheck e volume persistente.
- **rabbitmq** — RabbitMQ 3.13 com painel de gerenciamento. Porta 5672 (AMQP) e 15672 (UI). Usuário/senha `pokemon`.

A API roda fora do Docker (`npm run start:dev`) e conecta nos serviços via `localhost`. Isso facilita debug e hot reload no desenvolvimento.

```bash
docker compose up -d      # sobe postgres + rabbitmq
docker compose ps         # confere status
docker compose down       # para os containers
```

## Arquitetura explicada

### RabbitMQ

![RabbitMQ Management](./imagens-explicacao/rabbitmq.png)

Subi o RabbitMQ no Docker junto com o PostgreSQL. No painel dá pra ver a API conectada, 1 fila (`pokemon.sync`) e 1 consumer rodando.

Usei fila porque, ao adicionar Pokémon, preciso validar na PokéAPI na hora — isso é requisito. Mas buscar tipos, sprite e habilidades no mesmo request deixaria o POST lento. Então valido, salvo no banco, publico na fila e respondo rápido. Um consumer enriquece os dados em background e grava no cache.

### Swagger

![Swagger — endpoints da API](./imagens-explicacao/image.png)

Documentei tudo no Swagger (`/docs`): treinadores, times e Pokémon do time. Rotas REST com CRUD completo. Dá pra testar direto pelo navegador.

### Código principal

#### Controller — `src/team-pokemons/team-pokemons.controller.ts`

Controller fino: recebe request, valida DTO e UUID, delega pro service. Não exponho entidade do banco, só retorno DTO.

```typescript
@ApiTags('Pokémon do Time')
@Controller('teams/:teamId/pokemons')
export class TeamPokemonsController {
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Adicionar Pokémon ao time' })
  addPokemon(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: AddTeamPokemonDto,
  ): Promise<TeamPokemonDetailsDto> {
    return this.teamPokemonsService.addPokemon(teamId, dto);
  }

  @Get()
  listPokemons(
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<TeamPokemonDetailsDto[]> {
    return this.teamPokemonsService.listTeamPokemons(teamId);
  }
}
```

#### Service — `src/team-pokemons/team-pokemons.service.ts`

Coração do projeto. Valido na PokéAPI, uso transação pra limite de 6 e duplicata, publico no RabbitMQ. Se a fila falhar, apago o registro — não deixo dado inconsistente. Na listagem, leio do cache local.

```typescript
async addPokemon(teamId: string, dto: AddTeamPokemonDto): Promise<TeamPokemonDetailsDto> {
  const summary = await this.pokeApiService.fetchPokemonSummary(dto.pokemonIdOuNome);
  const canonicalIdentifier = summary.identifier;

  const teamPokemon = await this.dataSource.transaction(async (manager) => {
    const count = await this.teamPokemonsRepository.countByTeamId(teamId, manager);

    if (count >= this.maxPokemonPerTeam) {
      throw new BadRequestException(
        `O time já atingiu o limite de ${this.maxPokemonPerTeam} Pokémon`,
      );
    }

    const exists = await manager.count(TeamPokemon, {
      where: { timeId: teamId, pokemonIdOuNome: canonicalIdentifier },
    });

    if (exists > 0) {
      throw new ConflictException(
        `O Pokémon "${canonicalIdentifier}" já faz parte deste time`,
      );
    }

    return this.teamPokemonsRepository.create(teamId, canonicalIdentifier, manager);
  });

  try {
    await this.pokemonSyncPublisher.publishSync({
      teamPokemonId: teamPokemon.id,
      pokemonIdentifier: canonicalIdentifier,
    });
  } catch {
    await this.teamPokemonsRepository.delete(teamPokemon.id);
    throw new BadRequestException(
      'Pokémon salvo, mas falha ao publicar sincronização no RabbitMQ. Tente novamente.',
    );
  }

  return this.toDetailsDto(teamPokemon);
}
```

#### Consumer — `src/messaging/pokemon-sync.consumer.ts`

Processa em background: busca detalhes na PokéAPI, grava cache, atualiza `syncStatus`. Se falhar, retorna Nack com retry automático.

```typescript
@RabbitSubscribe({
  exchange: POKEMON_EVENTS_EXCHANGE,
  routingKey: POKEMON_SYNC_ROUTING_KEY,
  queue: POKEMON_SYNC_QUEUE,
  queueOptions: { durable: true },
})
async handlePokemonSync(message: PokemonSyncMessage): Promise<void | Nack> {
  try {
    await this.pokemonCacheService.syncAndCache(message.pokemonIdentifier);
    await this.teamPokemonsRepository.updateSyncStatus(
      message.teamPokemonId,
      PokemonSyncStatus.SYNCED,
    );
  } catch (error) {
    return new Nack(true);
  }
}
```

#### PokéAPI — `src/poke-api/poke-api.service.ts`

Integração isolada num service só. Normalizo identificador, trato 404 e mapeio resposta pro formato interno.

```typescript
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
    throw error;
  }
}

toSummary(pokemon: PokeApiPokemonResponse): PokeApiPokemonSummary {
  return {
    pokeapiId: pokemon.id,
    nome: pokemon.name,
    tipos: pokemon.types.map((entry) => entry.type.name),
    sprite: pokemon.sprites.front_default ?? '',
    habilidades: pokemon.abilities.map((entry) => entry.ability.name),
    identifier: pokemon.name.toLowerCase(),
  };
}
```

#### App Module — `src/app.module.ts`

Arquitetura modular: treinadores, times, Pokémon, PokéAPI, cache e RabbitMQ. TypeORM + PostgreSQL centralizado aqui.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        database: configService.get<string>('DB_DATABASE', 'pokemon_teams'),
        entities: [Trainer, Team, TeamPokemon, PokemonCache],
      }),
    }),
    TrainersModule,
    TeamsModule,
    TeamPokemonsModule,
    PokeApiModule,
    PokemonCacheModule,
    MessagingModule,
    HealthModule,
  ],
})
export class AppModule {}
```

## Endpoints

### Treinadores

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/trainers` | Criar treinador |
| GET | `/trainers` | Listar treinadores |
| GET | `/trainers/:id` | Buscar treinador |
| PATCH | `/trainers/:id` | Atualizar treinador |
| DELETE | `/trainers/:id` | Remover treinador |

### Times

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/trainers/:trainerId/teams` | Criar time |
| GET | `/trainers/:trainerId/teams` | Listar times do treinador |
| GET | `/teams/:id` | Buscar time |
| PATCH | `/teams/:id` | Atualizar time |
| DELETE | `/teams/:id` | Remover time |

### Pokémon do Time

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/teams/:teamId/pokemons` | Adicionar Pokémon ao time |
| GET | `/teams/:teamId/pokemons` | Listar Pokémon com detalhes da PokéAPI |
| DELETE | `/teams/:teamId/pokemons/:teamPokemonId` | Remover Pokémon do time |

## Fluxo ao adicionar um Pokémon

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant PokeAPI
    participant DB
    participant RabbitMQ
    participant Consumer

    Client->>API: POST /teams/{id}/pokemons
    API->>PokeAPI: GET /pokemon/{id}
    API->>DB: INSERT team_pokemon
    API->>RabbitMQ: publish pokemon.sync
    API-->>Client: 201

    RabbitMQ->>Consumer: consume
    Consumer->>PokeAPI: GET /pokemon/{id}
    Consumer->>DB: UPSERT pokemon_cache
    Consumer->>DB: UPDATE sync_status
```

## Modelo de dados

```
Trainer (1) ──< (N) Team (1) ──< (N) TeamPokemon >── PokemonCache
```

- **Trainer**: `id`, `nome`, `cidadeOrigem`
- **Team**: `id`, `nomeDoTime`, `treinadorId`
- **TeamPokemon**: `id`, `timeId`, `pokemonIdOuNome`, `syncStatus`
- **PokemonCache**: `pokemonIdentifier`, `pokeapiId`, `nome`, `tipos`, `sprite`, `habilidades`

## Decisões de projeto

**RabbitMQ no enriquecimento** — A PokéAPI precisa ser consultada antes de salvar (validação). Porém, buscar tipos, sprite e habilidades no mesmo request deixaria a resposta mais lenta. Separei: o POST valida e responde rápido; um consumer processa o restante em background.

**Cache (`pokemon_cache`)** — Ao listar os Pokémon de um time, os dados vêm do banco em vez de chamar a PokéAPI toda vez. O cache é reutilizado entre times diferentes.

**Camadas** — Controllers recebem requests e validam DTOs. Services concentram regras de negócio. Repositories encapsulam o TypeORM. Entidades do banco não são expostas diretamente na API.

**`syncStatus`** — Indica se os detalhes do Pokémon já foram sincronizados (`pending`, `synced`, `failed`). Útil logo após adicionar um Pokémon, antes do consumer terminar.

## Scripts

```bash
npm run start:dev    # desenvolvimento
npm run build        # build
npm run start:prod   # produção
npm run test         # testes unitários
npm run lint         # eslint
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta da API |
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USERNAME` | `pokemon` | Usuário do banco |
| `DB_PASSWORD` | `pokemon` | Senha do banco |
| `DB_DATABASE` | `pokemon_teams` | Nome do banco |
| `RABBITMQ_URI` | `amqp://pokemon:pokemon@localhost:5672` | URI do RabbitMQ |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | Base URL da PokéAPI |
| `MAX_POKEMON_PER_TEAM` | `6` | Limite de Pokémon por time |

## Exemplo

```bash
curl -X POST http://localhost:3000/trainers \
  -H "Content-Type: application/json" \
  -d '{"nome": "Ash Ketchum", "cidadeOrigem": "Pallet Town"}'

curl -X POST http://localhost:3000/trainers/{trainerId}/teams \
  -H "Content-Type: application/json" \
  -d '{"nomeDoTime": "Time Inicial"}'

curl -X POST http://localhost:3000/teams/{teamId}/pokemons \
  -H "Content-Type: application/json" \
  -d '{"pokemonIdOuNome": "pikachu"}'

curl http://localhost:3000/teams/{teamId}/pokemons
```

## Autor

Lucas Leite — [olucasleitedev](https://github.com/olucasleitedev)

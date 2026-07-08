# Leany Pokémon Teams API

API RESTful em **NestJS** para gerenciar Treinadores, Times e Pokémon, com integração à [PokéAPI](https://pokeapi.co/) e enriquecimento assíncrono de dados via **RabbitMQ**.

Desenvolvida como solução para o desafio técnico da Leany, indo além dos requisitos com arquitetura orientada a eventos, cache local e testes unitários.

## Diferenciais (nível sênior)

- **RabbitMQ**: ao adicionar um Pokémon ao time, a API valida na PokéAPI de forma síncrona, persiste a referência e publica um evento na fila `pokemon.sync` para enriquecimento assíncrono.
- **Cache local (`pokemon_cache`)**: detalhes da PokéAPI são armazenados no PostgreSQL, evitando chamadas repetidas e desacoplando leitura de escrita.
- **Status de sincronização**: cada Pokémon do time expõe `syncStatus` (`pending`, `synced`, `failed`).
- **Arquitetura em camadas**: Controllers → Services → Repositories, com DTOs em todas as entradas/saídas.
- **Swagger** em `/docs` e **health check** em `/health`.
- **Testes unitários** para serviços críticos.

## Stack

- NestJS 11 + TypeScript
- PostgreSQL 16 (Docker)
- RabbitMQ 3.13 (Docker)
- TypeORM
- Swagger (OpenAPI)
- class-validator / class-transformer
- @golevelup/nestjs-rabbitmq

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## Setup rápido

```bash
# 1. Clonar o repositório
git clone https://github.com/olucasleitedev/leany-pokemon-api.git
cd leany-pokemon-api

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Subir infraestrutura (PostgreSQL + RabbitMQ)
docker compose up -d

# 5. Rodar a API
npm run start:dev
```

A API estará disponível em `http://localhost:3000` e a documentação Swagger em `http://localhost:3000/docs`.

### RabbitMQ Management UI

- URL: `http://localhost:15672`
- Usuário: `pokemon`
- Senha: `pokemon`

## Endpoints principais

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
| POST | `/trainers/:trainerId/teams` | Criar time para treinador |
| GET | `/trainers/:trainerId/teams` | Listar times do treinador |
| GET | `/teams/:id` | Buscar time |
| PATCH | `/teams/:id` | Atualizar time |
| DELETE | `/teams/:id` | Remover time |

### Pokémon do Time

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/teams/:teamId/pokemons` | Adicionar Pokémon (valida na PokéAPI) |
| GET | `/teams/:teamId/pokemons` | Listar Pokémon com detalhes enriquecidos |
| DELETE | `/teams/:teamId/pokemons/:teamPokemonId` | Remover Pokémon do time |

## Fluxo de adição de Pokémon

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant PokeAPI
    participant DB
    participant RabbitMQ
    participant Consumer

    Client->>API: POST /teams/{id}/pokemons
    API->>PokeAPI: GET /pokemon/{id} (validação)
    API->>DB: INSERT team_pokemon (syncStatus=pending)
    API->>RabbitMQ: publish pokemon.sync.requested
    API-->>Client: 201 (dados básicos + pending)

    RabbitMQ->>Consumer: consume message
    Consumer->>PokeAPI: GET /pokemon/{id} (detalhes)
    Consumer->>DB: UPSERT pokemon_cache
    Consumer->>DB: UPDATE syncStatus=synced
```

## Modelo de dados

```
Trainer (1) ──< (N) Team (1) ──< (N) TeamPokemon >── PokemonCache
                                                      (via identifier)
```

- **Trainer**: `id`, `nome`, `cidadeOrigem`
- **Team**: `id`, `nomeDoTime`, `treinadorId`
- **TeamPokemon**: `id`, `timeId`, `pokemonIdOuNome`, `syncStatus`
- **PokemonCache**: `pokemonIdentifier`, `pokeapiId`, `nome`, `tipos`, `sprite`, `habilidades`

## Decisões de arquitetura

### Por que RabbitMQ?

A validação na PokéAPI precisa ser síncrona (garantir que o Pokémon existe antes de persistir), mas o enriquecimento de dados (tipos, sprite, habilidades) pode ser assíncrono. Isso:

- Reduz latência da resposta HTTP
- Isola falhas temporárias da PokéAPI no consumer
- Permite retry via Dead Letter Exchange
- Demonstra padrão event-driven em produção

### Por que cache local?

Evita N chamadas à PokéAPI ao listar os 6 Pokémon de um time. O cache é compartilhado entre times (um `pikachu` cacheado serve todos os times).

### Repositórios dedicados

Cada módulo possui um Repository que encapsula o TypeORM, mantendo Services focados em regras de negócio.

## Scripts

```bash
npm run start:dev    # Desenvolvimento com hot-reload
npm run build        # Build de produção
npm run start:prod   # Rodar build de produção
npm run test         # Testes unitários
npm run test:cov     # Cobertura de testes
npm run lint         # ESLint
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

## Exemplo de uso

```bash
# Criar treinador
curl -X POST http://localhost:3000/trainers \
  -H "Content-Type: application/json" \
  -d '{"nome": "Ash Ketchum", "cidadeOrigem": "Pallet Town"}'

# Criar time
curl -X POST http://localhost:3000/trainers/{trainerId}/teams \
  -H "Content-Type: application/json" \
  -d '{"nomeDoTime": "Time Inicial"}'

# Adicionar Pokémon
curl -X POST http://localhost:3000/teams/{teamId}/pokemons \
  -H "Content-Type: application/json" \
  -d '{"pokemonIdOuNome": "pikachu"}'

# Listar Pokémon (aguarde alguns segundos para syncStatus=synced)
curl http://localhost:3000/teams/{teamId}/pokemons
```

## Autor

Lucas Leite — [olucasleitedev](https://github.com/olucasleitedev)

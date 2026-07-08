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

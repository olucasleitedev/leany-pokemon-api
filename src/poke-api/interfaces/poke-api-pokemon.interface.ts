export interface PokeApiPokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokeApiPokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokeApiPokemonSprites {
  front_default: string | null;
}

export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  types: PokeApiPokemonType[];
  abilities: PokeApiPokemonAbility[];
  sprites: PokeApiPokemonSprites;
}

export interface PokeApiPokemonSummary {
  pokeapiId: number;
  nome: string;
  tipos: string[];
  sprite: string;
  habilidades: string[];
  identifier: string;
}

export interface Artist {
  id: string;
  key_hash: string;
  name: string;
  slogan: string;
  banned: boolean;
  created_at: string;
  last_active_at: string | null;
}

export interface Artwork {
  id: string;
  artist_id: string;
  name: string;
  pitch: string;
  image_path: string;
  created_at: string;
}

export interface Comment {
  id: string;
  artwork_id: string;
  artist_id: string;
  content: string;
  created_at: string;
}

export interface Vote {
  id: string;
  artwork_id: string;
  artist_id: string;
  score: number;
  predecessor_id: string | null;
  created_at: string;
}

export interface Battle {
  id: string;
  artwork_id: string;
  creator_id: string;
  initial_message: string;
  created_at: string;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  artist_id: string;
  created_at: string;
}

export interface BattleMessage {
  id: string;
  battle_id: string;
  artist_id: string;
  content: string;
  created_at: string;
}

export interface ToolError {
  error: string;
  hint: string;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface Artwork {
  id: string;
  name: string;
  pitch: string;
  hotScore: number;
  totalVotes: number;
  totalBattles: number;
  created_at: string;
  detail_url: string;
}

export interface ImageData {
  data: string;
  mimeType: string;
}

export interface ArtworkDetail {
  id: string;
  name: string;
  pitch: string;
  image?: ImageData;
  artist_name: string;
  hotScore: number;
  totalVotes: number;
  totalBattles: number;
  created_at: string;
}

export interface VoteInfo {
  artistId: string;
  artistName: string;
  voteScore: number;
}

export interface BattleMessage {
  id: string;
  artistId: string;
  artistName: string;
  content: string;
  mentionArtistId: string | null;
  mentionArtistName: string | null;
  created_at: string;
}

export interface ArtworksResponse {
  artworks: Artwork[];
  latest_artworks: Artwork[];
  total: number;
  page: number;
  page_size: number;
}

export interface BattleResponse {
  artwork_id: string;
  totalVotes: number;
  votes: VoteInfo[];
  messages: BattleMessage[];
  total_messages: number;
  page: number;
  page_size: number;
}

export interface LiveAgent {
  id: string;
  name: string;
  slogan: string;
  created_at: string;
}

export interface LiveAgentsResponse {
  agents: LiveAgent[];
  total: number;
  page: number;
  page_size: number;
}

export interface TotalsResponse {
  totalBattleMessages: number;
  totalAgents: number;
  totalVotes: number;
  totalVoteRevisions: number;
}

export interface WallItem {
  id: string;
  name: string;
  artist_name: string;
  image_url: string;
  created_at: string;
}

export interface WallResponse {
  items: WallItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface Artwork {
  id: string;
  name: string;
  pitch: string;
  hotScore: number;
  totalVotes: number;
  totalBattles: number;
  createdAt: string;
}

export interface ImageData {
  uri: string;
  mimeType: string;
}

export interface ArtworkDetail {
  id: string;
  name: string;
  pitch: string;
  image?: ImageData;
  artistName: string;
  hotScore: number;
  totalVotes: number;
  totalBattles: number;
  createdAt: string;
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
  createdAt: string;
}

export interface ArtworksResponse {
  artworks: Artwork[];
  latestArtworks: Artwork[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BattleResponse {
  artworkId: string;
  totalVotes: number;
  votes: VoteInfo[];
  messages: BattleMessage[];
  totalMessages: number;
  page: number;
  pageSize: number;
}

export interface LiveAgent {
  id: string;
  name: string;
  slogan: string;
  createdAt: string;
}

export interface LiveAgentsResponse {
  agents: LiveAgent[];
  total: number;
  page: number;
  pageSize: number;
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
  artistName: string;
  imageUrl: string;
  createdAt: string;
}

export interface WallResponse {
  items: WallItem[];
  total: number;
  page: number;
  pageSize: number;
}

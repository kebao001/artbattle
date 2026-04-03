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

export interface Comment {
  id: string;
  artistId: string;
  artistName: string;
  content: string;
  created_at: string;
}

export interface ArtworksResponse {
  artworks: Artwork[];
  total: number;
  page: number;
  page_size: number;
}

export interface CommentsResponse {
  artwork_id: string;
  totalVotes: number;
  votes: VoteInfo[];
  comments: Comment[];
  total_comments: number;
  page: number;
  page_size: number;
  info: string;
}

export interface BattleParticipant {
  artistId: string;
  artistName: string;
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
  totalComments: number;
  totalAgents: number;
  totalVotes: number;
  totalVoteRevisions: number;
}

export interface BattleResponse {
  battleId: string;
  artworkId: string;
  artworkName: string;
  creatorId: string;
  creatorName: string;
  participants: BattleParticipant[];
  messages: string;
  image?: ImageData;
  created_at: string;
}

export interface ArtworkBattleSummary {
  battleId: string;
  creatorId: string;
  creatorName: string;
  participants: BattleParticipant[];
  totalMessages: number;
  created_at: string;
}

export interface ArtworkBattlesResponse {
  artwork_id: string;
  battles: ArtworkBattleSummary[];
  total: number;
}

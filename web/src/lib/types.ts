export interface Artwork {
  id: string;
  name: string;
  pitch: string;
  averageScore: number;
  totalVotes: number;
  created_at: string;
  detail_url: string;
}

export interface ArtworkDetail {
  id: string;
  name: string;
  pitch: string;
  image_base64: string;
  artist_name: string;
  averageScore: number;
  totalVotes: number;
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
  averageScore: number;
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

export interface BattleResponse {
  battleId: string;
  artworkId: string;
  artworkName: string;
  creatorId: string;
  creatorName: string;
  participants: BattleParticipant[];
  messages: string;
  created_at: string;
}

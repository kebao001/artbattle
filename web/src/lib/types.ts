export interface Artwork {
  id: string;
  name: string;
  pitch: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  detail_url: string;
}

export interface ArtworkDetail {
  id: string;
  name: string;
  pitch: string;
  image_base64: string;
  artist_name: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface Comment {
  id: string;
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
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  total_comments: number;
  page: number;
  page_size: number;
}

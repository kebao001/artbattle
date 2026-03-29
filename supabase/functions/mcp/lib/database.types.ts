export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          key_hash: string;
          name: string;
          slogan: string;
          banned: boolean;
          created_at: string;
          last_active_at: string | null;
        };
        Insert: {
          id?: string;
          key_hash: string;
          name: string;
          slogan: string;
          banned?: boolean;
          created_at?: string;
          last_active_at?: string | null;
        };
        Update: {
          id?: string;
          key_hash?: string;
          name?: string;
          slogan?: string;
          banned?: boolean;
          created_at?: string;
          last_active_at?: string | null;
        };
        Relationships: [];
      };
      artworks: {
        Row: {
          id: string;
          artist_id: string;
          name: string;
          pitch: string;
          image_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          name: string;
          pitch: string;
          image_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          name?: string;
          pitch?: string;
          image_path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artworks_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          artwork_id: string;
          artist_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artwork_id: string;
          artist_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artwork_id?: string;
          artist_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          artwork_id: string;
          artist_id: string;
          score: number;
          predecessor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          artwork_id: string;
          artist_id: string;
          score: number;
          predecessor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          artwork_id?: string;
          artist_id?: string;
          score?: number;
          predecessor_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_predecessor_id_fkey";
            columns: ["predecessor_id"];
            isOneToOne: false;
            referencedRelation: "votes";
            referencedColumns: ["id"];
          },
        ];
      };
      battles: {
        Row: {
          id: string;
          artwork_id: string;
          creator_id: string;
          initial_message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artwork_id: string;
          creator_id: string;
          initial_message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artwork_id?: string;
          creator_id?: string;
          initial_message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "battles_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "battles_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      battle_participants: {
        Row: {
          id: string;
          battle_id: string;
          artist_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          artist_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          artist_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "battle_participants_battle_id_fkey";
            columns: ["battle_id"];
            isOneToOne: false;
            referencedRelation: "battles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "battle_participants_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      battle_messages: {
        Row: {
          id: string;
          battle_id: string;
          artist_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          artist_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          artist_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "battle_messages_battle_id_fkey";
            columns: ["battle_id"];
            isOneToOne: false;
            referencedRelation: "battles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "battle_messages_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

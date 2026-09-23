/**
 * Hand-written Supabase database types matching
 * `supabase/migrations/0001_init.sql`.
 *
 * In a real deployment, regenerate this file from the live schema with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 * Keeping it hand-written for now avoids requiring a live Supabase
 * project just to get correct TypeScript types during development.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "editor";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "editor";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          storage_path: string | null;
          thumbnail_storage_path: string | null;
          location: string | null;
          street: string | null;
          barangay: string | null;
          city: string | null;
          province: string | null;
          region: string | null;
          latitude: number | null;
          longitude: number | null;
          recorded_at: string | null;
          uploaded_at: string;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          category_id: string | null;
          tags: string[];
          views: number;
          status: "draft" | "published" | "private" | "deleted";
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          storage_path?: string | null;
          thumbnail_storage_path?: string | null;
          location?: string | null;
          street?: string | null;
          barangay?: string | null;
          city?: string | null;
          province?: string | null;
          region?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          recorded_at?: string | null;
          uploaded_at?: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          category_id?: string | null;
          tags?: string[];
          views?: number;
          status?: "draft" | "published" | "private" | "deleted";
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      video_views: {
        Row: {
          id: string;
          video_id: string;
          viewer_key: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          viewer_key: string;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["video_views"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_video_views: {
        Args: { p_video_id: string; p_viewer_key: string };
        Returns: number;
      };
    };
    Enums: {
      video_status: "draft" | "published" | "private" | "deleted";
    };
  };
}

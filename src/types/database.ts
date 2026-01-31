export type UserRole = 'data_science' | 'crm_ops' | 'brand_manager' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  brands_access: string[];
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  user_email: string;
  template_id: string;
  template_name: string;
  template_version: number;
  user_variables: Record<string, string>;
  compiled_prompt: string;
  model: string;
  provider: string;
  generated_content: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  duration_ms: number | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  langfuse_trace_id: string | null;
  portkey_request_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Supabase database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
      };
      generations: {
        Row: Generation;
        Insert: Partial<Generation> & {
          user_id: string;
          user_email: string;
          template_id: string;
          template_name: string;
          template_version: number;
          compiled_prompt: string;
          model: string;
          provider: string;
        };
        Update: Partial<Generation>;
      };
    };
  };
};

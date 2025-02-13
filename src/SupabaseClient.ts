import { createClient } from '@supabase/supabase-js';
import { type Database } from './supabase';
export class SupabaseClient {
  private client;

  constructor(env: Env) {
    this.client = createClient<Database>(
      env.SUPABASE_PROJECT_URL,
      env.SUPABASE_PUBLIC_ANON_KEY,
    );
  }

  async savePopularity(external_id: string, popularity: number) {
    await this.client
      .from('articles')
      .update({
        popularity,
      })
      .eq('external_id', external_id);
  }
}

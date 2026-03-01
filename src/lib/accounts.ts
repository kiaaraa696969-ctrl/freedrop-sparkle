import { supabase } from '@/integrations/supabase/client';

export type AccountCategory = 'Steam' | 'Crunchyroll' | 'Netflix' | 'Spotify' | 'Disney+' | 'Other';

export type NetflixType = 'account' | 'cookies';

export interface AccountDrop {
  id: string;
  title: string;
  category: AccountCategory;
  email: string;
  password: string;
  notes?: string;
  screenshot?: string;
  isClaimed: boolean;
  claimedAt?: string;
  droppedAt: string;
  thumbnail?: string;
  games?: string;
  netflixType?: NetflixType;
  cookieFile?: string;
  cookieFileName?: string;
  planDetails?: string;
}

export const CATEGORY_COLORS: Record<AccountCategory, { color: string; icon: string }> = {
  Steam: { color: '#4a90d9', icon: '🎮' },
  Crunchyroll: { color: '#f47521', icon: '🍥' },
  Netflix: { color: '#e50914', icon: '🎬' },
  Spotify: { color: '#1db954', icon: '🎵' },
  'Disney+': { color: '#1e4db5', icon: '✨' },
  Other: { color: '#9b59b6', icon: '🎁' },
};

// Map DB row to AccountDrop
function mapRow(row: any): AccountDrop {
  return {
    id: row.id,
    title: row.title,
    category: row.category as AccountCategory,
    email: row.email,
    password: row.password,
    notes: row.notes || undefined,
    screenshot: row.screenshot || undefined,
    isClaimed: row.is_claimed,
    claimedAt: row.claimed_at || undefined,
    droppedAt: row.dropped_at,
    thumbnail: row.thumbnail || undefined,
    games: row.games || undefined,
    netflixType: row.netflix_type as NetflixType | undefined,
    cookieFile: row.cookie_file || undefined,
    cookieFileName: row.cookie_file_name || undefined,
    planDetails: row.plan_details || undefined,
  };
}

export async function fetchAccounts(): Promise<AccountDrop[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('dropped_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function fetchAccountById(id: string): Promise<AccountDrop | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function claimAccount(id: string): Promise<void> {
  await supabase
    .from('accounts')
    .update({ is_claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', id);
}

export async function addAccount(account: Omit<AccountDrop, 'id' | 'isClaimed' | 'droppedAt'>): Promise<AccountDrop | null> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      title: account.title,
      category: account.category,
      email: account.email,
      password: account.password,
      notes: account.notes || null,
      screenshot: account.screenshot || null,
      games: account.games || null,
      netflix_type: account.netflixType || null,
      cookie_file: account.cookieFile || null,
      cookie_file_name: account.cookieFileName || null,
      plan_details: account.planDetails || null,
    })
    .select()
    .single();
  if (error) {
    console.error('Failed to add account:', error);
    return null;
  }
  return mapRow(data);
}

export async function deleteAccount(id: string): Promise<void> {
  await supabase.from('accounts').delete().eq('id', id);
}

export async function resetClaim(id: string): Promise<void> {
  await supabase
    .from('accounts')
    .update({ is_claimed: false, claimed_at: null })
    .eq('id', id);
}

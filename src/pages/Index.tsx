import { useState, useEffect } from 'react';
import { AccountDrop, fetchAccounts } from '@/lib/accounts';
import { AccountCard } from '@/components/AccountCard';
import { RightSidebar } from '@/components/RightSidebar';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Megaphone, ExternalLink, LogIn, LogOut, Shield, User, Users, Search, X } from 'lucide-react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { AdSlot } from '@/components/AdSlot';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';

const Index = () => {
  const { user, isAdmin, signOut, displayName, avatarUrl } = useAuth();
  const onlineCount = useOnlineUsers();
  const [accounts, setAccounts] = useState<AccountDrop[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts().then(setAccounts);
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAnnouncements(data as any[]);
      });
  }, []);

  const filtered = accounts;
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const available = accounts.filter(a => !a.isClaimed).length;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Ancient Blood" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-foreground">Ancient Blood</span>
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {onlineCount} online
            </span>
            <span className="text-sm text-muted-foreground">
              {available} available
            </span>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Avatar className="w-6 h-6">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                    <AvatarFallback className="text-[10px] bg-muted">
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  {displayName || 'Profile'}
                </Link>
                <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 sm:pt-20 sm:pb-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
          Free Premium<br />
          <span className="text-primary">Accounts</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
          Steam, Netflix, Spotify & more — new drops every day, first come first served.
        </p>
      </div>

      {announcements.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              <Megaphone className="w-4 h-4 text-primary" />
              Announcements
            </h2>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.message}</p>
                    {a.link_text && a.link_url && (
                      <a
                        href={a.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                      >
                        {a.link_text}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-8">
        <AdSlot slotName="hero_below" fallbackHeight="h-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {visible.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-2xl border border-border">
                <p className="text-5xl mb-3">🎮</p>
                <h3 className="text-lg font-semibold text-foreground mb-2">No drops yet</h3>
                <p className="text-sm text-muted-foreground">Check back soon for new accounts.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {visible.map((account, i) => {
                    const items = [<AccountCard key={account.id} account={account} />];
                    if (i === 3 && visible.length > 4) {
                      items.push(
                        <div key="feed-ad" className="sm:col-span-2">
                          <AdSlot slotName="feed_between" fallbackHeight="h-[90px]" />
                        </div>
                      );
                    }
                    return items;
                  })}
                </div>
                {filtered.length > 6 && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showAll ? 'Show less' : `View all ${filtered.length}`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block w-[300px] shrink-0 sticky top-20">
            <RightSidebar accounts={accounts} />
          </div>
        </div>

        <div className="lg:hidden mt-12">
          <RightSidebar accounts={accounts} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        <AdSlot slotName="footer_above" fallbackHeight="h-[90px]" />
      </div>

      <AdSlot slotName="social_bar" fallbackHeight="h-0" className="fixed bottom-0 left-0 right-0 z-[999]" />

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ancient Blood</span> · New accounts every day
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

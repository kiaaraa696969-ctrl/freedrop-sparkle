import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AccountDrop, CATEGORY_COLORS, fetchAccountBySlug, claimAccount } from '@/lib/accounts';
import { ArrowLeft, AlertTriangle, Timer, Shield } from 'lucide-react';
import { AdSlot } from '@/components/AdSlot';
import thumbSteam from '@/assets/thumb-steam.jpg';
import thumbCrunchyroll from '@/assets/thumb-crunchyroll.jpg';
import thumbNetflix from '@/assets/thumb-netflix.jpg';
import thumbSpotify from '@/assets/thumb-spotify.jpg';
import thumbDisney from '@/assets/thumb-disney.jpg';

const THUMBNAILS: Record<string, string> = {
  Steam: thumbSteam,
  Crunchyroll: thumbCrunchyroll,
  Netflix: thumbNetflix,
  Spotify: thumbSpotify,
  'Disney+': thumbDisney,
};

const COUNTDOWN_SECONDS = 10;

const AccountDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountDrop | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchAccountBySlug(slug)
        .then(setAccount)
        .catch(() => setAccount(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && account) {
      if (!account.isClaimed) {
        claimAccount(account.id);
      }
      navigate(`/account/${account.slug}/reveal`);
    }
  }, [countdown, account, navigate]);

  const handleAccountClick = useCallback(() => {
    if (countdown === null) {
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, [countdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">Not Found</h2>
          <Link to="/" className="text-primary text-sm hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const { color, icon } = CATEGORY_COLORS[account.category];
  const thumb = account.screenshot || THUMBNAILS[account.category];
  const isCountingDown = countdown !== null && countdown > 0;
  const progress = isCountingDown ? ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100 : 0;
  const showButton = !isCountingDown;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-base font-semibold text-foreground truncate">{account.title}</span>
          <span
            className="ml-auto shrink-0 text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ backgroundColor: color, color: '#fff' }}
          >
            {icon} {account.category}
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <AdSlot slotName="detail_top" fallbackHeight="h-[90px]" />
        </div>

        <div className="rounded-2xl overflow-hidden border border-border mb-10 shadow-lg">
          {thumb ? (
            <img src={thumb} alt={account.title} className="w-full object-cover" />
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-6xl bg-muted">
              {icon}
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{account.title}</h1>
        {account.notes && (
          <p className="text-base text-muted-foreground mb-8">{account.notes}</p>
        )}

        <div className="text-center py-10 mb-10 bg-card rounded-2xl border border-border">
          <p className="text-sm text-muted-foreground mb-6">
            Click below to unlock account details
          </p>

          {showButton && (
            <button
              onClick={handleAccountClick}
              className="font-bold text-lg px-8 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              Get Account
            </button>
          )}

          {isCountingDown && (
            <div className="max-w-[260px] mx-auto">
              <div className="border border-border rounded-2xl p-8 bg-muted">
                <Timer className="w-6 h-6 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-muted-foreground mb-2">Unlocking in</p>
                <div className="text-4xl font-bold text-foreground mb-4 font-mono">
                  {countdown}
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-destructive/10 border border-destructive/20 text-center py-3.5 px-5 rounded-xl mb-10 flex items-center justify-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
          <span className="text-sm text-destructive">
            Ignore fake pop-ups in ads — close them and return here.
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Ad-Supported</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This platform is ad-funded to keep offering free access.
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
            <span className="text-xl mt-0.5">💬</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Community</h3>
              <a href="#" className="text-sm font-medium text-primary hover:underline">
                Join our Discord →
              </a>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <AdSlot slotName="detail_bottom" fallbackHeight="h-[250px]" />
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground mb-2">Disclaimer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Accounts are public and gathered from open sources. We don't support illegal activities. Accounts are shared as-is and may last hours, days, or months. Use responsibly.
          </p>
        </div>
      </div>

      <footer className="border-t border-border py-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ancient Blood</span> · New accounts every day
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AccountDetail;

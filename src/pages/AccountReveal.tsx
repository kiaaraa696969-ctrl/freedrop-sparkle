import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountDrop, CATEGORY_COLORS, fetchAccountById } from '@/lib/accounts';
import { ArrowLeft, Copy, CheckCircle2, Download, Gamepad2, ShieldCheck } from 'lucide-react';
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

const AccountReveal = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<AccountDrop | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAccountById(id).then(setAccount);
  }, [id]);

  const handleCopy = (value: string, type: string) => {
    navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link to={`/account/${account.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-base font-semibold text-foreground truncate">
            {account.category === 'Netflix' && account.netflixType === 'cookies' ? 'Cookie Details' : 'Account Details'}
          </span>
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

        <div className="rounded-2xl overflow-hidden border border-border mb-8 shadow-lg">
          {thumb ? (
            <img src={thumb} alt={account.title} className="w-full object-cover" />
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-6xl bg-muted">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{account.title}</h1>
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold">Unlocked</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            {account.category === 'Netflix' && account.netflixType === 'cookies' ? 'Cookie File' : 'Account Credentials'}
          </h2>

          {account.category === 'Netflix' && account.netflixType === 'cookies' ? (
            <div className="space-y-4">
              {account.cookieFile && (
                <a
                  href={account.cookieFile}
                  download={account.cookieFileName || 'cookies.rar'}
                  className="flex items-center justify-center gap-2.5 bg-primary text-primary-foreground rounded-xl px-5 py-4 text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="w-5 h-5" />
                  Download {account.cookieFileName || 'cookies.rar'}
                </a>
              )}
              <p className="text-sm text-muted-foreground bg-muted rounded-xl px-5 py-4">
                🍪 Import these cookies into your browser using a cookie editor extension to access the account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <CredentialRow
                label="Email"
                value={account.email}
                copied={copied === 'email'}
                onCopy={() => handleCopy(account.email, 'email')}
              />
              <CredentialRow
                label="Password"
                value={account.password}
                copied={copied === 'password'}
                onCopy={() => handleCopy(account.password, 'password')}
              />
            </div>
          )}
        </div>

        {account.category === 'Steam' && account.games && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Steam Library</h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {account.games.split(',').map((game, i) => (
                <span key={i} className="text-sm font-medium bg-muted text-foreground px-4 py-2 rounded-xl">
                  {game.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {account.category === 'Crunchyroll' && account.planDetails && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex items-center gap-3">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Plan:</span>
            <span className="text-base font-bold text-foreground">{account.planDetails}</span>
          </div>
        )}

        {account.notes && (
          <div className="bg-muted rounded-2xl px-6 py-5 mb-10">
            <p className="text-sm text-muted-foreground leading-relaxed">💡 {account.notes}</p>
          </div>
        )}

        <div className="bg-destructive/10 border border-destructive/20 text-center py-3.5 px-5 rounded-xl mb-10 flex items-center justify-center gap-2.5">
          <span className="text-sm text-destructive">
            ⚠️ Ignore fake pop-ups in ads — close them and return here.
          </span>
        </div>

        <div className="text-center mb-12">
          <a href="#" className="text-sm font-semibold text-primary hover:underline">
            Join our Discord →
          </a>
        </div>

        <div className="mb-10">
          <AdSlot slotName="detail_bottom" fallbackHeight="h-[250px]" />
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Disclaimer</h2>
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

function CredentialRow({ label, value, copied, onCopy }: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-muted rounded-xl px-5 py-4 gap-3">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1 font-semibold">{label}</span>
        <span className="text-base font-mono text-foreground truncate block">{value}</span>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 w-9 h-9 rounded-xl bg-secondary flex items-center justify-center transition-all cursor-pointer hover:bg-secondary/80"
      >
        {copied
          ? <CheckCircle2 className="w-4 h-4 text-primary" />
          : <Copy className="w-4 h-4 text-muted-foreground" />
        }
      </button>
    </div>
  );
}

export default AccountReveal;

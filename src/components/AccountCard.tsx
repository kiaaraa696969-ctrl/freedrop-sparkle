import { AccountDrop, CATEGORY_COLORS } from '@/lib/accounts';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface AccountCardProps {
  account: AccountDrop;
  onClaim?: (accounts: AccountDrop[]) => void;
}

export function AccountCard({ account }: AccountCardProps) {
  const { color, icon } = CATEGORY_COLORS[account.category];
  const thumb = account.screenshot || THUMBNAILS[account.category];
  const timeAgo = getTimeAgo(account.droppedAt);

  return (
    <Link
      to={`/account/${account.id}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {thumb ? (
          <img
            src={thumb}
            alt={account.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">
            {icon}
          </div>
        )}

        <div
          className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {icon} {account.category}
        </div>

        {account.isClaimed && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-semibold text-muted-foreground bg-card px-4 py-1.5 rounded-lg border border-border">
              Claimed
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base text-foreground mb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {account.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
          {!account.isClaimed && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              Available
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

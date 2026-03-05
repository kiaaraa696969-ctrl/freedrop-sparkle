import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Zap, Bug, Trash2, RefreshCw } from 'lucide-react';
import logo from '@/assets/logo.webp';

const CHANGE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  added: { label: 'Added', icon: <Plus className="w-3.5 h-3.5" />, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  changed: { label: 'Changed', icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  fixed: { label: 'Fixed', icon: <Bug className="w-3.5 h-3.5" />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  removed: { label: 'Removed', icon: <Trash2 className="w-3.5 h-3.5" />, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  improved: { label: 'Improved', icon: <Zap className="w-3.5 h-3.5" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

interface ChangelogEntry {
  id: string;
  title: string;
  description: string | null;
  change_type: string;
  created_at: string;
}

const Changelog = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('changelog')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEntries(data as ChangelogEntry[]);
        setLoading(false);
      });
  }, []);

  // Group entries by date
  const grouped = entries.reduce<Record<string, ChangelogEntry[]>>((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Ancient Blood" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-foreground">Ancient Blood</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Changelog</h1>
        <p className="text-muted-foreground mb-10">All the latest updates and changes to Ancient Blood.</p>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <p className="text-4xl mb-3">📋</p>
            <h3 className="text-lg font-semibold text-foreground mb-2">No changes yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">{date}</h2>
                <div className="space-y-3">
                  {items.map(entry => {
                    const config = CHANGE_TYPE_CONFIG[entry.change_type] || CHANGE_TYPE_CONFIG.added;
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border shrink-0 mt-0.5 ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{entry.title}</p>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Changelog;

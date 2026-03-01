import { useState, useEffect, useRef } from 'react';
import { AccountDrop, AccountCategory, NetflixType, CATEGORY_COLORS, fetchAccounts, addAccount, deleteAccount, resetClaim } from '@/lib/accounts';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, RefreshCw, Zap, LogOut, RotateCcw, CheckCircle2, ImagePlus, X, FileArchive, Megaphone, Power, MonitorPlay, Save, Webhook } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invalidateAdCache } from '@/components/AdSlot';

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [accounts, setAccounts] = useState<AccountDrop[]>([]);
  const [form, setForm] = useState({
    title: '',
    category: 'Steam' as AccountCategory,
    email: '',
    password: '',
    notes: '',
    games: '',
    netflixType: 'account' as NetflixType,
    planDetails: '',
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [cookieFile, setCookieFile] = useState<{ data: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cookieFileRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementLinkText, setAnnouncementLinkText] = useState('');
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('');
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [adSaving, setAdSaving] = useState<string | null>(null);
  const [adSuccess, setAdSuccess] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<AccountCategory>('Steam');
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkPaste, setBulkPaste] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAccounts().then(setAccounts);
      fetchAnnouncements();
      fetchAdSlots();
      fetchWebhookUrl();
    }
  }, [isAdmin]);

  const fetchWebhookUrl = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'discord_webhook_url')
      .maybeSingle();
    if (data) setWebhookUrl(data.value);
  };

  const handleSaveWebhook = async () => {
    setWebhookSaving(true);
    await supabase
      .from('site_settings')
      .update({ value: webhookUrl, updated_at: new Date().toISOString() })
      .eq('key', 'discord_webhook_url');
    setWebhookSaving(false);
    setWebhookSuccess(true);
    setTimeout(() => setWebhookSuccess(false), 2000);
  };

  const fetchAdSlots = async () => {
    const { data } = await supabase
      .from('ad_slots')
      .select('*')
      .order('slot_name');
    if (data) setAdSlots(data);
  };

  const handleSaveAd = async (id: string, ad_code: string) => {
    setAdSaving(id);
    await supabase
      .from('ad_slots')
      .update({ ad_code, updated_at: new Date().toISOString() })
      .eq('id', id);
    invalidateAdCache();
    setAdSaving(null);
    setAdSuccess(id);
    setTimeout(() => setAdSuccess(null), 2000);
  };

  const handleToggleAd = async (id: string, is_active: boolean) => {
    await supabase
      .from('ad_slots')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    invalidateAdCache();
    fetchAdSlots();
  };

  const fetchAnnouncements = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/manage-announcements`, {
        headers: { 'Authorization': `Bearer ${supabaseKey}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/manage-announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ message: announcementMsg, link_text: announcementLinkText || null, link_url: announcementLinkUrl || null }),
      });
      setAnnouncementMsg('');
      setAnnouncementLinkText('');
      setAnnouncementLinkUrl('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to add announcement:', err);
    }
  };

  const handleToggleAnnouncement = async (id: string, is_active: boolean) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/manage-announcements?action=toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ id, is_active }),
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle announcement:', err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${supabaseUrl}/functions/v1/manage-announcements?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ id }),
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNetflixCookies = form.category === 'Netflix' && form.netflixType === 'cookies';

    if (!form.title) {
      setFormError('Title is required.');
      return;
    }
    if (!isNetflixCookies && (!form.email || !form.password)) {
      setFormError('Email and password are required for account drops.');
      return;
    }
    if (isNetflixCookies && !cookieFile) {
      setFormError('Please upload a cookie file (.rar).');
      return;
    }

    const newAccount = await addAccount({
      ...form,
      email: isNetflixCookies ? '' : form.email,
      password: isNetflixCookies ? '' : form.password,
      screenshot: screenshot || undefined,
      games: form.category === 'Steam' ? form.games || undefined : undefined,
      netflixType: form.category === 'Netflix' ? form.netflixType : undefined,
      cookieFile: isNetflixCookies && cookieFile ? cookieFile.data : undefined,
      cookieFileName: isNetflixCookies && cookieFile ? cookieFile.name : undefined,
      planDetails: form.category === 'Crunchyroll' ? form.planDetails || undefined : undefined,
    });

    if (!newAccount) {
      setFormError('Failed to drop account. Make sure you have admin permissions.');
      return;
    }

    // Refresh account list from DB
    fetchAccounts().then(setAccounts);

    try {
      const siteUrl = window.location.origin;
      const accountUrl = `${siteUrl}/account/${newAccount.id}`;
      const imageUrl = screenshot || undefined;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/functions/v1/discord-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            title: newAccount.title,
            category: newAccount.category,
            imageUrl,
            accountUrl,
          }),
        });
      }
    } catch (err) {
      console.error('Discord webhook failed:', err);
    }

    setForm({ title: '', category: 'Steam', email: '', password: '', notes: '', games: '', netflixType: 'account', planDetails: '' });
    setScreenshot(null);
    setCookieFile(null);
    setFormError('');
    setSuccess('Account dropped successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCookieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Cookie file must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCookieFile({ data: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkSuccess('');
    const lines = bulkPaste.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      setBulkError('Paste at least one email:password line.');
      return;
    }
    if (!bulkTitle.trim()) {
      setBulkError('Title prefix is required.');
      return;
    }
    const parsed = lines.map((line, i) => {
      const parts = line.split(':');
      if (parts.length < 2) return null;
      const email = parts[0].trim();
      const password = parts.slice(1).join(':').trim();
      if (!email || !password) return null;
      return { email, password, index: i + 1 };
    });
    const invalid = parsed.findIndex(p => p === null);
    if (invalid !== -1) {
      setBulkError(`Line ${invalid + 1} is invalid. Use email:password format.`);
      return;
    }
    setBulkAdding(true);
    let added = 0;
    for (const p of parsed) {
      if (!p) continue;
      const title = lines.length === 1 ? bulkTitle : `${bulkTitle} #${p.index}`;
      const result = await addAccount({
        title,
        category: bulkCategory,
        email: p.email,
        password: p.password,
      });
      if (result) added++;
    }
    setBulkAdding(false);
    setBulkPaste('');
    setBulkTitle('');
    fetchAccounts().then(setAccounts);
    setBulkSuccess(`Added ${added} of ${lines.length} accounts!`);
    setTimeout(() => setBulkSuccess(''), 4000);
  };

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
    fetchAccounts().then(setAccounts);
  };

  const handleReset = async (id: string) => {
    await resetClaim(id);
    fetchAccounts().then(setAccounts);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const available = accounts.filter(a => !a.isClaimed).length;
  const claimed = accounts.filter(a => a.isClaimed).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View Site →</a>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Drops" value={accounts.length} color="orange" />
          <StatCard label="Available" value={available} color="green" />
          <StatCard label="Claimed" value={claimed} color="red" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Site Announcements
          </h2>
          <form onSubmit={handleAddAnnouncement} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1.5">Message *</label>
              <input
                type="text"
                value={announcementMsg}
                onChange={e => setAnnouncementMsg(e.target.value)}
                placeholder="e.g. 🎉 New batch of accounts dropping tonight!"
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Link Text (optional)</label>
              <input
                type="text"
                value={announcementLinkText}
                onChange={e => setAnnouncementLinkText(e.target.value)}
                placeholder="e.g. Join Discord"
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Link URL (optional)</label>
              <input
                type="text"
                value={announcementLinkUrl}
                onChange={e => setAnnouncementLinkUrl(e.target.value)}
                placeholder="https://discord.gg/..."
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Announcement
              </button>
            </div>
          </form>
          {announcements.length > 0 && (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className={`flex-1 text-sm ${a.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {a.message}
                    {a.link_text && <span className="text-primary ml-2 text-xs">[{a.link_text}]</span>}
                  </span>
                  <button
                    onClick={() => handleToggleAnnouncement(a.id, !a.is_active)}
                    title={a.is_active ? 'Deactivate' : 'Activate'}
                    className={`p-1.5 rounded transition-all cursor-pointer ${a.is_active ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    title="Delete"
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-primary" />
            Ad Slots (Adsterra / Custom)
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Paste your Adsterra or any ad network HTML/JS code into each slot. Scripts will be executed automatically on the frontend.
          </p>
          {adSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading ad slots...</p>
          ) : (
            <div className="space-y-4">
              {adSlots.map(slot => (
                <AdSlotEditor
                  key={slot.id}
                  slot={slot}
                  saving={adSaving === slot.id}
                  saved={adSuccess === slot.id}
                  onSave={(code) => handleSaveAd(slot.id, code)}
                  onToggle={(active) => handleToggleAd(slot.id, active)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Discord Webhook
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Set the Discord webhook URL to receive notifications when new accounts are dropped.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
            />
            <button
              onClick={handleSaveWebhook}
              disabled={webhookSaving}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {webhookSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {webhookSuccess && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Webhook URL saved!
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Bulk Drop Accounts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Paste multiple accounts, one per line in <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">email:password</code> format.
          </p>
          <form onSubmit={handleBulkAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Title Prefix *</label>
              <input
                type="text"
                value={bulkTitle}
                onChange={e => setBulkTitle(e.target.value)}
                placeholder="e.g. Steam Account"
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Category</label>
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value as AccountCategory)}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border focus:border-primary outline-none transition-colors cursor-pointer"
              >
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1.5">Accounts (email:password per line) *</label>
              <textarea
                value={bulkPaste}
                onChange={e => setBulkPaste(e.target.value)}
                placeholder={"user1@email.com:pass123\nuser2@email.com:pass456\nuser3@email.com:pass789"}
                rows={6}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors resize-y"
              />
            </div>
            {bulkError && <p className="sm:col-span-2 text-destructive text-xs">{bulkError}</p>}
            {bulkSuccess && (
              <div className="sm:col-span-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {bulkSuccess}
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={bulkAdding}
                className="px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {bulkAdding ? 'Adding...' : 'Bulk Drop'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Drop New Account
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Steam Account with GTA V"
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as AccountCategory })}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border focus:border-primary outline-none transition-colors cursor-pointer"
              >
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {form.category === 'Netflix' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Netflix Type</label>
                <select
                  value={form.netflixType}
                  onChange={e => setForm({ ...form, netflixType: e.target.value as NetflixType })}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border border-border focus:border-primary outline-none transition-colors cursor-pointer"
                >
                  <option value="account">Account (Email/Pass)</option>
                  <option value="cookies">Cookies (.rar file)</option>
                </select>
              </div>
            )}
            {!(form.category === 'Netflix' && form.netflixType === 'cookies') && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Email *</label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="account@email.com"
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Password *</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="account password"
                    className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </>
            )}
            {form.category === 'Netflix' && form.netflixType === 'cookies' && (
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Cookie File (.rar) *</label>
                <input ref={cookieFileRef} type="file" accept=".rar,.zip,.7z" onChange={handleCookieFileChange} className="hidden" />
                {cookieFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                    <FileArchive className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground flex-1">{cookieFile.name}</span>
                    <button type="button" onClick={() => setCookieFile(null)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => cookieFileRef.current?.click()} className="w-full p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-2">
                    <FileArchive className="w-4 h-4" />
                    Upload cookie file
                  </button>
                )}
              </div>
            )}
            {form.category === 'Steam' && (
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Games (comma-separated)</label>
                <input
                  type="text"
                  value={form.games}
                  onChange={e => setForm({ ...form, games: e.target.value })}
                  placeholder="GTA V, CS2, Rust"
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
                />
              </div>
            )}
            {form.category === 'Crunchyroll' && (
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Plan Details</label>
                <input
                  type="text"
                  value={form.planDetails}
                  onChange={e => setForm({ ...form, planDetails: e.target.value })}
                  placeholder="e.g. Mega Fan, 6 months remaining"
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Extra info about the account..."
                rows={2}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1.5">Screenshot (optional)</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {screenshot ? (
                <div className="relative inline-block">
                  <img src={screenshot} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => setScreenshot(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  Upload screenshot
                </button>
              )}
            </div>
            {formError && <p className="sm:col-span-2 text-destructive text-xs">{formError}</p>}
            {success && (
              <div className="sm:col-span-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}
            <div className="sm:col-span-2">
              <button type="submit" className="px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Drop Account
              </button>
            </div>
          </form>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Manage Drops ({accounts.length})
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No drops yet. Add your first account above.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${a.isClaimed ? 'bg-muted/30 border-border' : 'bg-muted/50 border-border'}`}>
                  <span className="text-lg">{CATEGORY_COLORS[a.category]?.icon || '🎁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${a.isClaimed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.category} · {a.isClaimed ? 'Claimed' : 'Available'}</p>
                  </div>
                  {a.isClaimed && (
                    <button onClick={() => handleReset(a.id)} title="Reset claim" className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(a.id)} title="Delete" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'text-orange-500',
    green: 'text-green-500',
    red: 'text-red-500',
  };
  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className={`text-2xl font-bold ${colorMap[color] || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function AdSlotEditor({ slot, saving, saved, onSave, onToggle }: {
  slot: any;
  saving: boolean;
  saved: boolean;
  onSave: (code: string) => void;
  onToggle: (active: boolean) => void;
}) {
  const [code, setCode] = useState(slot.ad_code || '');
  const slotLabel = slot.slot_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className={`p-4 rounded-lg border ${slot.is_active ? 'border-border bg-muted/30' : 'border-border bg-muted/10 opacity-60'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-foreground">{slotLabel}</span>
          <span className="text-xs text-muted-foreground ml-2">({slot.slot_name})</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          <button
            onClick={() => onToggle(!slot.is_active)}
            title={slot.is_active ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded transition-all cursor-pointer ${slot.is_active ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Paste your Adsterra or ad network HTML/JS code here..."
        rows={4}
        className="w-full bg-background rounded-lg px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none transition-colors resize-y mb-3"
      />
      <button
        onClick={() => onSave(code)}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
      >
        <Save className="w-3 h-3" />
        {saving ? 'Saving...' : 'Save Ad Code'}
      </button>
    </div>
  );
}

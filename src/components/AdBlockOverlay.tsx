import { ShieldAlert, RefreshCw } from 'lucide-react';

interface AdBlockOverlayProps {
  onRecheck: () => void;
}

export function AdBlockOverlay({ onRecheck }: AdBlockOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            AdBlocker Detected
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We provide free premium accounts supported by ads. Please disable
            your ad blocker (including Brave Shields) to view account
            credentials.
          </p>
        </div>

        <div className="bg-muted rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-foreground">How to disable:</p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Click the <strong>ad blocker icon</strong> in your browser toolbar</li>
            <li>Select <strong>"Pause"</strong> or <strong>"Disable on this site"</strong></li>
            <li>For <strong>Brave</strong>: click the lion icon → toggle <strong>Shields OFF</strong></li>
            <li>Click the button below to refresh</li>
          </ol>
        </div>

        <button
          onClick={onRecheck}
          className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground rounded-xl px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          I've Disabled It — Refresh
        </button>

        <p className="text-xs text-muted-foreground/60">
          Your support keeps free accounts available for everyone ❤️
        </p>
      </div>
    </div>
  );
}

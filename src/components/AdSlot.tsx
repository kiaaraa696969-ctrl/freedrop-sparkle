import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdSlotProps {
  slotName: string;
  fallbackHeight?: string;
  className?: string;
}

let adCache: Record<string, string> | null = null;
let adCachePromise: Promise<void> | null = null;

const SLOT_DEFAULT_HEIGHTS: Record<string, number> = {
  hero_below: 90,
  feed_between: 90,
  footer_above: 90,
  detail_top: 90,
  detail_bottom: 250,
  sidebar_top: 250,
  sidebar_middle: 300,
  sidebar_bottom: 250,
  social_bar: 60,
};

async function loadAds() {
  if (adCache) return;
  if (adCachePromise) {
    await adCachePromise;
    return;
  }

  adCachePromise = (async () => {
    const { data, error } = await supabase
      .from('ad_slots')
      .select('slot_name, ad_code')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load ads:', error);
      adCache = {};
      return;
    }

    adCache = {};
    (data || []).forEach((row: any) => {
      adCache![row.slot_name] = row.ad_code;
    });
  })();

  await adCachePromise;
}

function getAdHeight(adCode: string, slotName: string): number {
  const explicitHeight = adCode.match(/['"]height['"]\s*:\s*(\d+)/i)?.[1]
    || adCode.match(/height\s*:\s*(\d+)/i)?.[1];

  if (explicitHeight) return Number(explicitHeight);
  return SLOT_DEFAULT_HEIGHTS[slotName] || 250;
}

function buildSrcDoc(adCode: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow: hidden;
        background: transparent;
      }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    ${adCode}
  </body>
</html>`;
}

export function invalidateAdCache() {
  adCache = null;
  adCachePromise = null;
}

export function AdSlot({ slotName, fallbackHeight = 'h-[250px]', className = '' }: AdSlotProps) {
  const [adCode, setAdCode] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadAds();
        if (!cancelled) {
          setAdCode(adCache?.[slotName] || '');
        }
      } catch (error) {
        console.error('Ad initialization failed:', error);
        if (!cancelled) setAdCode('');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [slotName]);

  if (loaded && (!adCode || adCode.trim() === '')) {
    return (
      <div className={`${fallbackHeight} bg-muted border border-border border-dashed rounded-2xl flex flex-col items-center justify-center ${className}`}>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Advertisement</span>
        <span className="text-[10px] text-muted-foreground/60 mt-1">Ad space</span>
      </div>
    );
  }

  if (!loaded) {
    return <div className={`${fallbackHeight} bg-muted/40 rounded-2xl ${className}`} />;
  }

  const adHeight = getAdHeight(adCode, slotName);
  const loadingMode: 'eager' | 'lazy' = ['hero_below', 'detail_top', 'social_bar'].includes(slotName) ? 'eager' : 'lazy';

  return (
    <div className={`ad-slot w-full overflow-hidden ${className}`} data-slot={slotName}>
      <iframe
        title={`ad-${slotName}`}
        srcDoc={buildSrcDoc(adCode)}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        loading={loadingMode}
        className="w-full border-0 block"
        style={{ height: `${adHeight}px` }}
      />
    </div>
  );
}


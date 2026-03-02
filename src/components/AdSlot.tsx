import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdSlotProps {
  slotName: string;
  fallbackHeight?: string;
  className?: string;
}

let adCache: Record<string, string> | null = null;
let adCachePromise: Promise<void> | null = null;

async function loadAds() {
  if (adCache) return;
  if (adCachePromise) {
    await adCachePromise;
    return;
  }
  adCachePromise = (async () => {
    const { data } = await supabase
      .from('ad_slots')
      .select('slot_name, ad_code')
      .eq('is_active', true);
    adCache = {};
    if (data) {
      data.forEach((row: any) => {
        adCache![row.slot_name] = row.ad_code;
      });
    }
  })();
  await adCachePromise;
}

export function invalidateAdCache() {
  adCache = null;
  adCachePromise = null;
}

export function AdSlot({ slotName, fallbackHeight = 'h-[250px]', className = '' }: AdSlotProps) {
  const [adCode, setAdCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAds().then(() => {
      const code = adCache?.[slotName] || '';
      setAdCode(code);
      setLoaded(true);
    });
  }, [slotName]);

  useEffect(() => {
    if (!loaded || !adCode || !containerRef.current) return;
    const container = containerRef.current;
    // Clear previous content
    container.innerHTML = '';

    // Parse the ad code HTML
    const temp = document.createElement('div');
    temp.innerHTML = adCode;

    // Separate scripts and non-script nodes
    const scripts: { src?: string; text?: string }[] = [];
    const nodes: Node[] = [];

    Array.from(temp.childNodes).forEach((node) => {
      if (node instanceof HTMLScriptElement) {
        scripts.push({
          src: node.src || undefined,
          text: node.textContent || undefined,
        });
      } else {
        nodes.push(node.cloneNode(true));
      }
    });

    // Append non-script nodes
    nodes.forEach((n) => container.appendChild(n));

    // Execute scripts sequentially to preserve order (atOptions must be set before invoke.js)
    let chain = Promise.resolve();
    scripts.forEach(({ src, text }) => {
      chain = chain.then(() => new Promise<void>((resolve) => {
        const s = document.createElement('script');
        if (src) {
          s.src = src;
          s.onload = () => resolve();
          s.onerror = () => resolve();
        } else {
          s.textContent = text || '';
        }
        container.appendChild(s);
        if (!src) resolve();
      }));
    });
  }, [adCode, loaded]);

  if (loaded && (!adCode || adCode.trim() === '')) {
    return (
      <div className={`${fallbackHeight} bg-muted border border-border border-dashed rounded-2xl flex flex-col items-center justify-center ${className}`}>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Advertisement</span>
        <span className="text-[10px] text-muted-foreground/60 mt-1">Ad space</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`ad-slot w-full overflow-hidden ${className}`}
      data-slot={slotName}
    />
  );
}

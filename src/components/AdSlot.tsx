import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdSlotProps {
  slotName: string;
  fallbackHeight?: string;
  className?: string;
}

/* ─── Global ad cache ─── */
let adCache: Record<string, string> | null = null;
let adCachePromise: Promise<void> | null = null;

/* Track which zone keys have been rendered on this page to prevent duplicates */
const renderedZones = new Set<string>();

/* Extract the Adsterra zone key from ad code */
function extractZoneKey(adCode: string): string | null {
  const keyMatch = adCode.match(/['"]?key['"]?\s*:\s*['"]([a-f0-9]{32})['"]/);
  if (keyMatch) return keyMatch[1];

  const srcMatch = adCode.match(/encyclopediainsoluble\.com\/([a-f0-9]{32})\/invoke\.js/);
  if (srcMatch) return srcMatch[1];

  const srcMatch2 = adCode.match(/encyclopediainsoluble\.com\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/([a-f0-9]{32})\.js/);
  if (srcMatch2) return srcMatch2[1];

  return null;
}

/* ─── Slot config ─── */
const SLOT_CONFIG: Record<string, { height: number; width: number; eager: boolean; responsive: boolean }> = {
  hero_below:     { height: 90,  width: 728, eager: true,  responsive: true },
  feed_between:   { height: 90,  width: 468, eager: false, responsive: true },
  footer_above:   { height: 90,  width: 728, eager: false, responsive: true },
  detail_top:     { height: 90,  width: 728, eager: true,  responsive: true },
  detail_bottom:  { height: 250, width: 300, eager: false, responsive: true },
  sidebar_top:    { height: 250, width: 300, eager: false, responsive: false },
};

async function loadAds() {
  if (adCache) return;
  if (adCachePromise) {
    await adCachePromise;
    return;
  }

  adCachePromise = (async () => {
    try {
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
    } catch (e) {
      console.error('Ad load error:', e);
      adCache = {};
    }
  })();

  await adCachePromise;
}

export function invalidateAdCache() {
  adCache = null;
  adCachePromise = null;
  renderedZones.clear();
}

/* Reset rendered zones on SPA navigation */
if (typeof window !== 'undefined') {
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      renderedZones.clear();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ─── Component ─── */
export function AdSlot({ slotName, fallbackHeight = 'h-[250px]', className = '' }: AdSlotProps) {
  const [adCode, setAdCode] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjected = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const config = SLOT_CONFIG[slotName] || { height: 250, width: 300, eager: false, responsive: true };

  // Load ad codes
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadAds();
        if (!cancelled) {
          const code = adCache?.[slotName] || '';
          setAdCode(code);

          if (code) {
            const zoneKey = extractZoneKey(code);
            if (zoneKey) {
              if (renderedZones.has(zoneKey)) {
                console.warn(`[AdSlot] Duplicate zone ${zoneKey} blocked for slot "${slotName}".`);
                setIsDuplicate(true);
              } else {
                renderedZones.add(zoneKey);
              }
            }
          }
        }
      } catch (error) {
        console.error('Ad init failed:', error);
        if (!cancelled) setAdCode('');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (adCode) {
        const zoneKey = extractZoneKey(adCode);
        if (zoneKey) renderedZones.delete(zoneKey);
      }
    };
  }, [slotName]);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    if (config.eager) {
      setIsVisible(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loaded, config.eager]);

  // Inject scripts when visible
  const injectAd = useCallback(() => {
    if (scriptInjected.current || !containerRef.current || !adCode || isDuplicate) return;
    scriptInjected.current = true;

    const container = containerRef.current;
    container.innerHTML = '';

    const temp = document.createElement('div');
    temp.innerHTML = adCode;

    const scripts: { src?: string; text?: string; async?: boolean }[] = [];
    const nodes: Node[] = [];

    Array.from(temp.childNodes).forEach((node) => {
      if (node instanceof HTMLScriptElement) {
        scripts.push({
          src: node.src || undefined,
          text: node.textContent || undefined,
          async: node.async,
        });
      } else {
        nodes.push(node.cloneNode(true));
      }
    });

    nodes.forEach((n) => container.appendChild(n));

    let chain = Promise.resolve();
    scripts.forEach(({ src, text, async: isAsync }) => {
      chain = chain.then(
        () =>
          new Promise<void>((resolve) => {
            try {
              const s = document.createElement('script');
              s.type = 'text/javascript';

              if (src) {
                s.src = src;
                if (isAsync) s.async = true;
                s.onload = () => resolve();
                s.onerror = () => {
                  console.warn(`[AdSlot] Script failed for "${slotName}": ${src}`);
                  resolve();
                };
                container.appendChild(s);
              } else if (text) {
                s.textContent = text;
                container.appendChild(s);
                resolve();
              } else {
                resolve();
              }
            } catch (e) {
              console.warn(`[AdSlot] Script error for "${slotName}":`, e);
              resolve();
            }
          })
      );
    });
  }, [adCode, slotName, isDuplicate]);

  useEffect(() => {
    if (isVisible && loaded && adCode && !isDuplicate) {
      injectAd();
    }
  }, [isVisible, loaded, adCode, isDuplicate, injectAd]);

  // ─── Empty / not loaded states ───
  if (loaded && (!adCode || adCode.trim() === '' || isDuplicate)) {
    return (
      <div
        className={`${fallbackHeight} bg-muted/50 border border-border border-dashed rounded-2xl flex flex-col items-center justify-center ${className}`}
      >
        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
          Ad
        </span>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div
        ref={containerRef}
        className={`rounded-2xl bg-muted/20 ${className}`}
        style={{ minHeight: `${config.height}px` }}
      />
    );
  }

  // ─── Render ───
  return (
    <div
      ref={containerRef}
      className={`ad-slot w-full overflow-hidden rounded-xl ${className}`}
      data-slot={slotName}
      style={{
        minHeight: `${config.height}px`,
        maxWidth: config.responsive && config.width > 0 ? '100%' : `${config.width}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto',
      }}
    />
  );
}

import { useState, useEffect } from 'react';

/**
 * Multi-layered adblock detection that catches:
 * - Extension-based blockers (uBlock Origin, AdBlock Plus, etc.)
 * - Brave browser's built-in shields
 * - DNS-level blockers (partial)
 *
 * Uses 3 independent detection methods for maximum coverage.
 */
export function useAdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null); // null = still checking

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      const results: boolean[] = [];

      // Method 1: Bait element — create a div that looks like an ad
      try {
        const bait = document.createElement('div');
        bait.className =
          'adsbox ad-banner ad-placement textads banner-ads ad_wrapper pub_300x250';
        bait.setAttribute(
          'style',
          'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;'
        );
        bait.innerHTML =
          '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0000000000000000"></ins>';
        document.body.appendChild(bait);

        await new Promise((r) => setTimeout(r, 150));

        const hidden =
          bait.offsetHeight === 0 ||
          bait.clientHeight === 0 ||
          getComputedStyle(bait).display === 'none' ||
          getComputedStyle(bait).visibility === 'hidden';

        results.push(hidden);
        bait.remove();
      } catch {
        results.push(false);
      }

      // Method 2: Probe ad script content (catches Brave/uBlock fake 200 responses)
      try {
        const response = await fetch(
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?probe=${Date.now()}`,
          {
            method: 'GET',
            cache: 'no-store',
            mode: 'cors',
          }
        );

        if (response.ok) {
          const text = (await response.text()).toLowerCase();
          const looksLikeBlockerStub =
            text.includes('ublock origin') ||
            text.includes('adsbygoogle-placeholder') ||
            text.includes('github.com/gorhill/ublock');
          results.push(looksLikeBlockerStub);
        } else {
          results.push(false);
        }
      } catch {
        // CORS/network can fail even without blockers, so keep inconclusive
        results.push(false);
      }

      // Method 3: Script load probe to known ad host (ERR_BLOCKED_BY_CLIENT => blocked)
      try {
        const blockedByScriptProbe = await new Promise<boolean>((resolve) => {
          const script = document.createElement('script');
          script.src = `https://securepubads.g.doubleclick.net/tag/js/gpt.js?probe=${Date.now()}`;
          script.async = true;

          const cleanup = () => {
            script.onload = null;
            script.onerror = null;
            script.remove();
          };

          const timeout = window.setTimeout(() => {
            cleanup();
            resolve(true);
          }, 2500);

          script.onload = () => {
            clearTimeout(timeout);
            cleanup();
            resolve(false);
          };

          script.onerror = () => {
            clearTimeout(timeout);
            cleanup();
            resolve(true);
          };

          document.head.appendChild(script);
        });

        results.push(blockedByScriptProbe);
      } catch {
        results.push(false);
      }

      // Method 4: Check if common ad-related elements are force-hidden
      try {
        const adDiv = document.createElement('div');
        adDiv.id = 'ad-container-test-' + Date.now();
        adDiv.className = 'ad ad-slot ad-zone adsbygoogle';
        adDiv.style.cssText =
          'position:fixed;top:-1px;left:-1px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(adDiv);

        await new Promise((r) => setTimeout(r, 200));

        const blocked =
          adDiv.offsetParent === null ||
          adDiv.offsetHeight === 0 ||
          getComputedStyle(adDiv).display === 'none' ||
          getComputedStyle(adDiv).visibility === 'hidden';

        results.push(blocked);
        adDiv.remove();
      } catch {
        results.push(false);
      }

      // Method 5: Brave-specific double-check
      try {
        // @ts-ignore - Brave exposes navigator.brave
        const isBrave = navigator.brave && (await navigator.brave.isBrave());
        if (isBrave) {
          const braveBlocked = results.some((r) => r === true);
          results.push(braveBlocked);
        }
      } catch {
        // Not Brave or detection failed
      }

      if (cancelled) return;

      // If ANY method detected blocking, flag it
      const detected = results.some((r) => r === true);
      setAdBlockDetected(detected);
    };

    // Small delay to let page settle
    const timer = setTimeout(detect, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  /** Re-run detection (e.g. after user claims they disabled it) */
  const recheck = () => {
    setAdBlockDetected(null); // show loading state
    // Force re-mount by toggling
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return { adBlockDetected, checking: adBlockDetected === null, recheck };
}

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

      // Method 2: Fetch a fake ad script URL (blocked by filter lists)
      try {
        const response = await fetch(
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
          }
        );
        // If we get here without error, ads might not be blocked
        // But no-cors returns opaque responses, so check type
        results.push(false);
      } catch {
        // Network error = blocked
        results.push(true);
      }

      // Method 3: Check if common ad-related global variables are nuked
      try {
        const testScript = document.createElement('script');
        testScript.src =
          'data:text/javascript,window.__adblockTest=true';
        testScript.async = true;

        // Also try creating a named ad element
        const adDiv = document.createElement('div');
        adDiv.id = 'ad-container-test-' + Date.now();
        adDiv.className = 'ad ad-slot ad-zone';
        adDiv.style.cssText =
          'position:fixed;top:-1px;left:-1px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(adDiv);

        await new Promise((r) => setTimeout(r, 200));

        const blocked =
          adDiv.offsetParent === null &&
          adDiv.offsetHeight === 0;

        results.push(blocked);
        adDiv.remove();
      } catch {
        results.push(false);
      }

      // Method 4: Brave-specific detection
      try {
        // @ts-ignore - Brave exposes navigator.brave
        const isBrave = navigator.brave && (await navigator.brave.isBrave());
        if (isBrave) {
          // Brave has shields on by default — double-check with a fetch
          try {
            await fetch('https://static.ads-twitter.com/uwt.js', {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-store',
            });
            results.push(false);
          } catch {
            results.push(true);
          }
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

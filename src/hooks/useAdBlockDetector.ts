import { useState, useEffect } from 'react';

export function useAdBlockDetector() {
  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      const results: boolean[] = [];

      // Method 1: Bait element
      try {
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner ad-placement textads banner-ads ad_wrapper pub_300x250';
        bait.setAttribute('style', 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;');
        bait.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0000000000000000"></ins>';
        document.body.appendChild(bait);
        await new Promise((r) => setTimeout(r, 150));
        const hidden = bait.offsetHeight === 0 || bait.clientHeight === 0 || getComputedStyle(bait).display === 'none' || getComputedStyle(bait).visibility === 'hidden';
        results.push(hidden);
        bait.remove();
      } catch { results.push(false); }

      // Method 2: Fetch fake ad script
      try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        results.push(false);
      } catch { results.push(true); }

      // Method 3: Ad-named element check
      try {
        const adDiv = document.createElement('div');
        adDiv.id = 'ad-container-test-' + Date.now();
        adDiv.className = 'ad ad-slot ad-zone';
        adDiv.style.cssText = 'position:fixed;top:-1px;left:-1px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(adDiv);
        await new Promise((r) => setTimeout(r, 200));
        const blocked = adDiv.offsetParent === null && adDiv.offsetHeight === 0;
        results.push(blocked);
        adDiv.remove();
      } catch { results.push(false); }

      // Method 4: Brave-specific
      try {
        // @ts-ignore
        const isBrave = navigator.brave && (await navigator.brave.isBrave());
        if (isBrave) {
          try {
            await fetch('https://static.ads-twitter.com/uwt.js', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
            results.push(false);
          } catch { results.push(true); }
        }
      } catch {}

      if (cancelled) return;
      setAdBlockDetected(results.some((r) => r === true));
    };

    const timer = setTimeout(detect, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const recheck = () => {
    setAdBlockDetected(null);
    setTimeout(() => window.location.reload(), 100);
  };

  return { adBlockDetected, checking: adBlockDetected === null, recheck };
}

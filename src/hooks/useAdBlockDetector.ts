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

      // Method 5: Multiple ad network probe (catches Coc Coc & other built-in blockers)
      const adUrls = [
        'https://www.googletagservices.com/tag/js/gpt.js',
        'https://cdn.carbonads.com/carbon.js',
        'https://m.servedby-buysellads.com/monetization.js',
        'https://cdn.fuseplatform.net/publift/tags/2/fuse.js',
        'https://a.pub.network/core/pubfig/cls.js',
      ];
      for (const url of adUrls) {
        try {
          const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
          // Some built-in blockers return opaque responses with status 0 but don't throw
          if (resp.status === 0 && resp.type === 'opaque') {
            // This is expected for no-cors, not blocked
          }
          results.push(false);
        } catch {
          results.push(true);
          break; // One blocked = detected
        }
      }

      // Method 6: Inline script bait (catches content-filtering blockers)
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = 'ad-script-test-' + Date.now();
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?probe=' + Date.now();
        let scriptBlocked = true;
        script.onload = () => { scriptBlocked = false; };
        script.onerror = () => { scriptBlocked = true; };
        document.head.appendChild(script);
        await new Promise((r) => setTimeout(r, 1500));
        results.push(scriptBlocked);
        script.remove();
      } catch { results.push(true); }

      // Method 7: Double-check with iframe bait
      try {
        const iframe = document.createElement('iframe');
        iframe.id = 'adbanner-iframe-' + Date.now();
        iframe.className = 'adsbox ad-banner';
        iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
        iframe.src = 'about:blank';
        document.body.appendChild(iframe);
        await new Promise((r) => setTimeout(r, 200));
        const iframeBlocked = iframe.offsetHeight === 0 || iframe.clientHeight === 0 || getComputedStyle(iframe).display === 'none';
        results.push(iframeBlocked);
        iframe.remove();
      } catch { results.push(false); }

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

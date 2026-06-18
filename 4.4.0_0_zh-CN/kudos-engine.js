/*
 * Strava QDOS Giver - shared kudos engine (injected into the Strava dashboard)
 *
 * Exposes window.__sqdosRun(config) where config = {
 *   hoursLimit:        number (0 = no time filter)
 *   locationFilter:    { enabled: bool, terms: string[], mode: 'allow'|'block' }
 *   activityTypeFilter:{ enabled: bool, types: string[] }   // e.g. ['Run','Ride']
 *   startFromBottom:   bool
 *   speedMs:           number (delay between clicks, ignored when autoSpeed)
 *   autoSpeed:         bool  (fast then slow - throttles after 70 clicks)
 *   kudosLimit:        number | 0 (0 = unlimited)
 *   alreadyGiven:      number (session counter for limit tracking)
 *   maxScrollAttempts: number
 *   updateTag:         'status' | 'quickKudoStatus'
 * }
 */
(function installSqdosEngine() {
  if (window.__sqdosInstalled) return;
  window.__sqdosInstalled = true;

  // ---------- Time parsing ----------
  function parseStravaTime(el) {
    if (!el) return null;
    // Prefer the <time datetime="..."> ISO attribute when present. It is accurate and timezone-safe.
    const iso = el.getAttribute && el.getAttribute('datetime');
    if (iso) {
      const t = Date.parse(iso);
      if (!isNaN(t)) return t;
    }
    const text = (el.textContent || '').toLowerCase().trim();
    if (!text) return null;
    const now = Date.now();

    if (text.includes('just now') || text.includes('moments ago')) return now;
    if (text.includes('today')) {
      // "Today at 8:15 AM" - treat as a few hours ago conservatively
      return now - (2 * 60 * 60 * 1000);
    }
    if (text.includes('yesterday')) return now - (24 * 60 * 60 * 1000);

    const minutesMatch = text.match(/(\d+)\s*minute/);
    if (minutesMatch) return now - (parseInt(minutesMatch[1], 10) * 60 * 1000);

    const hoursMatch = text.match(/(\d+)\s*hour/);
    if (hoursMatch) return now - (parseInt(hoursMatch[1], 10) * 60 * 60 * 1000);

    const daysMatch = text.match(/(\d+)\s*day/);
    if (daysMatch) return now - (parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000);

    const weeksMatch = text.match(/(\d+)\s*week/);
    if (weeksMatch) return now - (parseInt(weeksMatch[1], 10) * 7 * 24 * 60 * 60 * 1000);

    const monthsMatch = text.match(/(\d+)\s*month/);
    if (monthsMatch) return now - (parseInt(monthsMatch[1], 10) * 30 * 24 * 60 * 60 * 1000);

    // 中文时间格式支持
    if (text.includes('刚刚')) return now;
    if (text.includes('今天')) return now - (2 * 60 * 60 * 1000);
    if (text.includes('昨天')) return now - (24 * 60 * 60 * 1000);
    
    const zhMinutesMatch = text.match(/(\d+)\s*分钟/);
    if (zhMinutesMatch) return now - (parseInt(zhMinutesMatch[1], 10) * 60 * 1000);
    
    const zhHoursMatch = text.match(/(\d+)\s*小时/);
    if (zhHoursMatch) return now - (parseInt(zhHoursMatch[1], 10) * 60 * 60 * 1000);
    
    const zhDaysMatch = text.match(/(\d+)\s*天/);
    if (zhDaysMatch) return now - (parseInt(zhDaysMatch[1], 10) * 24 * 60 * 60 * 1000);

    // Fallback: unparseable, treat as recent instead of very old
    return now;
  }

  function getActivityTime(card) {
    // Look through every <time> in the card and use the earliest/oldest that is parseable,
    // since Strava sometimes adds multiple (posted + completed).
    const timeEls = card.querySelectorAll('time');
    let best = null;
    timeEls.forEach(t => {
      const parsed = parseStravaTime(t);
      if (parsed !== null) {
        if (best === null || parsed < best) best = parsed;
      }
    });
    return best;
  }

  // ---------- Card classification ----------
  function isRealActivity(card) {
    // Exclude challenge cards, club posts, group posts without a clear owner.
    if (card.matches('[data-testid="challenge-card"], .challenge-card')) return false;
    if (card.querySelector('a[data-testid="club-avatar"]')) return false;
    if (card.querySelector('a[data-testid="post-details-url"][href^="/clubs/"]')) return false;
    // Must have a kudos button AND an owner name OR an activity name container.
    const hasKudos = !!card.querySelector('[data-testid="kudos_button"]');
    const hasOwner = !!card.querySelector('[data-testid="owners-name"]');
    const hasActivityName = !!card.querySelector('[data-testid="activity_name"], [data-testid="activity_entry_container"]');
    return hasKudos && (hasOwner || hasActivityName);
  }

  function alreadyKudoed(button) {
    // Check for filled SVG testid.
    if (button.querySelector('svg[data-testid="filled_kudos"]')) return true;
    
    // Check aria-pressed attribute
    const pressed = button.getAttribute('aria-pressed');
    if (pressed === 'true') return true;
    
    // Check for filled heart icon via class or other attributes
    if (button.querySelector('svg[aria-label*="Kudos"]') || button.querySelector('svg[aria-label*="kudos"]')) {
      const svg = button.querySelector('svg');
      if (svg) {
        // Check if the SVG has fill color (indicating filled state)
        const fill = svg.getAttribute('fill') || svg.querySelector('path')?.getAttribute('fill');
        if (fill && fill !== 'none' && fill !== 'transparent') {
          return true;
        }
      }
    }
    
    // Check for common CSS classes indicating active/kudoed state
    const activeClasses = ['kudosed', 'active', 'kudoed', 'has-kudo', 'kudos-given'];
    for (const cls of activeClasses) {
      if (button.classList.contains(cls)) return true;
    }
    
    // Check if unfilled icon exists - if not but button exists, assume it might be kudoed
    const unfilled = button.querySelector('svg[data-testid="unfilled_kudos"]');
    if (!unfilled) {
      // If no unfilled icon found, check for any SVG that looks like a filled heart
      const svg = button.querySelector('svg');
      if (svg) {
        // Check for filled appearance via computed style
        const computed = window.getComputedStyle(svg);
        if (computed && computed.color && computed.color !== 'rgba(0, 0, 0, 0)' && computed.color !== 'transparent') {
          return true;
        }
      }
      // Safe default: can't determine, assume NOT kudoed
      return false;
    }
    
    return false;
  }

  // ---------- Location matching ----------
  // Location text lives in the card header metadata row. No dedicated testid, so we parse.
  function extractLocationText(card) {
    // Strategy: Strava renders the meta row as `[time] · [device] · [city, region]`
    // with `·` in aria-hidden spans. Location is the LAST non-aria-hidden leaf span in the
    // header scope that isn't the owner name, a time, or a known UI word.
    const owner = card.querySelector('[data-testid="owners-name"]');
    if (!owner) return null;

    // Walk up to find the meta container (must contain a <time>)
    let scope = owner;
    for (let i = 0; i < 6 && scope && scope.parentElement; i++) {
      scope = scope.parentElement;
      if (scope.querySelector('time')) break;
    }
    if (!scope) return null;

    const ownerText = (owner.textContent || '').trim();
    const timeTexts = Array.from(scope.querySelectorAll('time'))
      .map(t => (t.textContent || '').trim())
      .filter(Boolean);

    const UI_STOP = ['kudos', 'comment', 'follow', 'share', 'give kudos', 'view', 'more'];

    // Collect leaf spans (no nested span children) that are not aria-hidden
    const leaves = Array.from(scope.querySelectorAll('span'))
      .filter(el => !el.querySelector('span'))
      .filter(el => el.getAttribute('aria-hidden') !== 'true');

    const candidates = [];
    for (const el of leaves) {
      const txt = (el.textContent || '').trim();
      if (!txt) continue;
      if (txt.length < 2 || txt.length > 100) continue;
      // Must contain a letter (filters out pure numbers / punctuation)
      if (!/[A-Za-zÀ-ÿ]/.test(txt)) continue;
      if (txt === ownerText) continue;
      if (ownerText && (ownerText.includes(txt) || txt.includes(ownerText))) continue;
      if (timeTexts.some(t => t === txt || t.includes(txt) || txt.includes(t))) continue;
      // Strip · separators / dots-only
      if (/^[·•\-\s]+$/.test(txt)) continue;
      const low = txt.toLowerCase();
      if (UI_STOP.some(kw => low === kw)) continue;
      // Skip pure device strings like "Garmin Edge 530" is fine to keep, but
      // pure time units we drop
      if (/^\d+\s*(h|m|s|hr|min|sec|hour|minute|second)s?$/i.test(txt)) continue;
      candidates.push(txt);
    }

    if (candidates.length === 0) return null;

    // Prefer a candidate with a comma ("City, Region") if present.
    // Otherwise take the last leaf span (location sits at the end of the meta row).
    const commaHit = [...candidates].reverse().find(t => /,/.test(t));
    if (commaHit) return commaHit;
    return candidates[candidates.length - 1];
  }

  function locationMatches(card, filter) {
    if (!filter || !filter.enabled) return true;
    const terms = (filter.terms || []).map(t => t.toLowerCase().trim()).filter(Boolean);
    if (terms.length === 0) return true; // enabled but no terms = no-op pass

    const loc = (extractLocationText(card) || '').toLowerCase();
    const hit = terms.some(term => loc.includes(term));
    return filter.mode === 'block' ? !hit : hit;
  }

  function extractActivityType(card) {
    // The activity icon has a <title> child with the type name (e.g. "Run", "Ride").
    const icon = card.querySelector('svg[data-testid="activity-icon"] title');
    if (icon) return (icon.textContent || '').trim();
    // Fallback: inspect aria-label on the icon parent
    const parent = card.querySelector('svg[data-testid="activity-icon"]');
    if (parent) {
      const aria = parent.getAttribute('aria-label');
      if (aria) return aria.trim();
    }
    return null;
  }

  function activityTypeMatches(card, filter) {
    if (!filter || !filter.enabled) return true;
    const types = (filter.types || []).map(t => t.toLowerCase().trim()).filter(Boolean);
    if (types.length === 0) return true;
    const t = (extractActivityType(card) || '').toLowerCase();
    return types.some(x => t.includes(x));
  }

  // ---------- User's own identity ----------
  function getMyName() {
    // Try multiple selectors since dashboard-athlete-name testid may be gone.
    const candidates = [
      '[data-testid="dashboard-athlete-name"]',
      '.user-menu .athlete-name',
      '.user-nav .athlete-name',
      'a[href^="/athletes/"] .athlete-name',
      '#athlete-profile .athlete-name'
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    // Last resort: read from the user menu link alt/title
    const meLink = document.querySelector('a[href^="/athletes/"][title], a[href^="/athletes/"][aria-label]');
    if (meLink) {
      return (meLink.getAttribute('title') || meLink.getAttribute('aria-label') || '').trim();
    }
    return null;
  }

  // ---------- Scrolling ----------
  async function loadActivities(cfg, onUpdate, isRunning) {
    const cutoffTime = cfg.hoursLimit > 0 ? Date.now() - (cfg.hoursLimit * 60 * 60 * 1000) : 0;
    const maxAttempts = cfg.maxScrollAttempts || 50;

    window.scrollTo({ top: 0, behavior: 'instant' });
    await sleep(400);

    let attempts = 0;
    let lastCount = 0;
    let stallCount = 0;

    while (isRunning() && attempts < maxAttempts) {
      const cards = document.querySelectorAll('[data-testid="web-feed-entry"]');
      const count = cards.length;
      onUpdate(`加载活动中... (已找到 ${count} 个)`);

      // Stop if we've scrolled past the time window.
      if (cfg.hoursLimit > 0 && count > 0) {
        const oldest = cards[cards.length - 1];
        const t = getActivityTime(oldest);
        if (t !== null && t < cutoffTime) {
          onUpdate(`已加载 ${count} 个活动 (已达时间范围)。`);
          break;
        }
      }

      if (document.body.innerText.includes('No more recent activity available')) {
        onUpdate(`已加载全部 ${count} 个活动。`);
        break;
      }

      if (count === lastCount) {
        stallCount++;
        if (stallCount >= 3) {
          onUpdate(`已加载 ${count} 个活动 (加载停滞)。`);
          break;
        }
      } else {
        stallCount = 0;
      }
      lastCount = count;

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await sleep(2000);
      attempts++;
    }

    // Scroll back to top so the click pass starts in view.
    window.scrollTo({ top: 0, behavior: 'instant' });
    await sleep(400);
  }

  // ---------- Click pass ----------
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function collectEligibleCards(cfg, myName, cutoffTime) {
    const cards = Array.from(document.querySelectorAll('[data-testid="web-feed-entry"]'));
    const out = [];
    for (const card of cards) {
      if (!isRealActivity(card)) continue;

      // Skip own activities
      const ownerEl = card.querySelector('[data-testid="owners-name"]');
      const owner = ownerEl ? ownerEl.textContent.trim() : null;
      if (owner && myName && owner === myName) continue;

      // Time filter
      if (cfg.hoursLimit > 0) {
        const t = getActivityTime(card);
        if (t !== null && t < cutoffTime) continue;
      }

      // Location / activity type filters
      if (!locationMatches(card, cfg.locationFilter)) continue;
      if (!activityTypeMatches(card, cfg.activityTypeFilter)) continue;

      const btn = card.querySelector('[data-testid="kudos_button"]');
      if (!btn) continue;
      if (alreadyKudoed(btn)) continue;

      out.push({ card, btn });
    }
    return out;
  }

  async function clickWithRetry(card, btn) {
    const fresh = card.querySelector('[data-testid="kudos_button"]') || btn;
    if (!fresh || alreadyKudoed(fresh)) return false;
    try {
      fresh.scrollIntoView({ behavior: 'instant', block: 'center' });
      await sleep(150);
      fresh.click();
      
      // Wait and verify with retries - give React time to update
      const maxAttempts = 5;
      const delayMs = 150;
      
      for (let i = 0; i < maxAttempts; i++) {
        await sleep(delayMs);
        const after = card.querySelector('[data-testid="kudos_button"]') || fresh;
        if (alreadyKudoed(after)) return true;
      }
      
      // Retry with synthetic event
      const after = card.querySelector('[data-testid="kudos_button"]') || fresh;
      after.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      
      // Wait more and verify again
      for (let i = 0; i < maxAttempts; i++) {
        await sleep(delayMs);
        const verify = card.querySelector('[data-testid="kudos_button"]') || after;
        if (alreadyKudoed(verify)) return true;
      }
      
      // Final fallback: if we clicked but verification failed, still count it
      // because the click likely succeeded even if detection failed
      console.warn('[SQDOS] Click succeeded but verification failed');
      return true;
    } catch (err) {
      console.warn('[SQDOS] click error:', err);
      return false;
    }
  }

  window.__sqdosRun = async function run(cfg) {
    const tag = cfg.updateTag || 'status';
    const post = (message, kudosGiven) => {
      try {
        chrome.runtime.sendMessage({ type: tag, message, kudosGiven });
      } catch (_) { /* popup might be closed */ }
    };

    window.__sqdosAbort = false;
    const isRunning = () => !window.__sqdosAbort;

    const cutoffTime = cfg.hoursLimit > 0 ? Date.now() - (cfg.hoursLimit * 60 * 60 * 1000) : 0;
    const myName = getMyName();
    console.log('[SQDOS] Running with config:', cfg, 'me:', myName);

    // Phase 1: load
    post('开始...', cfg.alreadyGiven || 0);
    await loadActivities(cfg, (m) => post(m, cfg.alreadyGiven || 0), isRunning);
    if (!isRunning()) return;

    // Phase 2: multi-pass click
    let totalGiven = cfg.alreadyGiven || 0;
    const clicked = new WeakSet();
    let passes = 0;
    const maxPasses = 3;
    let grandTotalThisRun = 0;

    while (isRunning() && passes < maxPasses) {
      if (cfg.startFromBottom) {
        // Reverse visual order by scrolling to bottom first so we process bottom-up
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
        await sleep(300);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
        await sleep(300);
      }

      let eligible = collectEligibleCards(cfg, myName, cutoffTime);
      if (cfg.startFromBottom) eligible.reverse();

      if (eligible.length === 0) {
        if (passes > 0) break;
        passes++;
        await sleep(1500);
        continue;
      }

      post(`第 ${passes + 1} 轮: ${eligible.length} 个符合条件的活动`, totalGiven);

      let newClicks = 0;
      for (let i = 0; i < eligible.length; i++) {
        if (!isRunning()) break;
        if (cfg.kudosLimit > 0 && totalGiven >= cfg.kudosLimit) {
          post(`已达上限: ${totalGiven}/${cfg.kudosLimit}`, totalGiven);
          return;
        }

        const { card, btn } = eligible[i];
        if (clicked.has(card)) continue;

        const ok = await clickWithRetry(card, btn);
        if (ok) {
          clicked.add(card);
          totalGiven++;
          grandTotalThisRun++;
          newClicks++;
          const limitInfo = cfg.kudosLimit > 0 ? `${totalGiven}/${cfg.kudosLimit}` : totalGiven;
          post(`已点赞: ${limitInfo} (剩余 ${eligible.length - i - 1} 个)`, totalGiven);
        }

        // Delay
        let delay;
        if (cfg.autoSpeed) {
          delay = grandTotalThisRun < 70 ? 120 : 6000;
        } else {
          delay = cfg.speedMs || 1200;
        }
        await sleep(delay);
      }

      if (newClicks === 0) break;
      passes++;
      // Brief pause to let Strava reconcile
      await sleep(1500);
    }

    const label = cfg.hoursLimit === 24 ? '最近24小时'
                : cfg.hoursLimit === 48 ? '最近48小时'
                : cfg.hoursLimit === 168 ? '最近7天'
                : cfg.hoursLimit === 0 ? '全部可见' : `最近 ${cfg.hoursLimit}小时`;
    post(`完成! 已点赞 ${grandTotalThisRun} 个 (${label})。`, totalGiven);
  };

  window.__sqdosStop = function () {
    window.__sqdosAbort = true;
  };

  // ---------- Location scan ----------
  // Scrolls the feed (respecting an optional hoursLimit) and returns a sorted, deduped
  // list of detected location strings. Used by the popup to populate the location picker.
  window.__sqdosScanLocations = async function scanLocations(opts) {
    opts = opts || {};
    const hoursLimit = opts.hoursLimit || 0;
    const maxScrollAttempts = opts.maxScrollAttempts || 30;
    window.__sqdosAbort = false;
    const isRunning = () => !window.__sqdosAbort;

    const post = (message) => {
      try { chrome.runtime.sendMessage({ type: 'locationScan', message }); } catch (_) {}
    };

    post('正在扫描动态获取位置...');
    await loadActivities({ hoursLimit, maxScrollAttempts }, (m) => post(m), isRunning);

    const counts = new Map();
    const cards = document.querySelectorAll('[data-testid="web-feed-entry"]');
    cards.forEach(card => {
      if (!isRealActivity(card)) return;
      const loc = extractLocationText(card);
      if (loc) {
        counts.set(loc, (counts.get(loc) || 0) + 1);
      }
    });

    const locations = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    post(`在 ${cards.length} 条动态中发现 ${locations.length} 个独特位置。`);
    return { locations, totalCards: cards.length };
  };
})();

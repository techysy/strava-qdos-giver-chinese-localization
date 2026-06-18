document.addEventListener('DOMContentLoaded', async function () {
  const $ = (id) => document.getElementById(id);
  const startButton = $('startKudos');
  const stopButton = $('stopKudos');
  const speedSlider = $('speedSlider');
  const speedValue = $('speedValue');
  const statusDiv = $('status');
  const directionToggle = $('directionToggle');
  const errorDiv = $('error');
  const autoSpeedToggle = $('autoSpeedToggle');
  const enableLocationFilter = $('enableLocationFilter');
  const locationTerms = $('locationTerms');
  const locationMode = $('locationMode');
  const scanLocationsButton = $('scanLocationsButton');
  const locationSearch = $('locationSearch');
  const locationList = $('locationList');
  const locationCount = $('locationCount');
  const locationSelectAll = $('locationSelectAll');
  const locationSelectNone = $('locationSelectNone');
  const enableTypeFilter = $('enableTypeFilter');
  const typeTerms = $('typeTerms');
  const enableKudosLimit = $('enableKudosLimit');
  const kudosLimitValue = $('kudosLimitValue');
  const resetCounterButton = $('resetCounter');
  const diagnoseButton = $('diagnoseButton');
  const wrongPageBanner = $('wrongPageBanner');
  const mainContent = $('mainContent');
  const goToStravaLink = $('goToStrava');
  const quickKudoButton = $('quickKudoButton');
  const timeFilter = $('timeFilter');
  const advancedToggle = $('advancedToggle');
  const advancedContent = $('advancedContent');

  let isLoadingPreferences = true;
  let isRunning = false;

  const storage = {
    available: () => typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync,
    async get(defaults) {
      try {
        if (this.available()) return await chrome.storage.sync.get(defaults);
        const out = { ...defaults };
        for (const k in defaults) {
          const v = localStorage.getItem('sqdos_' + k);
          if (v !== null) { try { out[k] = JSON.parse(v); } catch { } }
        }
        return out;
      } catch (e) { console.error('storage.get', e); return defaults; }
    },
    async set(data) {
      try {
        if (this.available()) { await chrome.storage.sync.set(data); return; }
        for (const k in data) localStorage.setItem('sqdos_' + k, JSON.stringify(data[k]));
      } catch (e) { console.error('storage.set', e); }
    }
  };

  const DEFAULTS = {
    autoSpeed: true,
    sliderValue: 1200,
    startFromBottom: false,
    enableLocationFilter: false,
    locationTerms: '',
    locationMode: 'allow',
    knownLocations: [],
    selectedLocations: [],
    enableTypeFilter: false,
    typeTerms: '',
    enableKudosLimit: false,
    kudosLimit: 75,
    kudosGiven: 0,
    timeFilter: '24'
  };

  let knownLocations = [];
  let selectedLocations = new Set();

  async function loadPrefs() {
    const p = await storage.get(DEFAULTS);
    autoSpeedToggle.checked = p.autoSpeed;
    speedSlider.value = p.sliderValue;
    speedSlider.disabled = p.autoSpeed;
    directionToggle.checked = p.startFromBottom;
    enableLocationFilter.checked = p.enableLocationFilter;
    locationTerms.value = p.locationTerms;
    locationTerms.disabled = !p.enableLocationFilter;
    locationMode.value = p.locationMode;
    locationMode.disabled = !p.enableLocationFilter;
    knownLocations = Array.isArray(p.knownLocations) ? p.knownLocations : [];
    selectedLocations = new Set(Array.isArray(p.selectedLocations) ? p.selectedLocations : []);
    renderLocationPicker();
    setLocationPickerEnabled(p.enableLocationFilter);
    enableTypeFilter.checked = p.enableTypeFilter;
    typeTerms.value = p.typeTerms;
    typeTerms.disabled = !p.enableTypeFilter;
    enableKudosLimit.checked = p.enableKudosLimit;
    kudosLimitValue.value = p.kudosLimit;
    kudosLimitValue.disabled = !p.enableKudosLimit;
    timeFilter.value = p.timeFilter || '24';

    if (p.autoSpeed) {
      speedValue.textContent = '速度: 自动';
    } else {
      speedValue.textContent = `速度: ${(p.sliderValue / 1000).toFixed(1)}秒`;
    }
    if (p.enableKudosLimit && p.kudosGiven > 0) {
      setStatus(`已点赞: ${p.kudosGiven}/${p.kudosLimit}`);
    }
  }

  async function savePrefs() {
    if (isLoadingPreferences) return;
    const current = await storage.get({ kudosGiven: 0 });
    await storage.set({
      autoSpeed: autoSpeedToggle.checked,
      sliderValue: parseInt(speedSlider.value, 10),
      startFromBottom: directionToggle.checked,
      enableLocationFilter: enableLocationFilter.checked,
      locationTerms: locationTerms.value,
      locationMode: locationMode.value,
      knownLocations,
      selectedLocations: Array.from(selectedLocations),
      enableTypeFilter: enableTypeFilter.checked,
      typeTerms: typeTerms.value,
      enableKudosLimit: enableKudosLimit.checked,
      kudosLimit: parseInt(kudosLimitValue.value, 10) || 75,
      kudosGiven: current.kudosGiven,
      timeFilter: timeFilter.value
    });
    flashStatus('设置已保存');
  }

  function setLocationPickerEnabled(enabled) {
    scanLocationsButton.disabled = !enabled;
    locationList.classList.toggle('disabled', !enabled);
  }

  function renderLocationPicker() {
    if (!knownLocations.length) {
      locationList.innerHTML = '<div class="location-empty">点击"扫描动态"从当前动态列表获取位置。</div>';
      locationCount.textContent = '';
      return;
    }
    const frag = document.createDocumentFragment();
    knownLocations.forEach(({ name, count }) => {
      const row = document.createElement('label');
      row.className = 'location-item';
      row.dataset.name = name.toLowerCase();
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedLocations.has(name);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedLocations.add(name);
        else selectedLocations.delete(name);
        updateLocationCountLabel();
        savePrefs();
      });
      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = name;
      const countSpan = document.createElement('span');
      countSpan.className = 'count';
      countSpan.textContent = String(count);
      row.appendChild(cb);
      row.appendChild(nameSpan);
      row.appendChild(countSpan);
      frag.appendChild(row);
    });
    locationList.innerHTML = '';
    locationList.appendChild(frag);
    applyLocationSearch();
    updateLocationCountLabel();
  }

  function applyLocationSearch() {
    const q = (locationSearch && locationSearch.value || '').trim().toLowerCase();
    const rows = locationList.querySelectorAll('.location-item');
    if (!q) {
      rows.forEach(r => { r.style.display = ''; });
      return;
    }
    rows.forEach(r => {
      r.style.display = (r.dataset.name || '').includes(q) ? '' : 'none';
    });
  }

  function updateLocationCountLabel() {
    const n = selectedLocations.size;
    locationCount.textContent = n ? `已选择 ${n} 个` : '';
  }

  async function scanLocations() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isStravaDashboard(tab.url)) { showError(true); return; }
    showError(false);
    scanLocationsButton.disabled = true;
    scanLocationsButton.textContent = '扫描中...';
    setStatus('正在扫描动态获取位置...');
    try {
      await injectEngine(tab.id);
      const hoursLimit = parseInt(timeFilter.value, 10) || 0;
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (opts) => window.__sqdosScanLocations(opts),
        args: [{ hoursLimit, maxScrollAttempts: 30 }]
      });
      if (result && Array.isArray(result.locations)) {
        knownLocations = result.locations;
        renderLocationPicker();
        await savePrefs();
        setStatus(`在 ${result.totalCards} 条动态中发现 ${result.locations.length} 个位置。`);
      } else {
        setStatus('扫描完成但未返回数据。');
      }
    } catch (e) {
      console.error('scanLocations', e);
      setStatus('扫描错误: ' + (e.message || '未知错误'));
    } finally {
      scanLocationsButton.disabled = !enableLocationFilter.checked;
      scanLocationsButton.textContent = '扫描动态';
    }
  }

  function setStatus(msg) { statusDiv.textContent = msg; }
  function flashStatus(msg) {
    const prev = statusDiv.textContent;
    setStatus(msg);
    setTimeout(() => { if (statusDiv.textContent === msg) setStatus(prev); }, 1400);
  }
  function showError(show) { errorDiv.classList.toggle('show', !!show); }

  function isStravaDashboard(url) {
    return typeof url === 'string' && url.startsWith('https://www.strava.com/dashboard');
  }

  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !isStravaDashboard(tab.url)) {
        wrongPageBanner.style.display = 'block';
        mainContent.classList.add('hidden');
        setStatus('请前往 Strava 仪表盘使用此扩展');
      } else {
        wrongPageBanner.style.display = 'none';
        mainContent.classList.remove('hidden');
      }
    } catch (e) {
      wrongPageBanner.style.display = 'block';
      mainContent.classList.add('hidden');
    }
  }

  async function injectEngine(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['kudos-engine.js']
    });
  }

  function parseTerms(raw) {
    return (raw || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function buildConfig({ updateTag }) {
    const merged = Array.from(new Set([
      ...Array.from(selectedLocations),
      ...parseTerms(locationTerms.value)
    ]));
    return {
      hoursLimit: parseInt(timeFilter.value, 10) || 0,
      locationFilter: {
        enabled: enableLocationFilter.checked,
        terms: merged,
        mode: locationMode.value === 'block' ? 'block' : 'allow'
      },
      activityTypeFilter: {
        enabled: enableTypeFilter.checked,
        types: parseTerms(typeTerms.value)
      },
      startFromBottom: directionToggle.checked,
      speedMs: parseInt(speedSlider.value, 10) || 1200,
      autoSpeed: autoSpeedToggle.checked,
      kudosLimit: enableKudosLimit.checked ? (parseInt(kudosLimitValue.value, 10) || 0) : 0,
      alreadyGiven: 0,
      maxScrollAttempts: 60,
      updateTag
    };
  }

  async function runEngine({ updateTag, overrides }) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isStravaDashboard(tab.url)) { showError(true); return false; }
    showError(false);

    isRunning = true;
    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    quickKudoButton.disabled = true;

    try {
      await injectEngine(tab.id);
      const cfg = Object.assign(buildConfig({ updateTag }), overrides || {});
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (config) => { window.__sqdosRun(config); },
        args: [cfg]
      });
      return true;
    } catch (e) {
      console.error('runEngine error', e);
      setStatus('错误: ' + (e.message || '未知错误'));
      finishUI();
      return false;
    }
  }

  async function stopEngine() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => { if (window.__sqdosStop) window.__sqdosStop(); }
        });
      }
    } catch (e) { console.error('stopEngine', e); }
    finishUI();
    setStatus('点赞已停止');
  }

  function finishUI() {
    isRunning = false;
    startButton.style.display = 'block';
    stopButton.style.display = 'none';
    quickKudoButton.disabled = false;
    quickKudoButton.textContent = '点赞所有活动';
  }

  chrome.runtime.onMessage.addListener(async (message) => {
    if (!message || !message.type) return;
    if (message.type === 'locationScan') {
      setStatus(message.message);
      return;
    }
    if (message.type === 'status' || message.type === 'quickKudoStatus') {
      setStatus(message.message);
      if (typeof message.kudosGiven === 'number') {
        await storage.set({ kudosGiven: message.kudosGiven });
      }
      const done = /完成!|已达上限/.test(message.message);
      if (done) {
        try {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: 'Strava 一键点赞',
            message: message.message
          });
        } catch (_) { }
        finishUI();
      }
    }
  });

  async function runDiagnostics() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isStravaDashboard(tab.url)) { showError(true); return; }
    showError(false);
    setStatus('正在运行诊断...');
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const cards = document.querySelectorAll('[data-testid="web-feed-entry"]');
        let withKudos = 0, withOwner = 0, withTime = 0, alreadyGiven = 0, nonActivity = 0;
        const locations = [];
        cards.forEach(c => {
          const k = c.querySelector('[data-testid="kudos_button"]');
          if (k) {
            withKudos++;
            if (k.querySelector('svg[data-testid="filled_kudos"]')) alreadyGiven++;
            else if (!k.querySelector('svg[data-testid="unfilled_kudos"]')) alreadyGiven++;
          } else {
            nonActivity++;
          }
          if (c.querySelector('[data-testid="owners-name"]')) withOwner++;
          if (c.querySelector('time')) withTime++;
          const owner = c.querySelector('[data-testid="owners-name"]');
          if (owner) {
            const parent = owner.closest('header, div');
            const spans = parent ? parent.querySelectorAll('span, a') : [];
            spans.forEach(s => {
              const t = (s.textContent || '').trim();
              if (/^[A-Za-zÀ-ÿ0-9'.\- ]+,\s*[A-Za-zÀ-ÿ0-9'.\- ]+$/.test(t) && t.length < 80) {
                locations.push(t);
              }
            });
          }
        });
        return {
          totalCards: cards.length,
          withKudos, withOwner, withTime, alreadyGiven, nonActivity,
          sampleLocations: [...new Set(locations)].slice(0, 5)
        };
      }
    });
    setStatus(`卡片 ${result.totalCards} - 点赞按钮 ${result.withKudos} - 作者 ${result.withOwner} - 时间 ${result.withTime} - 已点赞 ${result.alreadyGiven}`);
    console.log('[SQDOS DIAG]', result);
  }

  advancedToggle.addEventListener('click', function () {
    this.classList.toggle('open');
    advancedContent.classList.toggle('open');
  });

  goToStravaLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.update(tab.id, { url: 'https://www.strava.com/dashboard' });
      window.close();
    }
  });

  speedSlider.addEventListener('input', () => {
    speedValue.textContent = `速度: ${(speedSlider.value / 1000).toFixed(1)}秒`;
    savePrefs();
  });

  autoSpeedToggle.addEventListener('change', () => {
    speedSlider.disabled = autoSpeedToggle.checked;
    speedValue.textContent = autoSpeedToggle.checked
      ? '速度: 自动'
      : `速度: ${(speedSlider.value / 1000).toFixed(1)}秒`;
    savePrefs();
  });

  directionToggle.addEventListener('change', savePrefs);

  enableLocationFilter.addEventListener('change', () => {
    const on = enableLocationFilter.checked;
    locationTerms.disabled = !on;
    locationMode.disabled = !on;
    setLocationPickerEnabled(on);
    savePrefs();
  });

  scanLocationsButton.addEventListener('click', scanLocations);
  if (locationSearch) {
    locationSearch.addEventListener('input', applyLocationSearch);
  }
  locationSelectAll.addEventListener('click', () => {
    knownLocations.forEach(({ name }) => selectedLocations.add(name));
    renderLocationPicker();
    savePrefs();
  });
  locationSelectNone.addEventListener('click', () => {
    selectedLocations.clear();
    renderLocationPicker();
    savePrefs();
  });
  locationTerms.addEventListener('input', savePrefs);
  locationMode.addEventListener('change', savePrefs);

  enableTypeFilter.addEventListener('change', () => {
    typeTerms.disabled = !enableTypeFilter.checked;
    savePrefs();
  });
  typeTerms.addEventListener('input', savePrefs);

  enableKudosLimit.addEventListener('change', () => {
    kudosLimitValue.disabled = !enableKudosLimit.checked;
    savePrefs();
  });
  kudosLimitValue.addEventListener('change', savePrefs);
  timeFilter.addEventListener('change', savePrefs);

  resetCounterButton.addEventListener('click', async () => {
    await storage.set({ kudosGiven: 0 });
    flashStatus('计数器已重置为 0');
  });

  quickKudoButton.addEventListener('click', async () => {
    quickKudoButton.disabled = true;
    quickKudoButton.textContent = '运行中...';
    await runEngine({ updateTag: 'quickKudoStatus' });
  });

  startButton.addEventListener('click', async () => {
    await runEngine({ updateTag: 'status' });
  });

  stopButton.addEventListener('click', stopEngine);

  diagnoseButton.addEventListener('click', runDiagnostics);

  document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') stopEngine();
  });

  await checkCurrentPage();
  await loadPrefs();
  isLoadingPreferences = false;
});
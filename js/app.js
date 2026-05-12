// ─── 状态 ───────────────────────────────────────────────
const state = {
  playlist: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0, // 0=不循环 1=列表循环 2=单曲循环
  isDragging: false,
};

// ─── DOM 引用 ────────────────────────────────────────────
const audio        = document.getElementById('audioPlayer');
const vinylDisc    = document.getElementById('vinylDisc');
const tonearm      = document.getElementById('tonearm');
const labelTitle   = document.getElementById('labelTitle');
const labelArtist  = document.getElementById('labelArtist');
const songTitle    = document.getElementById('songTitle');
const songArtist   = document.getElementById('songArtist');
const sourceBadge  = document.getElementById('sourceBadge');
const btnPlay      = document.getElementById('btnPlay');
const btnPrev      = document.getElementById('btnPrev');
const btnNext      = document.getElementById('btnNext');
const btnShuffle   = document.getElementById('btnShuffle');
const btnRepeat    = document.getElementById('btnRepeat');
const progressFill = document.getElementById('progressFill');
const progressThumb= document.getElementById('progressThumb');
const progressWrap = document.getElementById('progressWrap');
const currentTimeEl= document.getElementById('currentTime');
const totalTimeEl  = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const searchInput  = document.getElementById('searchInput');
const searchBtn    = document.getElementById('searchBtn');
const playlistEl   = document.getElementById('playlist');
const loadingEl    = document.getElementById('loadingIndicator');
const resultCountEl= document.getElementById('resultCount');
const playlistTitle= document.getElementById('playlistTitle');

// ─── API 搜索函数 ────────────────────────────────────────

/**
 * 小明API - 返回网易云/QQ等多平台结果，含播放链接
 */
async function searchApiOpen(keyword) {
  try {
    const url = `https://api.apiopen.top/searchMusic?name=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 200 || !data.result) return [];
    return data.result.map(item => ({
      id: `apiopen_${item.id || Math.random()}`,
      title: item.songName || item.name || '未知歌曲',
      artist: item.singerName || item.singer || '未知歌手',
      cover: item.coverImgUrl || item.picUrl || '',
      url: item.songUrl || item.url || '',
      source: 'apiopen',
      sourceLabel: '小明API',
      duration: item.duration || 0,
    })).filter(s => s.url);
  } catch (e) {
    console.warn('小明API 搜索失败:', e);
    return [];
  }
}

/**
 * iTunes Search API - 免费，有30秒预览
 */
async function searchItunes(keyword) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&media=music&limit=20&country=CN`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results) return [];
    return data.results
      .filter(item => item.previewUrl)
      .map(item => ({
        id: `itunes_${item.trackId}`,
        title: item.trackName || '未知歌曲',
        artist: item.artistName || '未知歌手',
        cover: (item.artworkUrl100 || '').replace('100x100', '300x300'),
        url: item.previewUrl,
        source: 'itunes',
        sourceLabel: 'iTunes',
        duration: Math.floor((item.trackTimeMillis || 30000) / 1000),
        isPreview: true,
      }));
  } catch (e) {
    console.warn('iTunes 搜索失败:', e);
    return [];
  }
}

/**
 * Jamendo API - 免费创作共用音乐，完整曲目
 */
async function searchJamendo(keyword) {
  try {
    // Jamendo 公开 client_id（演示用）
    const clientId = '3d9b9a8a';
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=15&search=${encodeURIComponent(keyword)}&audioformat=mp32&include=musicinfo`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results) return [];
    return data.results
      .filter(item => item.audio)
      .map(item => ({
        id: `jamendo_${item.id}`,
        title: item.name || '未知歌曲',
        artist: item.artist_name || '未知歌手',
        cover: item.album_image || item.image || '',
        url: item.audio,
        source: 'jamendo',
        sourceLabel: 'Jamendo',
        duration: item.duration || 0,
      }));
  } catch (e) {
    console.warn('Jamendo 搜索失败:', e);
    return [];
  }
}

// ─── 并发搜索 ────────────────────────────────────────────
async function searchAll(keyword) {
  const checkboxes = document.querySelectorAll('.api-toggle input:checked');
  const sources = Array.from(checkboxes).map(cb => cb.value);

  const searchMap = {
    apiopen: searchApiOpen,
    itunes: searchItunes,
    jamendo: searchJamendo,
  };

  // 并发请求所有选中的源
  const promises = sources.map(src => searchMap[src]?.(keyword) ?? Promise.resolve([]));
  const results = await Promise.allSettled(promises);

  // 合并结果，去重（按 title+artist）
  const seen = new Set();
  const merged = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      r.value.forEach(song => {
        const key = `${song.title.toLowerCase()}_${song.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(song);
        }
      });
    }
  });

  return merged;
}

// ─── 搜索触发 ────────────────────────────────────────────
async function handleSearch() {
  const keyword = searchInput.value.trim();
  if (!keyword) return;

  loadingEl.style.display = 'flex';
  playlistEl.innerHTML = '';
  resultCountEl.textContent = '';
  playlistTitle.textContent = `"${keyword}" 的搜索结果`;

  const results = await searchAll(keyword);

  loadingEl.style.display = 'none';

  if (results.length === 0) {
    playlistEl.innerHTML = '<div class="empty-state">未找到相关歌曲，换个关键词试试</div>';
    return;
  }

  state.playlist = results;
  resultCountEl.textContent = `${results.length} 首`;
  renderPlaylist();
}

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

// ─── 渲染播放列表 ────────────────────────────────────────
function renderPlaylist() {
  playlistEl.innerHTML = '';
  state.playlist.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'playlist-item' + (index === state.currentIndex ? ' active' : '');
    item.dataset.index = index;

    const sourceColors = {
      apiopen: '#c9a84c',
      itunes:  '#fc3c44',
      jamendo: '#4ecb8d',
    };
    const badgeColor = sourceColors[song.source] || '#888';

    item.innerHTML = `
      <div class="item-index">${index + 1}</div>
      <div class="item-cover">
        ${song.cover
          ? `<img src="${song.cover}" alt="${song.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
          : ''}
        <div class="item-cover-placeholder" style="${song.cover ? 'display:none' : ''}">♪</div>
      </div>
      <div class="item-info">
        <div class="item-title">${escapeHtml(song.title)}</div>
        <div class="item-artist">${escapeHtml(song.artist)}</div>
      </div>
      <div class="item-meta">
        <span class="source-tag" style="color:${badgeColor};border-color:${badgeColor}">${song.sourceLabel}</span>
        ${song.isPreview ? '<span class="preview-tag">预览</span>' : ''}
        <span class="item-duration">${formatTime(song.duration)}</span>
      </div>
      <button class="item-play-btn" aria-label="播放 ${escapeHtml(song.title)}">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    `;

    item.addEventListener('click', () => playSong(index));
    playlistEl.appendChild(item);
  });
}

// ─── 播放逻辑 ────────────────────────────────────────────
function playSong(index) {
  if (index < 0 || index >= state.playlist.length) return;
  const song = state.playlist[index];
  state.currentIndex = index;

  audio.src = song.url;
  audio.volume = volumeSlider.value / 100;
  audio.play().catch(err => {
    console.warn('播放失败:', err);
    showError('该歌曲无法播放，尝试下一首');
  });

  updateNowPlaying(song);
  updatePlaylistActive(index);
}

function updateNowPlaying(song) {
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  labelTitle.textContent = song.title.length > 12 ? song.title.slice(0, 12) + '…' : song.title;
  labelArtist.textContent = song.artist.length > 10 ? song.artist.slice(0, 10) + '…' : song.artist;

  const sourceColors = { apiopen: '#c9a84c', itunes: '#fc3c44', jamendo: '#4ecb8d' };
  sourceBadge.textContent = song.sourceLabel + (song.isPreview ? ' · 预览版' : '');
  sourceBadge.style.color = sourceColors[song.source] || '#888';

  // 更新黑胶标签颜色（跟随主题 accent）
  if (song.cover) {
    document.getElementById('vinylLabel').style.backgroundImage = `url(${song.cover})`;
    document.getElementById('vinylLabel').style.backgroundSize = 'cover';
  } else {
    document.getElementById('vinylLabel').style.backgroundImage = '';
  }
}

function updatePlaylistActive(index) {
  document.querySelectorAll('.playlist-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}

// ─── 播放/暂停 ───────────────────────────────────────────
function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

audio.addEventListener('play', () => {
  state.isPlaying = true;
  vinylDisc.classList.add('spinning');
  tonearm.classList.add('playing');
  btnPlay.querySelector('.icon-play').style.display = 'none';
  btnPlay.querySelector('.icon-pause').style.display = 'block';
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  vinylDisc.classList.remove('spinning');
  tonearm.classList.remove('playing');
  btnPlay.querySelector('.icon-play').style.display = 'block';
  btnPlay.querySelector('.icon-pause').style.display = 'none';
});

audio.addEventListener('ended', () => {
  if (state.repeatMode === 2) {
    audio.play();
  } else if (state.repeatMode === 1 || state.isShuffle) {
    playNext();
  } else if (state.currentIndex < state.playlist.length - 1) {
    playNext();
  } else {
    // 播放结束
    vinylDisc.classList.remove('spinning');
    tonearm.classList.remove('playing');
  }
});

function playNext() {
  if (state.playlist.length === 0) return;
  let next;
  if (state.isShuffle) {
    next = Math.floor(Math.random() * state.playlist.length);
  } else {
    next = (state.currentIndex + 1) % state.playlist.length;
  }
  playSong(next);
}

function playPrev() {
  if (state.playlist.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prev;
  if (state.isShuffle) {
    prev = Math.floor(Math.random() * state.playlist.length);
  } else {
    prev = (state.currentIndex - 1 + state.playlist.length) % state.playlist.length;
  }
  playSong(prev);
}

btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', playNext);
btnPrev.addEventListener('click', playPrev);

// ─── 随机/循环 ───────────────────────────────────────────
btnShuffle.addEventListener('click', () => {
  state.isShuffle = !state.isShuffle;
  btnShuffle.classList.toggle('active', state.isShuffle);
});

btnRepeat.addEventListener('click', () => {
    state.repeatMode = (state.repeatMode + 1) % 3;
  btnRepeat.classList.toggle('active', state.repeatMode > 0);
  const repeatIcons = ['', '🔁', '🔂'];
  btnRepeat.title = ['不循环', '列表循环', '单曲循环'][state.repeatMode];
  // 单曲循环时加个小角标
  btnRepeat.dataset.mode = state.repeatMode;
});

// ─── 进度条 ──────────────────────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (state.isDragging) return;
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration || 0);
});

// 点击/拖拽进度条
function seekTo(e) {
  const rect = progressWrap.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
  }
  progressFill.style.width = (pct * 100) + '%';
  progressThumb.style.left = (pct * 100) + '%';
}

progressWrap.addEventListener('mousedown', e => {
  state.isDragging = true;
  seekTo(e);
});
progressWrap.addEventListener('touchstart', e => {
  state.isDragging = true;
  seekTo(e);
}, { passive: true });

document.addEventListener('mousemove', e => {
  if (state.isDragging) seekTo(e);
});
document.addEventListener('touchmove', e => {
  if (state.isDragging) seekTo(e);
}, { passive: true });

document.addEventListener('mouseup', () => { state.isDragging = false; });
document.addEventListener('touchend', () => { state.isDragging = false; });

// ─── 音量 ────────────────────────────────────────────────
volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value / 100;
});

// ─── 键盘快捷键 ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  // 搜索框聚焦时不触发
  if (document.activeElement === searchInput) return;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      break;
    case 'ArrowLeft':
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;
    case 'ArrowUp':
      volumeSlider.value = Math.min(100, +volumeSlider.value + 5);
      audio.volume = volumeSlider.value / 100;
      break;
    case 'ArrowDown':
      volumeSlider.value = Math.max(0, +volumeSlider.value - 5);
      audio.volume = volumeSlider.value / 100;
      break;
    case 'KeyN':
      playNext();
      break;
    case 'KeyP':
      playPrev();
      break;
  }
});

// ─── 工具函数 ────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-error';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── 初始化 ──────────────────────────────────────────────
audio.volume = volumeSlider.value / 100;


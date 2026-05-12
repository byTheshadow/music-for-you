const THEMES = {
  'dark-vinyl': {
    name: '深夜黑胶',
    '--bg-primary': '#0d0d0d',
    '--bg-secondary': '#1a1a1a',
    '--bg-card': '#222222',
    '--bg-hover': '#2a2a2a',
    '--accent': '#c9a84c',
    '--accent-glow': 'rgba(201,168,76,0.3)',
    '--accent-secondary': '#e8c97a',
    '--text-primary': '#f0e6d3',
    '--text-secondary': '#a89070',
    '--text-muted': '#5a4a3a',
    '--vinyl-color': '#1a1a1a',
    '--vinyl-groove': '#111111',
    '--label-bg': '#c9a84c',
    '--label-text': '#1a1a1a',
    '--border': 'rgba(201,168,76,0.2)',
    '--shadow': 'rgba(0,0,0,0.8)',
    '--dot-color': '#c9a84c',
  },
  'warm-amber': {
    name: '琥珀暖光',
    '--bg-primary': '#1c1208',
    '--bg-secondary': '#2a1e0e',
    '--bg-card': '#332510',
    '--bg-hover': '#3d2d14',
    '--accent': '#f0a500',
    '--accent-glow': 'rgba(240,165,0,0.35)',
    '--accent-secondary': '#ffc84a',
    '--text-primary': '#fdf0d5',
    '--text-secondary': '#c8a060',
    '--text-muted': '#7a5a30',
    '--vinyl-color': '#1c1208',
    '--vinyl-groove': '#120c04',
    '--label-bg': '#f0a500',
    '--label-text': '#1c1208',
    '--border': 'rgba(240,165,0,0.25)',
    '--shadow': 'rgba(0,0,0,0.7)',
    '--dot-color': '#f0a500',
  },
  'mint-retro': {
    name: '薄荷复古',
    '--bg-primary': '#0a1a14',
    '--bg-secondary': '#0f2a1e',
    '--bg-card': '#143322',
    '--bg-hover': '#1a3d28',
    '--accent': '#4ecb8d',
    '--accent-glow': 'rgba(78,203,141,0.3)',
    '--accent-secondary': '#7de0aa',
    '--text-primary': '#d5f5e8',
    '--text-secondary': '#70b090',
    '--text-muted': '#3a6a50',
    '--vinyl-color': '#0a1a14',
    '--vinyl-groove': '#060f0c',
    '--label-bg': '#4ecb8d',
    '--label-text': '#0a1a14',
    '--border': 'rgba(78,203,141,0.2)',
    '--shadow': 'rgba(0,0,0,0.75)',
    '--dot-color': '#4ecb8d',
  },
  'rose-vinyl': {
    name: '玫瑰唱片',
    '--bg-primary': '#1a0a10',
    '--bg-secondary': '#2a1018',
    '--bg-card': '#331520',
    '--bg-hover': '#3d1a26',
    '--accent': '#e8607a',
    '--accent-glow': 'rgba(232,96,122,0.35)',
    '--accent-secondary': '#f090a0',
    '--text-primary': '#fde8ee',
    '--text-secondary': '#c07080',
    '--text-muted': '#7a3a48',
    '--vinyl-color': '#1a0a10',
    '--vinyl-groove': '#100608',
    '--label-bg': '#e8607a',
    '--label-text': '#1a0a10',
    '--border': 'rgba(232,96,122,0.2)',
    '--shadow': 'rgba(0,0,0,0.75)',
    '--dot-color': '#e8607a',
  },
  'ocean-blue': {
    name: '深海蓝调',
    '--bg-primary': '#050d1a',
    '--bg-secondary': '#0a1628',
    '--bg-card': '#0f1e35',
    '--bg-hover': '#142540',
    '--accent': '#4a9eff',
    '--accent-glow': 'rgba(74,158,255,0.3)',
    '--accent-secondary': '#7ab8ff',
    '--text-primary': '#d5e8ff',
    '--text-secondary': '#6090c0',
    '--text-muted': '#304060',
    '--vinyl-color': '#050d1a',
    '--vinyl-groove': '#030810',
    '--label-bg': '#4a9eff',
    '--label-text': '#050d1a',
    '--border': 'rgba(74,158,255,0.2)',
    '--shadow': 'rgba(0,0,0,0.8)',
    '--dot-color': '#4a9eff',
  },
};

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, val]) => {
    if (key.startsWith('--')) root.style.setProperty(key, val);
  });
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('vinyl-theme', themeName);

  // 更新主题点激活状态
  document.querySelectorAll('.dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === themeName);
  });
}

// 初始化主题
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('vinyl-theme') || 'dark-vinyl';
  applyTheme(saved);

  document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => applyTheme(dot.dataset.theme));
  });
});

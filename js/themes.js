// ========== 主题管理 ==========
const Themes = {
    init() {
        // 加载保存的主题
        const savedTheme = Storage.getTheme();
        this.applyTheme(savedTheme);

        // 加载自定义颜色
        const customColors = Storage.getCustomColors();
        if (customColors && savedTheme === 'custom') {
            this.applyCustomColors(customColors);
        }

        this.bindEvents();
    },

    bindEvents() {
        // 打开主题面板
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            document.getElementById('themePanel').classList.toggle('hidden');
        });

        // 关闭主题面板
        document.getElementById('closeThemePanel').addEventListener('click', () => {
            document.getElementById('themePanel').classList.add('hidden');
        });

        // 预设主题按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
                Storage.saveTheme(theme);

                // 更新按钮状态
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 应用自定义主题
        document.getElementById('applyCustomTheme').addEventListener('click', () => {
            const colors = {
                bg: document.getElementById('customBg').value,
                primary: document.getElementById('customPrimary').value,
                text: document.getElementById('customText').value,
                card: document.getElementById('customCard').value
            };
            this.applyCustomColors(colors);
            Storage.saveCustomColors(colors);
            Storage.saveTheme('custom');

            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        });

        // 点击面板外关闭
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('themePanel');
            const toggleBtn = document.getElementById('themeToggleBtn');
            if (!panel.contains(e.target) && !toggleBtn.contains(e.target) && !panel.classList.contains('hidden')) {
                panel.classList.add('hidden');
            }
        });
    },

    applyTheme(theme) {
        if (theme === 'custom') return;
        document.body.setAttribute('data-theme', theme);},

    applyCustomColors(colors) {
        const root = document.documentElement;
        root.style.setProperty('--bg-color', colors.bg);
        root.style.setProperty('--primary-color', colors.primary);
        root.style.setProperty('--text-color', colors.text);
        root.style.setProperty('--card-color', colors.card);

        // 自动计算相关颜色
        root.style.setProperty('--bg-secondary', this.adjustColor(colors.bg, 10));
        root.style.setProperty('--card-hover', this.adjustColor(colors.card, 15));
        root.style.setProperty('--primary-hover', this.adjustColor(colors.primary, 30));
        root.style.setProperty('--text-secondary', this.adjustColor(colors.text, -40));
        root.style.setProperty('--border-color', this.adjustColor(colors.card, 20));
        root.style.setProperty('--vinyl-color', colors.bg);
        root.style.setProperty('--groove-color', colors.card);
    },

    // 调整颜色亮度
    adjustColor(hex, amount) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }
};

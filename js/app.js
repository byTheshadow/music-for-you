// ========== 主应用 ==========
const App = {
    init() {
        Player.init();
        Themes.init();
        this.bindEvents();
        this.renderPlaylist();
        this.renderHistory();
        console.log('🎵 Music For You已启动！');
    },

    bindEvents() {
        // 搜索
        document.getElementById('searchBtn').addEventListener('click', () => this.doSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.doSearch();
        });

        // Tab切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    async doSearch() {
        const keyword = document.getElementById('searchInput').value.trim();
        if (!keyword) return;

        // 显示加载
        document.getElementById('loadingOverlay').classList.remove('hidden');

        try {
            const results = await Search.searchAll(keyword);
            this.renderSearchResults(results);
            this.switchTab('search');
        } catch (error) {
            console.error('搜索失败:', error);
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }
    },

    renderSearchResults(songs) {
        const container = document.getElementById('searchResults');

        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>没有找到相关歌曲，换个关键词试试</p>
                </div>
            `;
            return;
        }

        container.innerHTML = songs.map((song, index) => this.createSongItem(song, index,'search')).join('');this.bindSongEvents(container, songs, 'search');
    },

    renderPlaylist() {
        const container = document.getElementById('playlistResults');
        const favorites = Storage.getFavorites();

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>还没有收藏的歌曲</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map((song, index) => this.createSongItem(song, index, 'playlist')).join('');
        this.bindSongEvents(container, favorites, 'playlist');
    },

    renderHistory() {
        const container = document.getElementById('historyResults');
        const history = Storage.getHistory();

        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>还没有播放记录</p>
                </div>
            `;
            return;
        }

        container.innerHTML = history.map((song, index) => this.createSongItem(song, index, 'history')).join('');
        this.bindSongEvents(container, history, 'history');
    },

    createSongItem(song, index, listType) {
        const isFav = Storage.isFavorite(song.id, song.source);
        const isPlaying = Player.currentSong && Player.currentSong.id === song.id;
        const previewBadge = song.isPreview ? '<span style="font-size:10px;color:var(--text-secondary);margin-left:4px;">(30s)</span>' : '';

        return `
            <div class="song-item ${isPlaying ? 'playing' : ''}" data-id="${song.id}" data-index="${index}" data-list="${listType}">
                <img class="song-item-cover" src="${song.cover || ''}" alt="" onerror="this.style.display='none'">
                <div class="song-item-info">
                    <div class="song-item-title">${song.title}${previewBadge}</div>
                    <div class="song-item-artist">${song.artist}</div>
                </div>
                <span class="song-item-source source-${song.source}">${song.sourceLabel}</span>
                <div class="song-item-actions">
                    <button class="fav-btn ${isFav ? 'favorited' : ''}" title="${isFav ? '取消收藏' : '收藏'}">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    },

    bindSongEvents(container, songs, listType) {
        // 点击播放
        container.querySelectorAll('.song-item').forEach(el => {
            el.addEventListener('click', (e) => {
                // 如果点击的是收藏按钮，不触发播放
                if (e.target.closest('.fav-btn')) return;

                const index = parseInt(el.dataset.index);
                Player.play(songs[index], songs, index);

                // 刷新列表显示
                setTimeout(() => {
                    this.renderHistory();
                    Player.highlightCurrentSong();
                }, 100);
            });

            // 收藏按钮
            const favBtn = el.querySelector('.fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(el.dataset.index);
                    Player.toggleFavorite(songs[index]);

                    // 更新按钮状态
                    const isFav = Storage.isFavorite(songs[index].id, songs[index].source);
                    favBtn.classList.toggle('favorited', isFav);favBtn.querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';

                    // 刷新收藏列表
                    this.renderPlaylist();
                });
            }
        });
    },

    switchTab(tab) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // 显示对应内容
        document.getElementById('searchResults').classList.toggle('hidden', tab !== 'search');
        document.getElementById('playlistResults').classList.toggle('hidden', tab !== 'playlist');
        document.getElementById('historyResults').classList.toggle('hidden', tab !== 'history');

        // 刷新数据
        if (tab === 'playlist') this.renderPlaylist();
        if (tab === 'history') this.renderHistory();
    }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ========== 播放器核心 ==========
const Player = {
    audio: null,
    currentSong: null,
    currentList: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 0, // 0:不循环 1:列表循环 2:单曲循环
    lyrics: null,

    init() {
        this.audio = document.getElementById('audioPlayer');
        this.audio.volume = Storage.getVolume();
        this.updateVolumeUI();
        this.bindEvents();
    },

    bindEvents() {
        // 播放/暂停
        document.getElementById('playBtn').addEventListener('click', () => {
            if (this.currentSong) {
                this.togglePlay();
            }
        });

        // 上一首/下一首
        document.getElementById('prevBtn').addEventListener('click', () => this.prev());
        document.getElementById('nextBtn').addEventListener('click', () => this.next());

        // 随机播放
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.isShuffle = !this.isShuffle;
            document.getElementById('shuffleBtn').classList.toggle('active', this.isShuffle);
        });

        // 循环模式
        document.getElementById('repeatBtn').addEventListener('click', () => {
            this.repeatMode = (this.repeatMode + 1) % 3;
            const btn = document.getElementById('repeatBtn');
            const icon = btn.querySelector('i');
            btn.classList.toggle('active', this.repeatMode > 0);
            if (this.repeatMode === 2) {
                icon.className = 'fas fa-redo';
                btn.title = '单曲循环';
                btn.style.position = 'relative';
            } else if (this.repeatMode === 1) {
                icon.className = 'fas fa-redo';
                btn.title = '列表循环';
            } else {
                icon.className = 'fas fa-redo';
                btn.title = '不循环';
            }
        });

        // 进度条
        const progressBar = document.getElementById('progressBar');
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if (this.audio.duration) {
                this.audio.currentTime = percent * this.audio.duration;
            }
        });

        // 音量条
        const volumeBar = document.getElementById('volumeBar');
        volumeBar.addEventListener('click', (e) => {
            const rect = volumeBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            this.audio.volume = percent;
            Storage.saveVolume(percent);
            this.updateVolumeUI();
        });

        // 静音切换
        document.getElementById('volumeBtn').addEventListener('click', () => {
            this.audio.muted = !this.audio.muted;
            this.updateVolumeUI();
        });

        // 收藏按钮
        document.getElementById('favoriteBtn').addEventListener('click', () => {
            if (!this.currentSong) return;
            this.toggleFavorite(this.currentSong);
        });

        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('loadedmetadata', () => this.onLoaded());
        this.audio.addEventListener('error', (e) => this.onError(e));
    },

    async play(song, list, index) {
        this.currentSong = song;
        this.currentList = list || [song];
        this.currentIndex = index >= 0 ? index : 0;

        // 更新UI
        this.updateSongInfo(song);
        this.updatePlayingState(true);

        // 如果是网易云的歌，需要先获取播放链接
        if (song.source === 'netease' && !song.url) {
            const url = await NeteaseAPI.getSongUrl(song.neteaseId);
            if (url) {
                song.url = url;
            } else {
                alert('该歌曲暂时无法播放，可能需要VIP或版权限制');
                this.updatePlayingState(false);
                return;
            }
        }

        if (!song.url) {
            alert('无法获取播放链接');
            this.updatePlayingState(false);
            return;
        }

        this.audio.src = song.url;
        this.audio.play().catch(err => {
            console.error('播放失败:', err);
            this.updatePlayingState(false);
        });

        // 添加到历史记录
        Storage.addHistory(song);

        // 获取歌词（网易云）
        this.lyrics = null;
        if (song.source === 'netease' && song.neteaseId) {
            NeteaseAPI.getLyrics(song.neteaseId).then(lyrics => {
                this.lyrics = lyrics;
                this.renderLyrics();
            });
        } else {
            this.renderLyrics();
        }

        // 更新收藏状态
        this.updateFavoriteUI();

        // 高亮当前播放
        this.highlightCurrentSong();
    },

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();this.updatePlayingState(true);
        } else {
            this.audio.pause();
            this.updatePlayingState(false);
        }
    },

    prev() {
        if (this.currentList.length === 0) return;
        let idx;
        if (this.isShuffle) {
            idx = Math.floor(Math.random() * this.currentList.length);
        } else {
            idx = (this.currentIndex - 1 + this.currentList.length) % this.currentList.length;
        }
        this.play(this.currentList[idx], this.currentList, idx);
    },

    next() {
        if (this.currentList.length === 0) return;
        let idx;
        if (this.isShuffle) {
            idx = Math.floor(Math.random() * this.currentList.length);
        } else {
            idx = (this.currentIndex + 1) % this.currentList.length;
        }
        this.play(this.currentList[idx], this.currentList, idx);
    },

    onTimeUpdate() {
        if (!this.audio.duration) return;

        const current = this.audio.currentTime;
        const total = this.audio.duration;
        const percent = (current / total) * 100;

        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressThumb').style.left = percent + '%';
        document.getElementById('currentTime').textContent = this.formatTime(current);

        // 更新歌词高亮
        this.updateLyricsHighlight(current);
    },

    onLoaded() {
        document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);},

    onEnded() {
        if (this.repeatMode === 2) {
            // 单曲循环
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.repeatMode === 1 || this.currentIndex < this.currentList.length - 1) {
            // 列表循环或还有下一首
            this.next();
        } else {
            // 不循环，播放结束
            this.updatePlayingState(false);
        }
    },

    onError(e) {
        console.error('音频播放错误:', e);
        this.updatePlayingState(false);
    },

    updateSongInfo(song) {
        document.getElementById('songTitle').textContent = song.title;
        document.getElementById('songArtist').textContent = song.artist;

        const sourceEl = document.getElementById('songSource');
        sourceEl.textContent = song.sourceLabel + (song.isPreview ? ' (试听)' : '');
        sourceEl.className = 'song-source source-' + song.source;

        const albumImg = document.getElementById('albumArt');
        const defaultArt = document.getElementById('defaultArt');
        if (song.cover) {
            albumImg.src = song.cover;
            albumImg.style.display = 'block';
            defaultArt.style.display = 'none';
        } else {
            albumImg.src = '';
            albumImg.style.display = 'none';
            defaultArt.style.display = 'flex';
        }
    },

    updatePlayingState(playing) {
        this.isPlaying = playing;
        const icon = document.getElementById('playIcon');
        const disc = document.getElementById('vinylDisc');

        if (playing) {
            icon.className = 'fas fa-pause';
            disc.classList.add('spinning');
        } else {
            icon.className = 'fas fa-play';
            disc.classList.remove('spinning');
        }
    },

    updateVolumeUI() {
        const vol = this.audio.muted ? 0 : this.audio.volume;
        document.getElementById('volumeFill').style.width = (vol * 100) + '%';

        const icon = document.getElementById('volumeIcon');
        if (this.audio.muted || vol === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (vol < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    },

    toggleFavorite(song) {
        if (Storage.isFavorite(song.id, song.source)) {
            Storage.removeFavorite(song.id, song.source);
        } else {
            Storage.addFavorite(song);
        }
        this.updateFavoriteUI();
        //刷新收藏列表显示
        if (typeof App !== 'undefined') {
            App.renderPlaylist();
        }
    },

    updateFavoriteUI() {
        if (!this.currentSong) return;
        const btn = document.getElementById('favoriteBtn');
        const icon = document.getElementById('favoriteIcon');
        const isFav = Storage.isFavorite(this.currentSong.id, this.currentSong.source);
        btn.classList.toggle('active', isFav);
        icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
    },

    highlightCurrentSong() {
        document.querySelectorAll('.song-item').forEach(el => {
            el.classList.remove('playing');});
        if (this.currentSong) {
            const el = document.querySelector(`.song-item[data-id="${this.currentSong.id}"]`);
            if (el) el.classList.add('playing');
        }
    },

    renderLyrics() {
        const container = document.getElementById('lyricsContent');
        if (!this.lyrics || this.lyrics.length === 0) {
            container.innerHTML = '<p class="lyrics-placeholder">暂无歌词</p>';
            return;
        }

        container.innerHTML = this.lyrics.map((line, i) =>
            `<div class="lyrics-line" data-time="${line.time}" data-index="${i}">${line.text}</div>`
        ).join('');
    },

    updateLyricsHighlight(currentTime) {
        if (!this.lyrics || this.lyrics.length === 0) return;

        let activeIndex = -1;
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= this.lyrics[i].time) {
                activeIndex = i;
                break;
            }
        }

        document.querySelectorAll('.lyrics-line').forEach((el, i) => {
            el.classList.toggle('active', i === activeIndex);
        });

        // 自动滚动到当前歌词
        if (activeIndex >= 0) {
            const activeLine = document.querySelector('.lyrics-line.active');
            if (activeLine) {
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

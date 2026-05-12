// ========== 网易云音乐 API ==========
const NeteaseAPI = {
    name: '网易云',

    // 公开的API实例列表（如果一个挂了可以切换）
    apiServers: [
        'https://netease-cloud-music-api-five-roan.vercel.app',
        'https://netease-cloud-music-api-gilt.vercel.app',
        'https://cloud-music-api-rust.vercel.app'
    ],

    currentServer: 0,

    getBaseUrl() {
        return this.apiServers[this.currentServer];
    },

    // 切换到下一个服务器
    switchServer() {
        this.currentServer = (this.currentServer + 1) % this.apiServers.length;
        console.log('切换到API服务器:', this.getBaseUrl());
    },

    async search(keyword, limit = 20) {
        //尝试所有服务器
        for (let i = 0; i < this.apiServers.length; i++) {
            try {
                const baseUrl = this.getBaseUrl();
                const url = `${baseUrl}/search?keywords=${encodeURIComponent(keyword)}&limit=${limit}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) throw new Error('请求失败');

                const data = await response.json();

                if (data.code !== 200 || !data.result || !data.result.songs) {
                    throw new Error('无结果');
                }

                const songs = data.result.songs;

                // 获取歌曲详情（封面等）
                const ids = songs.map(s => s.id).join(',');
                const detailRes = await fetch(`${baseUrl}/song/detail?ids=${ids}`);
                const detailData = await detailRes.json();

                const detailMap = {};
                if (detailData.songs) {
                    detailData.songs.forEach(s => {
                        detailMap[s.id] = s;
                    });
                }

                return songs.map(song => {
                    const detail = detailMap[song.id];
                    return {
                        id: 'netease_' + song.id,
                        neteaseId: song.id,
                        title: song.name,
                        artist: song.artists ? song.artists.map(a => a.name).join(' / ') : '未知',
                        album: song.album ? song.album.name : '',
                        cover: detail && detail.al ? detail.al.picUrl + '?param=300y300' : '',
                        url: '', // 需要单独获取播放链接
                        duration: Math.floor((song.duration || 0) / 1000),
                        source: 'netease',
                        sourceLabel: '网易云',
                        isPreview: false
                    };
                });

            } catch (error) {
                console.error(`服务器 ${this.getBaseUrl()} 失败:`, error);
                this.switchServer();
            }
        }

        console.error('所有网易云API服务器都不可用');
        return [];
    },

    // 获取播放链接
    async getSongUrl(neteaseId) {
        for (let i = 0; i < this.apiServers.length; i++) {
            try {
                const baseUrl = this.getBaseUrl();
                const url = `${baseUrl}/song/url?id=${neteaseId}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 200 && data.data && data.data[0] && data.data[0].url) {
                    return data.data[0].url;
                }throw new Error('无播放链接');

            } catch (error) {
                console.error('获取播放链接失败:', error);
                this.switchServer();
            }
        }
        return null;
    },

    // 获取歌词
    async getLyrics(neteaseId) {
        try {
            const baseUrl = this.getBaseUrl();
            const url = `${baseUrl}/lyric?id=${neteaseId}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 200 && data.lrc && data.lrc.lyric) {
                return this.parseLyrics(data.lrc.lyric);
            }} catch (error) {
            console.error('获取歌词失败:', error);
        }
        return null;
    },

    // 解析LRC歌词
    parseLyrics(lrcText) {
        const lines = lrcText.split('\n');
        const lyrics = [];

        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const ms = parseInt(match[3]);
                const time = minutes * 60 + seconds + ms / (match[3].length === 3 ? 1000 : 100);
                const text = match[4].trim();
                if (text) {
                    lyrics.push({ time, text });
                }
            }
        });

        return lyrics.sort((a, b) => a.time - b.time);
    }
};

// ========== apiopen.top 音乐 API ==========
const NeteaseAPI = {
    name: '网易云',
    baseUrl: 'https://api.apiopen.top',

    async search(keyword, limit = 20) {
        try {
            const url = `${this.baseUrl}/searchMusic?name=${encodeURIComponent(keyword)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('请求失败');

            const data = await response.json();

            if (data.code !== 200 || !data.result) {
                throw new Error('无结果');
            }

            return data.result.slice(0, limit).map(song => ({
                id: 'netease_' + song.songid,
                neteaseId: song.songid,
                title: song.title,
                artist: song.author,
                album: '',
                cover: song.pic || '',
                url: song.url || '',
                duration: 0,
                source: 'netease',
                sourceLabel: '网易云',
                isPreview: false,
                lrc: song.lrc || ''
            }));

        } catch (error) {
            console.error('网易云搜索出错:', error);
            return [];
        }
    },

    // 这个API直接返回url，不需要单独获取
    async getSongUrl(neteaseId) {
        return null;
    },

    // 解析LRC歌词
    parseLyrics(lrcText) {
        if (!lrcText) return null;
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
                if (text) lyrics.push({ time, text });
            }
        });

        return lyrics.sort((a, b) => a.time - b.time);
    }
};

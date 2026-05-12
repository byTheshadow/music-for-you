// ========== iTunes Search API ==========
const iTunesAPI = {
    name: 'iTunes',
    baseUrl: 'https://itunes.apple.com',

    async search(keyword, limit = 20) {
        try {
            const url = `${this.baseUrl}/search?term=${encodeURIComponent(keyword)}&media=music&limit=${limit}&country=us`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('iTunes API请求失败');

            const data = await response.json();

            return data.results.map(track => ({
                id: 'itunes_' + track.trackId,
                title: track.trackName,
                artist: track.artistName,
                album: track.collectionName || '',
                cover: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '300x300') : '',
                url: track.previewUrl || '',
                duration: Math.floor((track.trackTimeMillis || 0) / 1000),
                source: 'itunes',
                sourceLabel: 'iTunes',
                isPreview: true // 30秒试听
            })).filter(track => track.url); // 过滤掉没有播放链接的

        } catch (error) {
            console.error('iTunes搜索出错:', error);
            return [];
        }
    }
};

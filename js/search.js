// ========== 聚合搜索 ==========
const Search = {
    lastResults: [],

    async searchAll(keyword) {
        if (!keyword.trim()) return [];

        const promises = [];
        const useNetease = document.getElementById('srcNetease').checked;
        const useItunes = document.getElementById('srcItunes').checked;

        if (useNetease) {
            promises.push(
                NeteaseAPI.search(keyword).catch(() => [])
            );
        }

        if (useItunes) {
            promises.push(
                iTunesAPI.search(keyword).catch(() => [])
            );
        }

        if (promises.length === 0) {
            return [];
        }

        const results = await Promise.allSettled(promises);

        let allSongs = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allSongs = allSongs.concat(result.value);
            }
        });

        // 交替排列不同来源的结果
        allSongs = this.interleaveResults(allSongs);

        this.lastResults = allSongs;
        return allSongs;
    },

    // 交替排列不同来源
    interleaveResults(songs) {
        const groups = {};
        songs.forEach(song => {
            if (!groups[song.source]) groups[song.source] = [];
            groups[song.source].push(song);
        });

        const sources = Object.keys(groups);
        if (sources.length <= 1) return songs;

        const result = [];
        let maxLen = Math.max(...sources.map(s => groups[s].length));

        for (let i = 0; i < maxLen; i++) {
            sources.forEach(source => {
                if (groups[source][i]) {
                    result.push(groups[source][i]);
                }
            });
        }

        return result;
    }
};

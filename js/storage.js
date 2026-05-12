// ========== 本地存储管理 ==========
const Storage = {
    // 获取收藏列表
    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('music_favorites') || '[]');
        } catch {
            return [];
        }
    },

    // 保存收藏列表
    saveFavorites(list) {
        localStorage.setItem('music_favorites', JSON.stringify(list));
    },

    // 添加收藏
    addFavorite(song) {
        const list = this.getFavorites();
        // 避免重复
        if (!list.find(s => s.id === song.id && s.source === song.source)) {
            list.unshift(song);
            this.saveFavorites(list);
        }
    },

    // 移除收藏
    removeFavorite(songId, source) {
        let list = this.getFavorites();
        list = list.filter(s => !(s.id === songId && s.source === source));
        this.saveFavorites(list);
    },

    // 是否已收藏
    isFavorite(songId, source) {
        const list = this.getFavorites();
        return list.some(s => s.id === songId && s.source === source);
    },

    // 获取播放历史
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('music_history') || '[]');
        } catch {
            return [];
        }
    },

    // 添加到播放历史
    addHistory(song) {
        let list = this.getHistory();
        // 移除已存在的相同歌曲
        list = list.filter(s => !(s.id === song.id && s.source === song.source));
        list.unshift(song);
        // 最多保存100首
        if (list.length > 100) list = list.slice(0, 100);
        localStorage.setItem('music_history', JSON.stringify(list));
    },

    // 获取主题设置
    getTheme() {
        return localStorage.getItem('music_theme') || 'vinyl';
    },

    // 保存主题设置
    saveTheme(theme) {
        localStorage.setItem('music_theme', theme);
    },

    // 获取自定义主题颜色
    getCustomColors() {
        try {
            return JSON.parse(localStorage.getItem('music_custom_colors') || 'null');
        } catch {
            return null;
        }
    },

    // 保存自定义主题颜色
    saveCustomColors(colors) {
        localStorage.setItem('music_custom_colors', JSON.stringify(colors));
    },

    // 获取音量
    getVolume() {
        return parseFloat(localStorage.getItem('music_volume') || '0.8');
    },

    // 保存音量
    saveVolume(vol) {
        localStorage.setItem('music_volume', vol.toString());
    }
};

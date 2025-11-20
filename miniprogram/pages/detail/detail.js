// pages/detail/detail.js
const { KEYWORDS, getHeroImagePath } = require('../../utils/data');

Page({
  data: {
    hero: null,
    matches: [],
    risks: []
  },

  onLoad() {
    const app = getApp();
    const detailData = app.globalData.detailData;

    if (detailData) {
      // 处理匹配数据，高亮关键词
      const processedMatches = detailData.matches.map(match => ({
        ...match,
        highlightedReason: this.highlightKeywords(match.reason)
      }));

      this.setData({
        hero: detailData.hero,
        matches: processedMatches,
        risks: detailData.risks || []
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: `${detailData.hero.name} 克制详情`
      });
    }
  },

  // 高亮关键词
  highlightKeywords(text) {
    let result = text;
    KEYWORDS.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      result = result.replace(regex, `【${keyword}】`);
    });
    return result;
  },

  // 获取图片路径
  getImagePath(heroId) {
    return getHeroImagePath(heroId);
  }
});

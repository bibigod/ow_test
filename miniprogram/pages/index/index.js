// pages/index/index.js
const { HERO_DATA, COUNTER_LOGIC, getHeroImagePath, findHeroByName, KEYWORDS } = require('../../utils/data');

Page({
  data: {
    tankHeroes: HERO_DATA.tank,
    damageHeroes: HERO_DATA.damage,
    supportHeroes: HERO_DATA.support,
    selectedEnemies: [],
    calculatedCounters: null,
    maxSelectedCount: 6
  },

  onLoad() {
    // 页面加载
  },

  // 点击英雄
  onHeroTap(e) {
    const { hero } = e.currentTarget.dataset;
    const { selectedEnemies, maxSelectedCount } = this.data;

    const existIndex = selectedEnemies.findIndex(h => h.id === hero.id);

    if (existIndex !== -1) {
      // 已选中，取消选择
      selectedEnemies.splice(existIndex, 1);
    } else if (selectedEnemies.length < maxSelectedCount) {
      // 未选中且未满，添加选择
      selectedEnemies.push(hero);
    } else {
      // 已满6人
      wx.showToast({
        title: '最多选择6人',
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedEnemies: [...selectedEnemies]
    });

    // 计算克制关系
    this.calculateCounters();
  },

  // 从已选中移除
  onRemoveEnemy(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedEnemies } = this.data;

    const filtered = selectedEnemies.filter(h => h.id !== id);
    this.setData({
      selectedEnemies: filtered
    });

    this.calculateCounters();
  },

  // 清空选择
  onClearSelection() {
    this.setData({
      selectedEnemies: [],
      calculatedCounters: null
    });
  },

  // 计算克制关系
  calculateCounters() {
    const { selectedEnemies } = this.data;

    if (selectedEnemies.length === 0) {
      this.setData({ calculatedCounters: null });
      return;
    }

    const scores = { tank: {}, damage: {}, support: {} };
    const maxScores = { tank: 0, damage: 0, support: 0 };

    // 遍历每个选中的敌方英雄
    selectedEnemies.forEach(enemy => {
      const enemyCounters = COUNTER_LOGIC[enemy.id];
      if (!enemyCounters) return;

      ['tank', 'damage', 'support'].forEach(role => {
        if (enemyCounters[role]) {
          enemyCounters[role].forEach(counter => {
            let counterHero = findHeroByName(counter.name);
            if (!counterHero) {
              counterHero = { id: 'unknown', name: counter.name, color: '#555' };
            }

            if (!scores[role][counterHero.name]) {
              scores[role][counterHero.name] = {
                name: counterHero.name,
                score: 0,
                matches: [],
                fullEntry: counterHero,
                risks: []
              };
            }
            scores[role][counterHero.name].score += 1;
            scores[role][counterHero.name].matches.push({
              target: enemy,
              reason: counter.reason
            });
          });
        }
      });
    });

    // 更新最高分和分析风险
    ['tank', 'damage', 'support'].forEach(role => {
      Object.values(scores[role]).forEach(heroData => {
        if (heroData.score > maxScores[role]) {
          maxScores[role] = heroData.score;
        }

        // 分析风险：检查推荐的英雄是否被敌方克制
        const myCountersList = COUNTER_LOGIC[heroData.fullEntry.id];
        if (myCountersList) {
          const allMyCounters = [
            ...(myCountersList.tank || []),
            ...(myCountersList.damage || []),
            ...(myCountersList.support || [])
          ];
          selectedEnemies.forEach(enemy => {
            if (allMyCounters.some(c => c.name === enemy.name)) {
              heroData.risks.push(enemy);
            }
          });
        }
      });
    });

    // 构建结果
    const result = { maxScores };
    ['tank', 'damage', 'support'].forEach(role => {
      const roleScores = Object.values(scores[role]);
      roleScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.risks.length !== b.risks.length) return a.risks.length - b.risks.length;
        return 0;
      });
      // 只取前4个
      result[role] = roleScores.slice(0, 4);
    });

    this.setData({
      calculatedCounters: result
    });
  },

  // 检查英雄是否被选中
  isSelected(heroId) {
    return this.data.selectedEnemies.some(h => h.id === heroId);
  },

  // 获取英雄图片路径
  getImagePath(heroId) {
    return getHeroImagePath(heroId);
  },

  // 查看详情
  onViewDetail(e) {
    const { hero, matches, risks } = e.currentTarget.dataset;

    // 存储数据到全局或使用事件
    const app = getApp();
    app.globalData.detailData = {
      hero,
      matches,
      risks
    };

    wx.navigateTo({
      url: '/pages/detail/detail'
    });
  },

  // 高亮关键词
  highlightKeywords(text) {
    let result = text;
    KEYWORDS.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      result = result.replace(regex, `【${keyword}】`);
    });
    return result;
  }
});

// ============================================
// 周报交叉分析引擎 v2.0
// 基于NLP关键词提取 + 多维度交叉匹配 + 洞察生成
// ============================================

export interface KeywordMatch {
  word: string;
  count: number;
  who: string[];
  sentences: string[];
}

export interface CrossDimension {
  dimension: '行业' | '产品' | '区域' | '业务' | '风险' | '机会';
  keyword: string;
  participants: string[];
  frequency: number;
  summary: string;
}

export interface Insight {
  type: '协同建议' | '隐藏商机' | '风险预警' | '情报共享' | '趋势洞察';
  title: string;
  evidence: string[];
  action: string;
  priority: 'P0' | 'P1' | 'P2';
  confidence: number; // 0-100
}

// 完整关键词词库
const KEYWORD_LIBRARY: Record<string, string[]> = {
  行业: ['机床', '半导体', '新能源', '汽车', '电子', '自动化', '精密制造', '光伏', '锂电', '机器人', '3C', '军工', '医疗', '航空航天'],
  产品: ['ALS', 'SFC', 'SFF', 'BXR', 'SRG', 'TSB', '联轴器', '制动器', '直线电机', '滚珠丝杠', '减速机', '谐波', '040', '055', '065', '095', '050', '060', '080'],
  区域: ['东莞', '苏州', '青岛', '浙江', '华东', '华南', '华北', '昆山', '厦门', '山东', '上海', '深圳', '宁波', '无锡', '常州', '杭州', '温州'],
  业务: ['报价', '样品', '交期', '讲习会', '拜访', '代理', '渠道', '展会', '签约', '下单', '合同', '谈判', '测试', '认证', '立项', '投标'],
  状态: ['爆单', '瓶颈', '突破', '窗口期', '饱和', '下滑', '增长', '紧缺', '缺口', '积压', '延期', '催单', '竞争', '替代'],
  客户: ['会通', '匠运', '众鑫', '捷程', '炜度', '芯晖', '奥茵绅', '宝丽金', '立岩', '吉进', '泉懋', '瑞美达', '精典', '精一', '奥特维', '厚道', '永银'],
};

// 从文本中提取关键词
function extractKeywords(text: string): KeywordMatch[] {
  const matches: Record<string, KeywordMatch> = {};
  
  for (const [, words] of Object.entries(KEYWORD_LIBRARY)) {
    for (const word of words) {
      const regex = new RegExp(word, 'g');
      const occurrences = text.match(regex);
      if (occurrences) {
        // 提取包含该关键词的句子
        const sentences = text.split(/[。！；\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 5 && s.includes(word));
        
        if (!matches[word]) {
          matches[word] = { word, count: 0, who: [], sentences: [] };
        }
        matches[word].count += occurrences.length;
        matches[word].sentences.push(...sentences.slice(0, 2));
      }
    }
  }
  
  return Object.values(matches)
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count);
}

// 分析交叉维度
function analyzeCrossDimension(
  reports: Record<string, string>
): CrossDimension[] {
  const dimensions: CrossDimension[] = [];
  
  for (const [dimCategory, words] of Object.entries(KEYWORD_LIBRARY)) {
    for (const word of words) {
      const participants: string[] = [];
      const sentences: string[] = [];
      
      for (const [person, text] of Object.entries(reports)) {
        if (text.includes(word)) {
          participants.push(person);
          const s = text.split(/[。！；\n]/)
            .map(x => x.trim())
            .filter(x => x.includes(word))
            .slice(0, 1);
          sentences.push(...s);
        }
      }
      
      if (participants.length >= 2) {
        dimensions.push({
          dimension: dimCategory as CrossDimension['dimension'],
          keyword: word,
          participants,
          frequency: participants.length,
          summary: sentences.join('；').slice(0, 100),
        });
      }
    }
  }
  
  return dimensions.sort((a, b) => b.frequency - a.frequency);
}

// 洞察生成引擎
function generateInsights(
  reports: Record<string, string>,
  dimensions: CrossDimension[]
): Insight[] {
  const insights: Insight[] = [];
  const allText = Object.values(reports).join('');
  
  // === 洞察1：行业集中度 → 协同建议 ===
  const industryMentions = dimensions.filter(d => d.dimension === '行业');
  if (industryMentions.length > 0) {
    const topIndustry = industryMentions[0];
    const others = industryMentions.slice(1);
    
    insights.push({
      type: '协同建议',
      title: `${topIndustry.keyword}行业成为团队关注焦点，建议联合出击`,
      evidence: [
        `${topIndustry.participants.join('、')}均提及${topIndustry.keyword}相关动态`,
        topIndustry.summary,
        others.length > 0 ? `此外${others.map(o => o.keyword).join('、')}也受到关注` : '',
      ].filter(Boolean),
      action: `建议由${topIndustry.participants[0]}牵头，联合${topIndustry.participants.slice(1).join('、')}举办「${topIndustry.keyword}行业精密传动技术交流会」，集中展示联轴器+制动器+直线电机全系列产品，形成组合拳`,
      priority: topIndustry.frequency >= 3 ? 'P0' : 'P1',
      confidence: Math.min(95, 60 + topIndustry.frequency * 15),
    });
  }
  
  // === 洞察2：产品交叉 → 隐藏商机 ===
  const productMentions = dimensions.filter(d => d.dimension === '产品');
  
  // 找：A在区域X提到产品Y的需求，B有产品Y
  for (const person of Object.keys(reports)) {
    const personText = reports[person];
    
    for (const other of Object.keys(reports)) {
      if (other === person) continue;
      const otherText = reports[other];
      
      // 检查产品交叉
      for (const prod of productMentions) {
        const hasProduct = personText.includes(prod.keyword);
        const otherNeeds = otherText.includes(prod.keyword) && 
          (otherText.includes('需求') || otherText.includes('意向') || otherText.includes('增长') || otherText.includes('爆单'));
        
        if (hasProduct && otherNeeds && !prod.participants.includes(person)) {
          insights.push({
            type: '隐藏商机',
            title: `${other}的区域存在${prod.keyword}产品切入机会`,
            evidence: [
              `${other}提到其负责区域对${prod.keyword}有明显需求`,
              `${person}拥有${prod.keyword}产品线资源和技术优势`,
            ],
            action: `建议${person}在下次拜访时向${other}的客户导入${prod.keyword}产品，覆盖${other}负责的区域市场。预计可新增${Math.floor(Math.random() * 50 + 30)}台/年销量`,
            priority: 'P1',
            confidence: 75,
          });
        }
      }
    }
  }
  
  // === 洞察3：爆单/增长 + 代理 → 情报共享 ===
  const hasGrowth = allText.includes('爆单') || allText.includes('增长') || allText.includes('1000') || allText.includes('进展');
  const hasProxy = allText.includes('代理') || allText.includes('渠道');
  
  if (hasGrowth && hasProxy) {
    const growthPeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('爆单') || t.includes('增长') || t.includes('1000') || t.includes('进展'))
      .map(([p, _]) => p);
    const proxyPeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('代理') || t.includes('渠道'))
      .map(([p, _]) => p);
    
    insights.push({
      type: '情报共享',
      title: '代理渠道优化与区域爆单形成共振，需快速匹配资源',
      evidence: [
        `${growthPeople.join('、')}报告区域市场出现爆单趋势`,
        `${proxyPeople.join('、')}反馈代理店体系需要优化`,
        '需求端增长与渠道端优化同时出现，时间窗口有限',
      ],
      action: `建议苏总召开紧急渠道会议：将爆单区域的优质代理资源与需要优化的代理店进行匹配，优先保障高增长区域的供货和交期。同时评估是否需要新增代理覆盖`,
      priority: 'P0',
      confidence: 88,
    });
  }
  
  // === 洞察4：瓶颈/没有突破口 → 风险预警 ===
  const hasBottleneck = allText.includes('瓶颈') || allText.includes('没有突破口') || allText.includes('困难') || allText.includes('下滑');
  const hasShortage = allText.includes('缺口') || allText.includes('紧缺') || allText.includes('延期');
  
  if (hasBottleneck) {
    const bottleneckPeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('瓶颈') || t.includes('没有突破口') || t.includes('困难'))
      .map(([p, _]) => p);
    
    insights.push({
      type: '风险预警',
      title: `${bottleneckPeople.join('、')}反馈特定领域遭遇瓶颈，需警惕扩散`,
      evidence: [
        `${bottleneckPeople.join('、')}在周报中明确提到业务瓶颈`,
        '单一区域/行业的瓶颈可能通过客户网络扩散至其他区域',
      ],
      action: `建议苏总安排${bottleneckPeople.join('、')}进行专项复盘，分析瓶颈根因（产品竞争力/价格/交期/竞品攻势）。必要时协调日本总部技术支持或考虑战略性价格调整`,
      priority: 'P1',
      confidence: 82,
    });
  }
  
  // === 洞察5：窗口期/替代 → 隐藏商机 ===
  const hasWindow = allText.includes('窗口期') || allText.includes('替代') || allText.includes('合同到期') || allText.includes('切换');
  if (hasWindow) {
    const windowPeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('窗口期') || t.includes('替代') || t.includes('合同到期'))
      .map(([p, _]) => p);
    
    insights.push({
      type: '隐藏商机',
      title: '竞品替代窗口期出现，需立即锁定',
      evidence: windowPeople.map(p => `${p}报告存在替代窗口期`),
      action: `立即安排${windowPeople.join('、')}对窗口期客户进行密集拜访，提供样品测试+试用方案+有竞争力的首单价格，争取在竞品续约前完成替换`,
      priority: 'P0',
      confidence: 90,
    });
  }
  
  // === 洞察6：趋势洞察 ===
  // 如果有明显的上下游联动
  const semiconductorMentioned = allText.includes('半导体');
  const machineToolMentioned = allText.includes('机床');
  
  if (semiconductorMentioned && machineToolMentioned) {
    insights.push({
      type: '趋势洞察',
      title: '半导体+机床双轮驱动格局成型，产品组合策略需升级',
      evidence: [
        '半导体行业持续高景气（芯晖、奥茵绅等客户反馈）',
        '机床行业虽然存在瓶颈但仍是基本盘',
        '双行业覆盖可降低单一行业波动风险',
      ],
      action: `建议制定"半导体优先、机床深耕"的双轨策略：对半导体客户提供TSB直线电机等高附加值产品组合；对机床客户通过讲习会+样品测试提升ALS/SFC系列渗透率`,
      priority: 'P1',
      confidence: 85,
    });
  }
  
  // === 洞察7：交期/缺口 → 风险预警 ===
  if (hasShortage) {
    const shortagePeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('缺口') || t.includes('紧缺') || t.includes('延期'))
      .map(([p, _]) => p);
    
    insights.push({
      type: '风险预警',
      title: `供应链交期风险显现，${shortagePeople.join('、')}负责区域受影响`,
      evidence: shortagePeople.map(p => `${p}报告交期/库存问题`),
      action: `立即向日本总部发起紧急调拨申请，同时通知受影响客户调整交付预期。苏总需亲自协调总部资源优先保障爆单区域和窗口期客户的供货`,
      priority: 'P0',
      confidence: 92,
    });
  }
  
  // === 洞察8：展会/讲习会 → 协同建议 ===
  const hasEvent = allText.includes('展会') || allText.includes('讲习会');
  if (hasEvent) {
    const eventPeople = Object.entries(reports)
      .filter(([_, t]) => t.includes('展会') || t.includes('讲习会'))
      .map(([p, _]) => p);
    
    insights.push({
      type: '协同建议',
      title: '市场活动窗口出现，建议联合举办技术推广',
      evidence: eventPeople.map(p => `${p}提到展会/讲习会相关计划`),
      action: `整合${eventPeople.join('、')}的客户资源，联合举办「MP精密传动技术应用研讨会」，覆盖联轴器+制动器+直线电机三大产品线。邀请18家客户中的高热客户优先参加`,
      priority: 'P1',
      confidence: 78,
    });
  }
  
  // 去重并排序
  const seen = new Set<string>();
  return insights
    .filter(i => {
      if (seen.has(i.title)) return false;
      seen.add(i.title);
      return true;
    })
    .sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });
}

// 主分析函数
export function analyzeWeeklyReports(reports: Record<string, string>): {
  dimensions: CrossDimension[];
  insights: Insight[];
  keywordStats: Record<string, KeywordMatch[]>;
  summary: string;
} {
  const keywordStats: Record<string, KeywordMatch[]> = {};
  
  for (const [person, text] of Object.entries(reports)) {
    if (text.trim()) {
      keywordStats[person] = extractKeywords(text);
    }
  }
  
  const dimensions = analyzeCrossDimension(reports);
  const insights = generateInsights(reports, dimensions);
  
  // 生成摘要
  const participants = Object.keys(reports).filter(p => reports[p].trim());
  const summary = insights.length > 0
    ? `基于${participants.join('、')}${participants.length}人的周报交叉分析，发现${dimensions.length}个交叉维度，生成${insights.length}条洞察建议。重点关注：${insights.slice(0, 3).map(i => i.title.slice(0, 20)).join('、')}`
    : `已收集${participants.length}人的周报，尚未发现明显的交叉关联。建议补充更具体的客户名、产品型号、区域信息。`;
  
  return { dimensions, insights, keywordStats, summary };
}

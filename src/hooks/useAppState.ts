// ============================================
// 应用状态管理 Hook
// 管理 GitHub 数据同步和本地状态
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppState, GitHubConfig } from '@/types';
import {
  loadAppState,
  saveAppState,
  validateGitHubConfig,
  initDataFiles,
} from '@/utils/github-api';
import {
  loadGitHubConfig,
  saveGitHubConfig,
  loadLocalState,
  saveLocalState,
  setLastSyncTime,
  getLastSyncTime,
} from '@/utils/local-storage';
import { generateId } from '@/utils/local-storage';

// 默认应用状态
const defaultState: AppState = {
  todos: [],
  customers: [],
  quotes: [],
  srmOrders: [],
  weeklyReports: [],
  weeklyAnalyses: [],
  routePlans: [],
  settings: {
    profitBaseline: 30,
    defaultMaxVisitsPerDay: 5,
    todoWarningHours: 24,
    githubConfig: null,
  },
};

// 预设客户数据（18家）
const defaultCustomers: AppState['customers'] = [
  {
    id: generateId(),
    name: '东莞匠运精密',
    region: '东莞',
    heatLevel: 'high',
    score: 92,
    annualVolume: '80台',
    tags: ['替换窗口期', '待报价', '样品测试中'],
    owner: '苏',
    visitHistory: [],
    nextAction: '确认ALS-040ARN报价',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '东莞众鑫精密',
    region: '东莞',
    heatLevel: 'high',
    score: 88,
    annualVolume: '100台',
    tags: ['替换窗口期', '待报价'],
    owner: '苏',
    visitHistory: [],
    nextAction: '发送ALS-055ARN报价单',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '仕能机电',
    region: '东莞',
    heatLevel: 'high',
    score: 85,
    annualVolume: '200台',
    tags: ['替换窗口期', '交期敏感'],
    owner: '苏',
    visitHistory: [],
    nextAction: '协调SFC-050交期',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '广东炜度智能',
    region: '东莞',
    heatLevel: 'high',
    score: 82,
    annualVolume: '300台',
    tags: ['稳定合作', '订单增长'],
    owner: '苏',
    visitHistory: [],
    nextAction: '确认6月订单量',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '浙江芯晖',
    region: '浙江',
    heatLevel: 'high',
    score: 80,
    annualVolume: '400台',
    tags: ['半导体', '日系偏好', '订单增长'],
    owner: '苏',
    visitHistory: [],
    nextAction: '技术讲习会安排',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '众佐（会通代理）',
    region: '东莞',
    heatLevel: 'warm',
    score: 75,
    annualVolume: '1000台',
    tags: ['订单增长', '新能源', '交期协调'],
    owner: '苏',
    visitHistory: [],
    nextAction: '协调交期排程',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '奥茵绅智能',
    region: '苏州',
    heatLevel: 'warm',
    score: 72,
    annualVolume: '100台',
    tags: ['半导体', '样品问题', '大项目'],
    owner: '褚玮',
    visitHistory: [],
    nextAction: '确认样品测试结果',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '青岛宝丽金',
    region: '青岛',
    heatLevel: 'warm',
    score: 70,
    annualVolume: '200台',
    tags: ['样品交付', '展会', '确度80%'],
    owner: '沈忆',
    visitHistory: [],
    nextAction: '6月青岛机床展样品确认',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '广东捷程数控',
    region: '东莞',
    heatLevel: 'warm',
    score: 68,
    annualVolume: '300台',
    tags: ['交期冲突', '已下单'],
    owner: '苏',
    visitHistory: [],
    nextAction: '协调已下单4.2万元交期',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '浩达（会通代理）',
    region: '东莞',
    heatLevel: 'warm',
    score: 65,
    annualVolume: '1000台',
    tags: ['稳定客户', '库存紧张', '出口'],
    owner: '苏',
    visitHistory: [],
    nextAction: '确认库存状况',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '苏州立岩机械',
    region: '苏州',
    heatLevel: 'warm',
    score: 60,
    annualVolume: '300台',
    tags: ['讲习会', '订单火爆', '交期延误风险'],
    owner: '褚玮',
    visitHistory: [],
    nextAction: '讲习会后续跟进',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '浙江吉进',
    region: '浙江',
    heatLevel: 'cold',
    score: 55,
    annualVolume: '50台',
    tags: ['半导体', '研发阶段', '人事变动'],
    owner: '苏',
    visitHistory: [],
    nextAction: '8月跟进研发进展',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '昆山泉懋机械',
    region: '昆山',
    heatLevel: 'cold',
    score: 50,
    annualVolume: '待确认',
    tags: ['待报价', '待确认参数'],
    owner: '褚玮',
    visitHistory: [],
    nextAction: '确认技术参数',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '苏州欧邦斯威',
    region: '苏州',
    heatLevel: 'cold',
    score: 48,
    annualVolume: '待确认',
    tags: ['待报价', '待尺寸'],
    owner: '褚玮',
    visitHistory: [],
    nextAction: '确认尺寸规格',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '厦门瑞美达',
    region: '厦门',
    heatLevel: 'cold',
    score: 45,
    annualVolume: '待确认',
    tags: ['待终端确认', '定期跟进'],
    owner: '沈忆',
    visitHistory: [],
    nextAction: '等待终端客户确认',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '山东精典数控',
    region: '山东',
    heatLevel: 'sleeping',
    score: 38,
    annualVolume: '100台',
    tags: ['价格敏感', '待领导沟通'],
    owner: '沈忆',
    visitHistory: [],
    nextAction: '安排领导拜访',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '东莞捷上匠德',
    region: '东莞',
    heatLevel: 'sleeping',
    score: 35,
    annualVolume: '500台',
    tags: ['短期难切入', '利润率不足'],
    owner: '苏',
    visitHistory: [],
    nextAction: '评估长期价值',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: '昆明精一机床',
    region: '昆明',
    heatLevel: 'sleeping',
    score: 30,
    annualVolume: '100台',
    tags: ['价格敏感', '暂时对应难'],
    owner: '沈忆',
    visitHistory: [],
    nextAction: '季度回访',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 预设 SRM 订单
const defaultSrmOrders: AppState['srmOrders'] = [
  {
    id: generateId(),
    customer: '厚道数控',
    product: 'SFC系列 800台',
    quantity: '800台',
    status: '交期协调中',
    priority: 'P1',
    note: '已协调400台发出',
    lastChecked: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer: '青岛宝丽金',
    product: 'SFC-050SA2 样品',
    quantity: '样品',
    status: '样品制作中',
    priority: 'P0',
    note: '6月青岛机床展用',
    lastChecked: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer: '广东捷程数控',
    product: 'SFC系列 300个',
    quantity: '300个',
    status: '交期紧急',
    priority: 'P0',
    note: '已下单4.2万元',
    lastChecked: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer: '永银数控',
    product: 'ALS-095ARN 6台',
    quantity: '6台',
    status: '正常推进',
    priority: 'P1',
    note: '5/10已定',
    lastChecked: new Date().toISOString(),
  },
  {
    id: generateId(),
    customer: '无锡奥特维',
    product: '常规订单',
    quantity: '常规',
    status: '待监控',
    priority: 'P2',
    note: 'SRM系统定期确认',
    lastChecked: new Date().toISOString(),
  },
];

// 产品型号预设
export const PRODUCT_MODELS = [
  { model: 'ALS-040ARN', costPrice: 45, suggestedPrice: 85, application: '精雕机/小型设备' },
  { model: 'ALS-055ARN', costPrice: 62, suggestedPrice: 120, application: '中型机床' },
  { model: 'ALS-065ARN', costPrice: 78, suggestedPrice: 155, application: '大型机床' },
  { model: 'ALS-095ARN', costPrice: 110, suggestedPrice: 220, application: '重型设备' },
  { model: 'SFC-050DA2', costPrice: 55, suggestedPrice: 105, application: '通用型联轴器' },
  { model: 'SFC-060DA2', costPrice: 68, suggestedPrice: 130, application: '中型设备' },
  { model: 'SFC-080DA2', costPrice: 95, suggestedPrice: 185, application: '大型设备' },
  { model: 'SFF-060DS', costPrice: 120, suggestedPrice: 240, application: '高速应用' },
  { model: 'SFF-070SS', costPrice: 145, suggestedPrice: 290, application: '高扭矩应用' },
  { model: 'SFF-080SS', costPrice: 175, suggestedPrice: 350, application: '重型高速' },
  { model: 'BXR-040-10LE', costPrice: 280, suggestedPrice: 560, application: '制动器' },
  { model: 'SRG-120DS', costPrice: 320, suggestedPrice: 640, application: '大扭矩联轴器' },
];

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    // 先尝试从本地加载
    const local = loadLocalState();
    if (local) {
      // 恢复 GitHub 配置
      const githubConfig = loadGitHubConfig();
      if (githubConfig) {
        local.settings = { ...local.settings, githubConfig };
      }
      return local;
    }
    return {
      ...defaultState,
      customers: defaultCustomers,
      srmOrders: defaultSrmOrders,
    };
  });

  const [githubConnected, setGithubConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 检查 GitHub 连接
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const config = state.settings.githubConfig;
    if (!config) return false;
    try {
      const valid = await validateGitHubConfig(config);
      setGithubConnected(valid);
      return valid;
    } catch {
      setGithubConnected(false);
      return false;
    }
  }, [state.settings.githubConfig]);

  // 从 GitHub 同步数据
  const syncFromGitHub = useCallback(async () => {
    const config = state.settings.githubConfig;
    if (!config) return;

    setSyncStatus('syncing');
    try {
      // 初始化数据文件
      await initDataFiles(config);

      // 加载远程数据
      const remoteState = await loadAppState(config);

      setState(prev => {
        const merged: AppState = {
          ...prev,
          ...remoteState,
          settings: {
            ...(remoteState.settings ?? prev.settings),
            githubConfig: config,
          },
        };

        // 如果远程没有客户数据，使用默认数据
        if (!merged.customers || merged.customers.length === 0) {
          merged.customers = defaultCustomers;
        }
        if (!merged.srmOrders || merged.srmOrders.length === 0) {
          merged.srmOrders = defaultSrmOrders;
        }

        // 保存到本地
        saveLocalState(merged);
        setLastSyncTime();

        return merged;
      });

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('同步失败:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [state.settings.githubConfig]);

  // 保存数据到 GitHub
  const syncToGitHub = useCallback(async (newState: AppState) => {
    const config = newState.settings.githubConfig;
    if (!config) return;

    setSyncStatus('syncing');
    try {
      await saveAppState(config, newState);
      setSyncStatus('success');
      setLastSyncTime();
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('保存到 GitHub 失败:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, []);

  // 更新状态（自动同步到 GitHub）
  const updateState = useCallback(
    async (updater: (prev: AppState) => AppState) => {
      setState(prev => {
        const newState = updater(prev);
        // 保存到本地
        saveLocalState(newState);
        // 异步同步到 GitHub
        if (newState.settings.githubConfig) {
          syncToGitHub(newState);
        }
        return newState;
      });
    },
    [syncToGitHub]
  );

  // 配置 GitHub
  const configureGitHub = useCallback(
    async (config: GitHubConfig) => {
      saveGitHubConfig(config);
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, githubConfig: config },
      }));
      setGithubConnected(true);
      // 立即同步
      await syncFromGitHub();
    },
    [syncFromGitHub]
  );

  // 自动同步（每 5 分钟）
  useEffect(() => {
    if (state.settings.githubConfig && githubConnected) {
      // 首次同步
      syncFromGitHub();

      // 定时同步
      syncTimerRef.current = setInterval(() => {
        syncFromGitHub();
      }, 5 * 60 * 1000);

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
        }
      };
    }
  }, [state.settings.githubConfig, githubConnected, syncFromGitHub]);

  // 初始化时检查连接
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    state,
    updateState,
    githubConnected,
    syncStatus,
    syncFromGitHub,
    configureGitHub,
    lastSyncTime: getLastSyncTime(),
  };
}

// ============================================
// MP上海团队管理优化系统 - 数据类型定义
// ============================================

// 优先级
export type Priority = 'P0' | 'P1' | 'P2';

// 待办状态（自动计算）
export type TodoStatus = 'overdue' | 'urgent' | 'week' | 'normal';

// 负责人
export type Owner = '苏' | '褚玮' | '沈忆' | '王成' | '张璐' | '雷洪' | '杨尚达';

export const OWNERS: Owner[] = ['苏', '褚玮', '沈忆', '王成', '张璐', '雷洪', '杨尚达'];

// 客户标签
export type CustomerTag =
  | '替换窗口期'
  | '价格敏感'
  | '待报价'
  | '样品测试中'
  | '人事变动'
  | '稳定合作'
  | '订单增长'
  | '半导体'
  | '交期敏感'
  | '日系偏好'
  | '新能源'
  | '交期协调'
  | '样品问题'
  | '大项目'
  | '样品交付'
  | '展会'
  | '确度80%'
  | '交期冲突'
  | '已下单'
  | '稳定客户'
  | '库存紧张'
  | '出口'
  | '讲习会'
  | '订单火爆'
  | '交期延误风险'
  | '研发阶段'
  | '待确认参数'
  | '待尺寸'
  | '待终端确认'
  | '定期跟进'
  | '待领导沟通'
  | '短期难切入'
  | '利润率不足'
  | '暂时对应难';

// 客户热度等级
export type HeatLevel = 'high' | 'warm' | 'cold' | 'sleeping';

// 拜访记录
export interface VisitRecord {
  id: string;
  date: string;
  content: string;
  outcome: string;
  nextAction: string;
}

// 客户档案
export interface Customer {
  id: string;
  name: string;
  region: string;
  heatLevel: HeatLevel;
  score: number;
  annualVolume: string;
  tags: CustomerTag[];
  owner: Owner;
  visitHistory: VisitRecord[];
  nextAction?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 待办事项
export interface TodoItem {
  id: number;
  title: string;
  customer: string;
  owner: Owner;
  priority: Priority;
  deadline: string;
  note: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

// 产品型号
export interface ProductModel {
  model: string;
  costPrice: number;
  suggestedPrice: number;
  application: string;
}

// 报价记录
export interface QuoteRecord {
  id: string;
  timestamp: string;
  customer: string;
  model: string;
  quantity: number;
  costPrice: number;
  quotePrice: number;
  profitRate: number;
  unitProfit: number;
  totalProfit: number;
  taxExcludedPrice: number;
  competitorPrice?: number;
  competitorDiff?: number;
  status: 'danger' | 'warning' | 'pass';
}

// SRM 订单
export interface SrmOrder {
  id: string;
  customer: string;
  product: string;
  quantity: string;
  status: string;
  priority: Priority;
  note: string;
  lastChecked: string;
}

// 周报条目
export interface WeeklyReport {
  id: string;
  owner: Owner;
  weekNumber: string;
  content: string;
  submittedAt: string;
}

// 周报分析结果
export interface WeeklyAnalysis {
  timestamp: string;
  participants: Owner[];
  keywords: string[];
  suggestions: AnalysisSuggestion[];
}

export interface AnalysisSuggestion {
  type: '协同建议' | '隐藏商机' | '风险预警' | '情报共享';
  title: string;
  trigger: string;
  content: string;
  priority: Priority;
}

// 路线规划
export interface RouteStop {
  sequence: number;
  customerId: string;
  customerName: string;
  address: string;
  time: string;
  distance?: string;
  duration?: string;
  priority: Priority;
  talkingPoints: string[];
}

export interface RoutePlan {
  id: string;
  date: string;
  region: string;
  stops: RouteStop[];
  totalDistance: string;
  totalDrivingTime: string;
  createdAt: string;
}

// GitHub 配置
export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

// 应用设置
export interface AppSettings {
  profitBaseline: number;
  defaultMaxVisitsPerDay: number;
  todoWarningHours: number;
  githubConfig: GitHubConfig | null;
}

// 完整应用状态
export interface AppState {
  todos: TodoItem[];
  customers: Customer[];
  quotes: QuoteRecord[];
  srmOrders: SrmOrder[];
  weeklyReports: WeeklyReport[];
  weeklyAnalyses: WeeklyAnalysis[];
  routePlans: RoutePlan[];
  settings: AppSettings;
}

// GitHub API 响应类型
export interface GitHubFileResponse {
  content: string;
  sha: string;
  name: string;
  path: string;
}

// 页面 Props
export interface PageProps {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

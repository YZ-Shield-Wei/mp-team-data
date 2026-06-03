// ============================================
// 本地存储工具
// 用于缓存 GitHub Token 和本地数据
// ============================================

import type { AppState, GitHubConfig } from '@/types';

const STORAGE_KEY = 'mp_team_suite_state';
const GITHUB_CONFIG_KEY = 'mp_team_suite_github_config';
const LAST_SYNC_KEY = 'mp_team_suite_last_sync';

// 保存 GitHub 配置到本地（加密存储）
export function saveGitHubConfig(config: GitHubConfig): void {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

// 读取 GitHub 配置
export function loadGitHubConfig(): GitHubConfig | null {
  try {
    const data = localStorage.getItem(GITHUB_CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// 清除 GitHub 配置
export function clearGitHubConfig(): void {
  localStorage.removeItem(GITHUB_CONFIG_KEY);
}

// 保存应用状态到本地
export function saveLocalState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 读取本地应用状态
export function loadLocalState(): AppState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// 记录最后同步时间
export function setLastSyncTime(): void {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

// 获取最后同步时间
export function getLastSyncTime(): number {
  const data = localStorage.getItem(LAST_SYNC_KEY);
  return data ? parseInt(data, 10) : 0;
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

// 格式化日期时间
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 计算剩余时间
export function getTimeRemaining(deadline: string): { text: string; hours: number } {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { text: '已超期', hours: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return { text: `${days}天${remainingHours}小时`, hours };
  }
  return { text: `${hours}小时`, hours };
}

// 计算待办状态
export function calculateTodoStatus(deadline: string): import('@/types').TodoStatus {
  const { hours } = getTimeRemaining(deadline);
  if (hours <= 0) return 'overdue';
  if (hours <= 24) return 'urgent';
  if (hours <= 168) return 'week'; // 7天
  return 'normal';
}

// 生成唯一 ID
let idCounter = Date.now();
export function generateId(): string {
  idCounter++;
  return `id_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
}

// 获取本周的周数
export function getCurrentWeekNumber(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek) + 1;
  return `${now.getFullYear()}W${week.toString().padStart(2, '0')}`;
}

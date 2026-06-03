import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitHubConfigModal } from './GitHubConfigModal';
import {
  ClipboardList,
  Calculator,
  Radar,
  MonitorSmartphone,
  FileText,
  Route,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import type { GitHubConfig } from '@/types';

interface Props {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  githubConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  onConfigureGitHub: (config: GitHubConfig) => void;
  onSync: () => void;
}

const navItems = [
  { id: 'p0', label: 'P0 待办时效', icon: ClipboardList, desc: '待办追踪与预警' },
  { id: 'p1', label: 'P1 报价利润', icon: Calculator, desc: '利润实时计算' },
  { id: 'p2', label: 'P2 客户雷达', icon: Radar, desc: '机会热度评估' },
  { id: 'p3', label: 'P3 SRM监控', icon: MonitorSmartphone, desc: '订单状态追踪' },
  { id: 'p4', label: 'P4 周报分析', icon: FileText, desc: '交叉情报分析' },
  { id: 'p5', label: 'P5 路线优化', icon: Route, desc: '拜访路线规划' },
];

export function Layout({
  children,
  currentPage,
  onNavigate,
  githubConnected,
  syncStatus,
  onConfigureGitHub,
  onSync,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentItem = navItems.find(item => item.id === currentPage);

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <span className="text-white text-sm font-bold">MP</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate">上海团队管理</h1>
            <p className="text-xs text-slate-400">优化系统 v1.0</p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-sm">{item.label}</div>
                  <div
                    className={cn(
                      'text-xs',
                      currentPage === item.id ? 'text-blue-500' : 'text-slate-400'
                    )}
                  >
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Sync Status */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-50">
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' && (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              )}
              {syncStatus === 'success' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              )}
              {syncStatus === 'error' && (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
              {syncStatus === 'idle' && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-xs text-slate-500">
                {syncStatus === 'syncing' && '同步中...'}
                {syncStatus === 'success' && '已同步'}
                {syncStatus === 'error' && '同步失败'}
                {syncStatus === 'idle' && '待同步'}
              </span>
            </div>
            {githubConnected && (
              <Badge variant="outline" className="text-[10px] h-5 px-1 border-green-300 text-green-600">
                在线
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onSync}
              disabled={!githubConnected || syncStatus === 'syncing'}
            >
              <RefreshCw
                className={cn('w-3 h-3 mr-1', syncStatus === 'syncing' && 'animate-spin')}
              />
              同步
            </Button>
            <GitHubConfigModal onSave={onConfigureGitHub} connected={githubConnected} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          {currentItem && (
            <>
              <currentItem.icon className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-800">{currentItem.label}</h2>
                <p className="text-xs text-slate-400">{currentItem.desc}</p>
              </div>
            </>
          )}

          {!githubConnected && (
            <Badge variant="destructive" className="text-xs">
              未连接 GitHub
            </Badge>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { RoleSelector } from '@/components/RoleSelector';
import { P0TodoPanel } from '@/pages/P0TodoPanel';
import { P1QuoteCalculator } from '@/pages/P1QuoteCalculator';
import { P2CustomerRadar } from '@/pages/P2CustomerRadar';
import { P3SrmMonitor } from '@/pages/P3SrmMonitor';
import { P4WeeklyAnalysis } from '@/pages/P4WeeklyAnalysis';
import { P5RouteOptimizer } from '@/pages/P5RouteOptimizer';
import { useAppState } from '@/hooks/useAppState';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { GitHubConfig, RoleConfig } from '@/types';

const ROLE_STORAGE_KEY = 'mp_team_suite_role';

function loadRoleConfig(): RoleConfig | null {
  try {
    const data = localStorage.getItem(ROLE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveRoleConfig(config: RoleConfig) {
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(config));
}

function App() {
  const [currentPage, setCurrentPage] = useState('p0');
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(loadRoleConfig);
  const { state, updateState, githubConnected, syncStatus, syncFromGitHub, configureGitHub } =
    useAppState();

  const handleConfigureGitHub = async (config: GitHubConfig) => {
    try {
      await configureGitHub(config);
      toast.success('GitHub 连接成功', {
        description: `已连接到 ${config.owner}/${config.repo}`,
      });
    } catch {
      toast.error('GitHub 连接失败', {
        description: '请检查 Token 和仓库信息',
      });
    }
  };

  const handleSync = async () => {
    if (!githubConnected) {
      toast.error('未连接 GitHub', {
        description: '请先配置 GitHub 连接',
      });
      return;
    }
    toast.info('正在同步数据...');
    try {
      await syncFromGitHub();
      toast.success('同步完成');
    } catch {
      toast.error('同步失败');
    }
  };

  const handleRoleSelect = (config: RoleConfig) => {
    setRoleConfig(config);
    saveRoleConfig(config);
    toast.success(`身份已设置为：${config.label}`);
  };

  const renderPage = () => {
    // 如果没选角色，显示角色选择
    if (!roleConfig) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">请先选择你的身份</p>
            <p className="text-sm">点击左上角的角色按钮</p>
          </div>
        </div>
      );
    }

    const props = {
      data: state,
      updateData: updateState,
      roleConfig,
    };

    switch (currentPage) {
      case 'p0':
        return <P0TodoPanel {...props} />;
      case 'p1':
        return <P1QuoteCalculator {...props} />;
      case 'p2':
        return <P2CustomerRadar {...props} />;
      case 'p3':
        return <P3SrmMonitor {...props} />;
      case 'p4':
        return <P4WeeklyAnalysis {...props} />;
      case 'p5':
        return <P5RouteOptimizer {...props} />;
      default:
        return <P0TodoPanel {...props} />;
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        githubConnected={githubConnected}
        syncStatus={syncStatus}
        onConfigureGitHub={handleConfigureGitHub}
        onSync={handleSync}
        roleSelector={
          <RoleSelector onSelect={handleRoleSelect} currentConfig={roleConfig} />
        }
      >
        {renderPage()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}

export default App;

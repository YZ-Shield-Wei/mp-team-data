import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { P0TodoPanel } from '@/pages/P0TodoPanel';
import { P1QuoteCalculator } from '@/pages/P1QuoteCalculator';
import { P2CustomerRadar } from '@/pages/P2CustomerRadar';
import { P3SrmMonitor } from '@/pages/P3SrmMonitor';
import { P4WeeklyAnalysis } from '@/pages/P4WeeklyAnalysis';
import { P5RouteOptimizer } from '@/pages/P5RouteOptimizer';
import { useAppState } from '@/hooks/useAppState';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { GitHubConfig } from '@/types';

function App() {
  const [currentPage, setCurrentPage] = useState('p0');
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

  const renderPage = () => {
    const props = {
      data: state,
      updateData: updateState,
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
      >
        {renderPage()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}

export default App;

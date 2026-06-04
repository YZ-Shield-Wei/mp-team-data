import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { GitHubConfig } from '@/types';

interface Props {
  onSave: (config: GitHubConfig) => void;
  connected: boolean;
}

// 默认团队仓库配置（共享数据源）
const DEFAULT_OWNER = 'YZ-Shield-Wei';
const DEFAULT_REPO = 'mp-team-data';
const DEFAULT_BRANCH = 'main';

export function GitHubConfigModal({ onSave, connected }: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState(DEFAULT_OWNER);
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleTestAndSave = async () => {
    if (!token || !owner || !repo) {
      setError('请填写所有必填项');
      return;
    }

    setTesting(true);
    setError('');

    try {
      const config: GitHubConfig = { token, owner, repo, branch };
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        onSave(config);
        setOpen(false);
        setError('');
      } else {
        const data = await response.json();
        setError(`验证失败: ${data.message ?? '请检查配置信息'}`);
      }
    } catch {
      setError('网络错误，请检查网络连接');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={connected ? 'outline' : 'default'}
          size="sm"
          className={connected ? 'border-green-500 text-green-600' : ''}
        >
          {connected ? 'GitHub 已连接' : '连接 GitHub'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>配置 GitHub 数据同步</DialogTitle>
          <DialogDescription>
            输入你的 GitHub Token 即可连接团队共享数据仓库。仓库地址已预填，无需修改。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {connected && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              当前已连接，可修改配置或更换仓库。
            </div>
          )}

          {/* 团队仓库信息（只读展示） */}
          <div className="rounded-md bg-slate-50 p-3 space-y-2">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">团队共享仓库</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Owner:</span>
              <span className="font-medium text-slate-700">{DEFAULT_OWNER}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Repo:</span>
              <span className="font-medium text-slate-700">{DEFAULT_REPO}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Branch:</span>
              <span className="font-medium text-slate-700">{DEFAULT_BRANCH}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">
              你的 GitHub Personal Access Token
              <span className="text-red-500"> *</span>
            </Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              在 GitHub Settings → Developer settings → Personal access tokens 中生成，需勾选
              repo 权限。向苏申请团队 Token。
            </p>
          </div>

          {/* 高级设置（默认折叠） */}
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-600">
              高级：修改仓库地址（一般不需要）
            </summary>
            <div className="mt-2 space-y-2">
              <Input
                id="owner"
                placeholder="Owner"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="text-xs"
              />
              <Input
                id="repo"
                placeholder="Repository"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                className="text-xs"
              />
              <Input
                id="branch"
                placeholder="Branch"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="text-xs"
              />
            </div>
          </details>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleTestAndSave} disabled={testing}>
            {testing ? '验证中...' : '验证并保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

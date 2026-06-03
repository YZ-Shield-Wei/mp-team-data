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

export function GitHubConfigModal({ onSave, connected }: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
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
            请输入 GitHub 个人访问令牌（PAT）和仓库信息，用于团队数据同步。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {connected && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              当前已连接，可修改配置或更换仓库。
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="token">
              GitHub Personal Access Token
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
              repo 权限
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">
              仓库所有者（Owner）
              <span className="text-red-500"> *</span>
            </Label>
            <Input
              id="owner"
              placeholder="例如: your-username"
              value={owner}
              onChange={e => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo">
              仓库名称（Repository）
              <span className="text-red-500"> *</span>
            </Label>
            <Input
              id="repo"
              placeholder="例如: mp-team-data"
              value={repo}
              onChange={e => setRepo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">分支名称（Branch）</Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={e => setBranch(e.target.value)}
            />
          </div>

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

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, UserCheck, Users, Crown } from 'lucide-react';
import type { UserRole, Owner, RoleConfig } from '@/types';
import { OWNERS, ROLE_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

const OWNER_ROLE_MAP: Record<string, UserRole> = {
  苏: 'master',
  褚玮: 'manager',
  沈忆: 'manager',
  王成: 'member',
  张璐: 'member',
  雷洪: 'member',
  杨尚达: 'member',
};

interface Props {
  onSelect: (config: RoleConfig) => void;
  currentConfig?: RoleConfig | null;
}

export function RoleSelector({ onSelect, currentConfig }: Props) {
  const [open, setOpen] = useState(!currentConfig);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentConfig?.role ?? 'master');
  const [selectedOwner, setSelectedOwner] = useState<Owner>(currentConfig?.owner ?? '苏');

  useEffect(() => {
    if (!currentConfig) {
      setOpen(true);
    }
  }, [currentConfig]);

  const handleConfirm = () => {
    const config: RoleConfig = {
      role: selectedRole,
      owner: selectedOwner,
      label: `${selectedOwner} (${ROLE_CONFIG[selectedRole].label})`,
    };
    onSelect(config);
    setOpen(false);
  };

  const handleChange = () => {
    setOpen(true);
  };

  const handleOwnerChange = (owner: Owner) => {
    setSelectedOwner(owner);
    // 自动匹配角色
    const matchedRole = OWNER_ROLE_MAP[owner] ?? 'member';
    setSelectedRole(matchedRole);
  };

  return (
    <>
      {currentConfig && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChange}
          className="flex items-center gap-1.5 text-xs"
        >
          {currentConfig.role === 'master' && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
          {currentConfig.role === 'manager' && (
            <Shield className="w-3.5 h-3.5 text-blue-500" />
          )}
          {currentConfig.role === 'member' && <UserCheck className="w-3.5 h-3.5 text-slate-500" />}
          <span>{currentConfig.label}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              选择你的身份
            </DialogTitle>
            <DialogDescription>
              选择后系统会根据你的角色显示对应的功能权限
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 选择姓名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">你是谁？</label>
              <Select value={selectedOwner} onValueChange={v => handleOwnerChange(v as Owner)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择你的名字" />
                </SelectTrigger>
                <SelectContent>
                  {OWNERS.map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                      <span className="ml-2 text-xs text-slate-400">
                        ({ROLE_CONFIG[OWNER_ROLE_MAP[o] ?? 'member'].label})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 角色确认 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">角色确认</label>
              <div className="grid grid-cols-3 gap-2">
                {(['master', 'manager', 'member'] as UserRole[]).map(r => {
                  const config = ROLE_CONFIG[r];
                  const isActive = selectedRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={cn(
                        'p-3 rounded-lg border-2 text-center transition-all',
                        isActive
                          ? r === 'master'
                            ? 'border-yellow-400 bg-yellow-50'
                            : r === 'manager'
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-slate-300 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="text-lg mb-1">
                        {r === 'master' && <Crown className="w-5 h-5 mx-auto text-yellow-500" />}
                        {r === 'manager' && <Shield className="w-5 h-5 mx-auto text-blue-500" />}
                        {r === 'member' && <UserCheck className="w-5 h-5 mx-auto text-slate-500" />}
                      </div>
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{config.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 权限预览 */}
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
              <div className="font-medium text-slate-700 mb-2">你的权限：</div>
              {selectedRole === 'master' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 查看和管理所有人待办
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 发布任务给任何人
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 查看三人周报交叉分析
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 修改系统设置
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 导出团队 Top5 报告
                  </div>
                </>
              )}
              {selectedRole === 'manager' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 查看自己和团队待办
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 编辑自己负责的客户
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 提交和查看周报分析
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400">✗</span> 不能修改系统设置
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400">✗</span> 不能发布他人任务
                  </div>
                </>
              )}
              {selectedRole === 'member' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 查看自己的待办
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> 更新自己负责的客户
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400">✗</span> 不能查看他人数据
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400">✗</span> 不能提交周报分析
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400">✗</span> 不能修改系统设置
                  </div>
                </>
              )}
            </div>
          </div>

          <Button onClick={handleConfirm} className="w-full">
            确认身份
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

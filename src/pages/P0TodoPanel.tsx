import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardList,
  Plus,
  Search,
  Download,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { TodoItem, Owner, Priority, PageProps } from '@/types';
import { OWNERS, canAssignOthers, canDeleteTodo, canViewAllTodos, canExportTop5 } from '@/types';
import { calculateTodoStatus, getTimeRemaining, formatDate } from '@/utils/local-storage';
import { cn } from '@/lib/utils';

export function P0TodoPanel({ data, updateData, roleConfig }: PageProps) {
  const { role, owner: currentOwner } = roleConfig;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTop5Dialog, setShowTop5Dialog] = useState(false);

  // 新待办表单
  const [newTodo, setNewTodo] = useState<Partial<TodoItem>>({
    priority: 'P1',
    owner: currentOwner,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // 可分配的负责人列表
  const assignableOwners = useMemo(() => {
    if (canAssignOthers(role)) return OWNERS;
    return [currentOwner] as Owner[];
  }, [role, currentOwner]);

  // 计算统计数据
  const stats = useMemo(() => {
    const todos = data.todos;
    return {
      total: todos.length,
      overdue: todos.filter(t => calculateTodoStatus(t.deadline) === 'overdue').length,
      urgent: todos.filter(t => calculateTodoStatus(t.deadline) === 'urgent').length,
      week: todos.filter(t => calculateTodoStatus(t.deadline) === 'week').length,
      normal: todos.filter(t => calculateTodoStatus(t.deadline) === 'normal').length,
    };
  }, [data.todos]);

  // 根据角色过滤可见待办
  const visibleTodos = useMemo(() => {
    if (canViewAllTodos(role)) return data.todos;
    return data.todos.filter(t => t.owner === currentOwner);
  }, [data.todos, role, currentOwner]);

  // 筛选和排序待办
  const filteredTodos = useMemo(() => {
    let todos = [...visibleTodos];

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      todos = todos.filter(
        t =>
          t.title.toLowerCase().includes(term) ||
          t.customer.toLowerCase().includes(term) ||
          t.note.toLowerCase().includes(term)
      );
    }

    // 负责人过滤（仅Master可见全部）
    if (filterOwner !== 'all') {
      todos = todos.filter(t => t.owner === filterOwner);
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      todos = todos.filter(t => calculateTodoStatus(t.deadline) === filterStatus);
    }

    // 优先级过滤
    if (filterPriority !== 'all') {
      todos = todos.filter(t => t.priority === filterPriority);
    }

    // 按截止时间排序（紧急的先）
    return todos.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [data.todos, searchTerm, filterOwner, filterStatus, filterPriority]);

  // Top5 待办
  const top5Todos = useMemo(() => {
    return [...visibleTodos]
      .filter(t => calculateTodoStatus(t.deadline) !== 'normal')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [data.todos]);

  // 添加待办
  const handleAddTodo = async () => {
    if (!newTodo.title || !newTodo.deadline) return;

    const todo: TodoItem = {
      id: Date.now(),
      title: newTodo.title,
      customer: newTodo.customer ?? '',
      owner: (newTodo.owner as Owner) ?? '苏',
      priority: (newTodo.priority as Priority) ?? 'P1',
      deadline: new Date(newTodo.deadline).toISOString(),
      note: newTodo.note ?? '',
      status: calculateTodoStatus(new Date(newTodo.deadline).toISOString()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateData(prev => ({
      ...prev,
      todos: [todo, ...prev.todos],
    }));

    setNewTodo({
      priority: 'P1',
      owner: '苏',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowAddDialog(false);
  };

  // 删除待办
  const handleDeleteTodo = async (id: number) => {
    await updateData(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== id),
    }));
  };

  // 导出 Top5
  const exportTop5 = () => {
    const lines = top5Todos.map((t, i) => {
      const { text } = getTimeRemaining(t.deadline);
      return `${i + 1}. [${t.priority}] ${t.title}\n   客户: ${t.customer} | 负责人: ${t.owner} | 截止: ${formatDate(t.deadline)} | 剩余: ${text}\n   备注: ${t.note}`;
    });

    const text = `【今日 Top5 紧急待办】\n${new Date().toLocaleDateString('zh-CN')}\n\n${lines.join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setShowTop5Dialog(true);
  };

  // 状态颜色
  function getStatusColor(deadline: string): {
    bg: string;
    text: string;
    label: string;
    icon: React.ElementType;
  } {
    const status = calculateTodoStatus(deadline);
    switch (status) {
      case 'overdue':
        return {
          bg: 'bg-red-100 text-red-700 border-red-300',
          text: 'text-red-600',
          label: '已超期',
          icon: AlertTriangle,
        };
      case 'urgent':
        return {
          bg: 'bg-orange-100 text-orange-700 border-orange-300',
          text: 'text-orange-600',
          label: '24h内',
          icon: Clock,
        };
      case 'week':
        return {
          bg: 'bg-blue-100 text-blue-700 border-blue-300',
          text: 'text-blue-600',
          label: '本周',
          icon: AlertCircle,
        };
      default:
        return {
          bg: 'bg-green-100 text-green-700 border-green-300',
          text: 'text-green-600',
          label: '正常',
          icon: CheckCircle2,
        };
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-slate-500 mb-1">活跃待办</div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-red-500 mb-1">已超期</div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-orange-500 mb-1">24h内</div>
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-blue-500 mb-1">本周</div>
            <div className="text-2xl font-bold text-blue-600">{stats.week}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-green-500 mb-1">正常</div>
            <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索事项、客户、备注..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部负责人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {canViewAllTodos(role) ? '全部负责人' : currentOwner}
                </SelectItem>
                {(canViewAllTodos(role) ? OWNERS : [currentOwner]).map(o => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="overdue">已超期</SelectItem>
                <SelectItem value="urgent">24h内</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="P0">P0 紧急</SelectItem>
                <SelectItem value="P1">P1 重要</SelectItem>
                <SelectItem value="P2">P2 常规</SelectItem>
              </SelectContent>
            </Select>

            {canExportTop5(role) && (
              <Button variant="outline" size="sm" onClick={exportTop5}>
                <Download className="w-4 h-4 mr-1" />
                Top5
              </Button>
            )}

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  新增待办
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>新增待办事项</DialogTitle>
                  <DialogDescription>快速记录待办，拜访现场也可即时添加</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>
                      事项内容 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="例如：东莞匠运ALS-040ARN报价确认"
                      value={newTodo.title ?? ''}
                      onChange={e => setNewTodo({ ...newTodo, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>客户</Label>
                      <Input
                        placeholder="客户名称"
                        value={newTodo.customer ?? ''}
                        onChange={e => setNewTodo({ ...newTodo, customer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        负责人 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newTodo.owner}
                        onValueChange={v => setNewTodo({ ...newTodo, owner: v as Owner })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableOwners.map(o => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>优先级</Label>
                      <Select
                        value={newTodo.priority}
                        onValueChange={v => setNewTodo({ ...newTodo, priority: v as Priority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P0">P0 紧急</SelectItem>
                          <SelectItem value="P1">P1 重要</SelectItem>
                          <SelectItem value="P2">P2 常规</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        截止时间 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="datetime-local"
                        value={newTodo.deadline ?? ''}
                        onChange={e => setNewTodo({ ...newTodo, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>备注</Label>
                    <Textarea
                      placeholder="补充说明..."
                      value={newTodo.note ?? ''}
                      onChange={e => setNewTodo({ ...newTodo, note: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddTodo} disabled={!newTodo.title || !newTodo.deadline}>
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Todo List */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            待办列表（{filteredTodos.length} 项）
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[60px]">
                    优先级
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500">事项内容</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[100px]">
                    客户
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[70px]">
                    负责人
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[80px]">
                    截止
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[80px]">
                    剩余
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[80px]">
                    状态
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500 w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTodos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      暂无待办事项，点击"新增待办"添加
                    </td>
                  </tr>
                ) : (
                  filteredTodos.map(todo => {
                    const statusStyle = getStatusColor(todo.deadline);
                    const { text } = getTimeRemaining(todo.deadline);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <tr
                        key={todo.id}
                        className={cn(
                          'hover:bg-slate-50/50 transition-colors',
                          calculateTodoStatus(todo.deadline) === 'overdue' && 'bg-red-50/30'
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              todo.priority === 'P0' && 'border-red-300 text-red-600',
                              todo.priority === 'P1' && 'border-orange-300 text-orange-600',
                              todo.priority === 'P2' && 'border-slate-300 text-slate-500'
                            )}
                          >
                            {todo.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800">{todo.title}</div>
                          {todo.note && (
                            <div className="text-xs text-slate-400 mt-0.5">{todo.note}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{todo.customer || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{todo.owner}</td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(todo.deadline)}</td>
                        <td className={cn('px-4 py-2.5 font-medium', statusStyle.text)}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3.5 h-3.5" />
                            {text}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn('text-xs', statusStyle.bg)}>
                            {statusStyle.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {canDeleteTodo(todo, role, currentOwner) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                              onClick={() => handleDeleteTodo(todo.id)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top5 Export Dialog */}
      <Dialog open={showTop5Dialog} onOpenChange={setShowTop5Dialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Top5 已复制</DialogTitle>
            <DialogDescription>今日 Top5 紧急待办已复制到剪贴板，可直接粘贴到微信群</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {top5Todos.length === 0 ? (
              <p className="text-sm text-slate-400">暂无紧急待办</p>
            ) : (
              top5Todos.map((t, i) => (
                <div key={t.id} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-400">{i + 1}.</span>
                  <div>
                    <span className="font-medium">{t.title}</span>
                    <span className="text-slate-400 ml-2">
                      {t.customer} | {t.owner}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTop5Dialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

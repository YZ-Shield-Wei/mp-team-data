import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MonitorSmartphone,
  Upload,
  Image,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Plus,
} from 'lucide-react';
import type { AppState, SrmOrder, TodoItem } from '@/types';
import { generateId, calculateTodoStatus } from '@/utils/local-storage';
import { cn } from '@/lib/utils';

interface Props {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

// SRM 监控工作流步骤
const workflowSteps = [
  { step: 1, title: '登录SRM', desc: '打开SRM系统并登录' },
  { step: 2, title: '截取订单页', desc: '截图当前订单列表页面' },
  { step: 3, title: '上传截图', desc: '将截图上传到此工具' },
  { step: 4, title: 'AI解析', desc: '系统自动解析订单信息' },
  { step: 5, title: '比对历史', desc: '与上次监控结果比对差异' },
  { step: 6, title: '生成待办', desc: '发现变更自动生成待办' },
];

export function P3SrmMonitor({ data, updateData }: Props) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [parsingResult, setParsingResult] = useState<SrmOrder[] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<SrmOrder>>({
    priority: 'P1',
    status: '交期协调中',
  });

  // 模拟解析截图
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const result = event.target?.result as string;
        setUploadedImage(result);

        // 模拟解析结果（实际部署需要 OCR）
        const mockParsed: SrmOrder[] = [
          {
            id: generateId(),
            customer: '厚道数控',
            product: 'SFC系列',
            quantity: '800台',
            status: '交期协调中',
            priority: 'P1',
            note: '已协调400台发出 | 新增: 200台待确认',
            lastChecked: new Date().toISOString(),
          },
          {
            id: generateId(),
            customer: '青岛宝丽金',
            product: 'SFC-050SA2',
            quantity: '样品',
            status: '样品制作中',
            priority: 'P0',
            note: '6月青岛机床展用 | 状态: 无变化',
            lastChecked: new Date().toISOString(),
          },
          {
            id: generateId(),
            customer: '广东捷程数控',
            product: 'SFC系列',
            quantity: '300个',
            status: '交期紧急',
            priority: 'P0',
            note: '已下单4.2万元 | 变更: 交期提前3天',
            lastChecked: new Date().toISOString(),
          },
        ];

        setTimeout(() => {
          setParsingResult(mockParsed);
        }, 1500);
      };
      reader.readAsDataURL(file);
    },
    [data.srmOrders]
  );

  // 将解析结果生成待办
  const handleGenerateTodos = async () => {
    if (!parsingResult) return;

    const newTodos: TodoItem[] = parsingResult
      .filter(p => p.note.includes('新增') || p.note.includes('变更'))
      .map(p => ({
        id: Date.now() + Math.random(),
        title: `SRM订单变更: ${p.customer} ${p.product}`,
        customer: p.customer,
        owner: '苏',
        priority: p.priority as 'P0' | 'P1' | 'P2',
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        note: p.note,
        status: calculateTodoStatus(new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (newTodos.length > 0) {
      await updateData(prev => ({
        ...prev,
        todos: [...newTodos, ...prev.todos],
      }));
    }

    // 更新 SRM 订单
    await updateData(prev => {
      const updated = [...prev.srmOrders];
      parsingResult.forEach(parsed => {
        const idx = updated.findIndex(o => o.customer === parsed.customer && o.product === parsed.product);
        if (idx >= 0) {
          updated[idx] = { ...parsed, id: updated[idx].id };
        } else {
          updated.push(parsed);
        }
      });
      return { ...prev, srmOrders: updated };
    });

    setParsingResult(null);
    setUploadedImage(null);
  };

  // 手动添加追踪订单
  const handleAddOrder = async () => {
    if (!newOrder.customer || !newOrder.product) return;

    const order: SrmOrder = {
      id: generateId(),
      customer: newOrder.customer,
      product: newOrder.product,
      quantity: newOrder.quantity || '待确认',
      status: newOrder.status || '待监控',
      priority: (newOrder.priority as 'P0' | 'P1' | 'P2') || 'P1',
      note: newOrder.note || '',
      lastChecked: new Date().toISOString(),
    };

    await updateData(prev => ({
      ...prev,
      srmOrders: [order, ...prev.srmOrders],
    }));

    setNewOrder({ priority: 'P1', status: '交期协调中' });
    setShowAddDialog(false);
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    if (status.includes('紧急')) return { bg: 'bg-red-50 border-red-300', text: 'text-red-600', icon: AlertTriangle };
    if (status.includes('协调') || status.includes('制作')) return { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-600', icon: Clock };
    return { bg: 'bg-green-50 border-green-300', text: 'text-green-600', icon: CheckCircle2 };
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Workflow Steps */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4" />
            SRM 监控工作流（6步）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workflowSteps.map((step, idx) => (
              <div key={step.step} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">{step.title}</span>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload & Parse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              上传 SRM 截图
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                uploadedImage
                  ? 'border-blue-300 bg-blue-50/30'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              )}
            >
              {uploadedImage ? (
                <div className="space-y-3">
                  <img
                    src={uploadedImage}
                    alt="SRM Screenshot"
                    className="max-h-[200px] mx-auto rounded border"
                  />
                  <p className="text-sm text-blue-600">截图已上传，正在解析...</p>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Image className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">点击或拖拽上传 SRM 截图</p>
                  <p className="text-xs text-slate-400 mt-1">支持 PNG、JPG 格式</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            {parsingResult && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">解析结果</h4>
                {parsingResult.map((result, idx) => {
                  const style = getStatusStyle(result.status);
                  const Icon = style.icon;
                  return (
                    <div
                      key={idx}
                      className={cn('p-3 rounded-lg border', style.bg)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn('w-4 h-4', style.text)} />
                        <span className={cn('font-medium text-sm', style.text)}>
                          {result.customer} - {result.product}
                        </span>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        数量: {result.quantity} | {result.note}
                      </p>
                    </div>
                  );
                })}
                <Button onClick={handleGenerateTodos} className="w-full">
                  <FileText className="w-4 h-4 mr-1" />
                  生成待办并同步到 P0 面板
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracked Orders */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4" />
              重点追踪订单
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              添加
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">客户</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">产品</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">状态</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.srmOrders.map(order => {
                    const style = getStatusStyle(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-700">{order.customer}</td>
                        <td className="px-3 py-2 text-slate-600">{order.product}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', style.bg, style.text)}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{order.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Order Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>添加追踪订单</DialogTitle>
            <DialogDescription>手动添加需要重点监控的 SRM 订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">客户名称</label>
              <Input
                value={newOrder.customer ?? ''}
                onChange={e => setNewOrder({ ...newOrder, customer: e.target.value })}
                placeholder="输入客户名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">产品</label>
              <Input
                value={newOrder.product ?? ''}
                onChange={e => setNewOrder({ ...newOrder, product: e.target.value })}
                placeholder="输入产品型号"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数量</label>
              <Input
                value={newOrder.quantity ?? ''}
                onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })}
                placeholder="例如: 800台"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Input
                value={newOrder.status ?? ''}
                onChange={e => setNewOrder({ ...newOrder, status: e.target.value })}
                placeholder="例如: 交期协调中"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Textarea
                value={newOrder.note ?? ''}
                onChange={e => setNewOrder({ ...newOrder, note: e.target.value })}
                placeholder="补充说明..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddOrder} disabled={!newOrder.customer || !newOrder.product}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

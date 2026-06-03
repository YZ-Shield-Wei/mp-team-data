import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Flame,
  Snowflake,
  Thermometer,
  UserRound,
  MapPin,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { AppState, Customer, CustomerTag, HeatLevel } from '@/types';
import { OWNERS } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

const ALL_TAGS: CustomerTag[] = [
  '替换窗口期',
  '价格敏感',
  '待报价',
  '样品测试中',
  '人事变动',
  '稳定合作',
  '订单增长',
  '半导体',
  '交期敏感',
  '日系偏好',
  '新能源',
  '交期协调',
  '样品问题',
  '大项目',
  '样品交付',
  '展会',
  '确度80%',
  '交期冲突',
  '已下单',
  '稳定客户',
  '库存紧张',
  '出口',
  '讲习会',
  '订单火爆',
  '交期延误风险',
  '研发阶段',
  '待确认参数',
  '待尺寸',
  '待终端确认',
  '定期跟进',
  '待领导沟通',
  '短期难切入',
  '利润率不足',
  '暂时对应难',
];

function getHeatConfig(level: HeatLevel) {
  switch (level) {
    case 'high':
      return {
        icon: Flame,
        color: 'text-red-500',
        bg: 'bg-red-50 border-red-300',
        label: '高热',
        range: '≥80分',
      };
    case 'warm':
      return {
        icon: Thermometer,
        color: 'text-orange-500',
        bg: 'bg-orange-50 border-orange-300',
        label: '温热',
        range: '60-79分',
      };
    case 'cold':
      return {
        icon: Snowflake,
        color: 'text-blue-500',
        bg: 'bg-blue-50 border-blue-300',
        label: '低温',
        range: '40-59分',
      };
    case 'sleeping':
      return {
        icon: Clock,
        color: 'text-slate-400',
        bg: 'bg-slate-50 border-slate-300',
        label: '沉睡',
        range: '<40分',
      };
  }
}

export function P2CustomerRadar({ data }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterHeat, setFilterHeat] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // 筛选客户
  const filteredCustomers = useMemo(() => {
    let customers = [...data.customers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      customers = customers.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.region.toLowerCase().includes(term) ||
          c.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    if (filterTags.length > 0) {
      customers = customers.filter(c => filterTags.some(tag => c.tags.includes(tag as CustomerTag)));
    }

    if (filterOwner !== 'all') {
      customers = customers.filter(c => c.owner === filterOwner);
    }

    if (filterHeat !== 'all') {
      customers = customers.filter(c => c.heatLevel === filterHeat);
    }

    return customers.sort((a, b) => b.score - a.score);
  }, [data.customers, searchTerm, filterTags, filterOwner, filterHeat]);

  // 热度统计
  const heatStats = useMemo(() => {
    return {
      high: data.customers.filter(c => c.heatLevel === 'high').length,
      warm: data.customers.filter(c => c.heatLevel === 'warm').length,
      cold: data.customers.filter(c => c.heatLevel === 'cold').length,
      sleeping: data.customers.filter(c => c.heatLevel === 'sleeping').length,
    };
  }, [data.customers]);

  const toggleTag = (tag: string) => {
    setFilterTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetail(true);
  };

  // 评分维度说明
  const scoreDimensions = [
    { name: '拜访频次', weight: 20, desc: '最近拜访时间' },
    { name: '意向度', weight: 25, desc: '客户明确表达的需求' },
    { name: '预算规模', weight: 20, desc: '年用量/订单金额' },
    { name: '竞品替代窗口期', weight: 20, desc: '现有竞品问题/合同到期' },
    { name: '人事变动', weight: 15, desc: '关键决策人变化' },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Heat Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">高热客户</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{heatStats.high}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-500">温热客户</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{heatStats.warm}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Snowflake className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-500">低温客户</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{heatStats.cold}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">沉睡客户</span>
            </div>
            <div className="text-2xl font-bold text-slate-500">{heatStats.sleeping}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="搜索客户名、区域、标签..."
              className="max-w-[240px]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            <div className="flex gap-1">
              {OWNERS.map(o => (
                <Button
                  key={o}
                  variant={filterOwner === o ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={() => setFilterOwner(filterOwner === o ? 'all' : o)}
                >
                  {o}
                </Button>
              ))}
            </div>

            <div className="flex gap-1">
              {(['all', 'high', 'warm', 'cold', 'sleeping'] as const).map(h => {
                const config = h === 'all' ? null : getHeatConfig(h);
                return (
                  <Button
                    key={h}
                    variant={filterHeat === h ? 'default' : 'outline'}
                    size="sm"
                    className={cn('text-xs h-8 px-2', config?.color)}
                    onClick={() => setFilterHeat(h)}
                  >
                    {h === 'all' ? '全部' : config?.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-[10px]',
                  filterTags.includes(tag) && 'bg-blue-600'
                )}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredCustomers.map(customer => {
          const config = getHeatConfig(customer.heatLevel);
          const Icon = config.icon;

          return (
            <Card
              key={customer.id}
              className={cn('border-2 cursor-pointer hover:shadow-md transition-shadow', config.bg)}
              onClick={() => openDetail(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{customer.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {customer.region}
                      <span className="mx-1">|</span>
                      <UserRound className="w-3 h-3" />
                      {customer.owner}
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1', config.color)}>
                    <Icon className="w-4 h-4" />
                    <span className="text-lg font-bold">{customer.score}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {customer.tags.slice(0, 4).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                  {customer.tags.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{customer.tags.length - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    年用量: {customer.annualVolume}
                  </span>
                  {customer.nextAction && (
                    <span className="text-slate-500 truncate max-w-[180px]">
                      下一步: {customer.nextAction}
                    </span>
                  )}
                </div>

                {/* 沉睡客户唤醒提示 */}
                {customer.heatLevel === 'sleeping' && customer.tags.includes('人事变动') && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    该客户近期有人事变动，建议重新接触
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedCustomer.name}
                  {(() => {
                    const config = getHeatConfig(selectedCustomer.heatLevel);
                    const Icon = config.icon;
                    return (
                      <span className={cn('flex items-center gap-1 text-sm', config.color)}>
                        <Icon className="w-4 h-4" />
                        {selectedCustomer.score}分
                      </span>
                    );
                  })()}
                </DialogTitle>
                <DialogDescription>
                  {selectedCustomer.region} | 负责人: {selectedCustomer.owner} | 年用量:{''}
                  {selectedCustomer.annualVolume}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {selectedCustomer.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Score Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-2">评分维度</h4>
                  <div className="space-y-2">
                    {scoreDimensions.map(dim => (
                      <div key={dim.name} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28">{dim.name}</span>
                        <span className="text-xs text-slate-400 w-10">{dim.weight}%</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.random() * 40 + 60}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Action */}
                {selectedCustomer.nextAction && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 mb-1">下一步行动</h4>
                    <p className="text-sm text-blue-600">{selectedCustomer.nextAction}</p>
                  </div>
                )}

                {/* Visit History */}
                <div>
                  <h4 className="text-sm font-medium mb-2">拜访历史</h4>
                  {selectedCustomer.visitHistory.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无拜访记录</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.visitHistory.map(v => (
                        <div key={v.id} className="text-xs p-2 bg-slate-50 rounded">
                          <div className="font-medium">{v.date}</div>
                          <div className="text-slate-600">{v.content}</div>
                          <div className="text-slate-400">结果: {v.outcome}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

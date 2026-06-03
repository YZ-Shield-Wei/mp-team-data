import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Route,
  MapPin,
  Clock,
  Car,
  Flame,
  Snowflake,
  Thermometer,
  Calendar,
  Users,
  Check,
} from 'lucide-react';
import type { AppState, RoutePlan, RouteStop, Customer } from '@/types';
import { generateId } from '@/utils/local-storage';
import { cn } from '@/lib/utils';

interface Props {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

// 6月3日东莞实战案例
const dongguanCase: RoutePlan = {
  id: 'case-dongguan-0603',
  date: '2026-06-03',
  region: '东莞',
  stops: [
    {
      sequence: 1,
      customerId: 'cg1',
      customerName: '东莞匠运精密',
      address: '东莞市长安镇',
      time: '09:30-10:30',
      distance: '-',
      duration: '-',
      priority: 'P0',
      talkingPoints: ['ALS-040ARN报价确认', '样品测试反馈'],
    },
    {
      sequence: 2,
      customerId: 'cg2',
      customerName: '东莞众鑫精密',
      address: '东莞市虎门镇',
      time: '11:00-12:20',
      distance: '15km / 25min',
      duration: '25分钟',
      priority: 'P0',
      talkingPoints: ['ALS-055ARN型号确认', '批量订单意向'],
    },
    {
      sequence: 3,
      customerId: 'lunch',
      customerName: '午餐/休息',
      address: '东莞市区',
      time: '12:30-13:30',
      distance: '8km / 15min',
      duration: '15分钟',
      priority: 'P0',
      talkingPoints: [],
    },
    {
      sequence: 4,
      customerId: 'cg3',
      customerName: '广东捷程数控',
      address: '东莞市大朗镇',
      time: '14:00-15:00',
      distance: '12km / 20min',
      duration: '20分钟',
      priority: 'P1',
      talkingPoints: ['SFC系列交期协调', '已下单4.2万元跟进'],
    },
    {
      sequence: 5,
      customerId: 'cg4',
      customerName: '广东炜度智能',
      address: '东莞市松山湖',
      time: '15:30-16:30',
      distance: '10km / 18min',
      duration: '18分钟',
      priority: 'P2',
      talkingPoints: ['订单增长确认', '6月交付计划'],
    },
    {
      sequence: 6,
      customerId: 'cg5',
      customerName: '浩达（会通代理）',
      address: '东莞市塘厦镇',
      time: '17:00-18:00',
      distance: '20km / 30min',
      duration: '30分钟',
      priority: 'P1',
      talkingPoints: ['库存状况确认', '出口订单安排'],
    },
  ],
  totalDistance: '65km',
  totalDrivingTime: '约2小时',
  createdAt: '2026-06-03T18:30:00',
};

function getHeatIcon(level: Customer['heatLevel']) {
  switch (level) {
    case 'high':
      return <Flame className="w-3.5 h-3.5 text-red-500" />;
    case 'warm':
      return <Thermometer className="w-3.5 h-3.5 text-orange-500" />;
    case 'cold':
      return <Snowflake className="w-3.5 h-3.5 text-blue-500" />;
    default:
      return <Snowflake className="w-3.5 h-3.5 text-slate-400" />;
  }
}

export function P5RouteOptimizer({ data }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxVisits, setMaxVisits] = useState(5);
  const [generatedRoute, setGeneratedRoute] = useState<RoutePlan | null>(null);
  const [showCase, setShowCase] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  // 获取所有区域
  const regions = useMemo(() => {
    const regionSet = new Set(data.customers.map(c => c.region));
    return Array.from(regionSet).sort();
  }, [data.customers]);

  // 筛选客户
  const filteredCustomers = useMemo(() => {
    let customers = [...data.customers];
    if (selectedRegion !== 'all') {
      customers = customers.filter(c => c.region === selectedRegion);
    }
    return customers.sort((a, b) => b.score - a.score);
  }, [data.customers, selectedRegion]);

  // 生成路线
  const handleGenerateRoute = () => {
    const selected = filteredCustomers.filter(c => selectedCustomers.has(c.id));
    if (selected.length === 0) return;

    const stops: RouteStop[] = selected.slice(0, maxVisits).map((c, idx) => ({
      sequence: idx + 1,
      customerId: c.id,
      customerName: c.name,
      address: c.address || `${c.region}`,
      time: `${9 + idx}:00-${9 + idx}:50`,
      distance: idx === 0 ? '-' : '约XXkm / XXmin',
      duration: idx === 0 ? '-' : '约XX分钟',
      priority: c.score >= 80 ? 'P0' : c.score >= 60 ? 'P1' : 'P2',
      talkingPoints: c.nextAction ? [c.nextAction] : ['确认需求', '跟进进度'],
    }));

    const route: RoutePlan = {
      id: generateId(),
      date: selectedDate,
      region: selectedRegion === 'all' ? '多区域' : selectedRegion,
      stops,
      totalDistance: '计算中...',
      totalDrivingTime: '计算中...',
      createdAt: new Date().toISOString(),
    };

    setGeneratedRoute(route);
    setShowCase(false);
  };

  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const loadCaseStudy = () => {
    setGeneratedRoute(dongguanCase);
    setShowCase(true);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Parameters */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="w-4 h-4" />
            路线规划参数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>目标区域</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部区域</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>拜访日期</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label>每日最大拜访数</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxVisits}
                onChange={e => setMaxVisits(parseInt(e.target.value) || 5)}
                className="w-[100px]"
              />
            </div>

            <Button onClick={handleGenerateRoute} disabled={selectedCustomers.size === 0}>
              <Route className="w-4 h-4 mr-1" />
              生成路线
            </Button>

            <Button variant="outline" onClick={loadCaseStudy}>
              <Calendar className="w-4 h-4 mr-1" />
              加载6/3实战案例
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Selection */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                客户池
                {selectedRegion !== 'all' && `(${selectedRegion})`}
              </span>
              <span className="text-xs text-slate-400">
                已选 {selectedCustomers.size} 家
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">该区域暂无客户</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors',
                        selectedCustomers.has(customer.id) && 'bg-blue-50/50'
                      )}
                      onClick={() => toggleCustomer(customer.id)}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                          selectedCustomers.has(customer.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-slate-300'
                        )}
                      >
                        {selectedCustomers.has(customer.id) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-slate-800">
                            {customer.name}
                          </span>
                          {getHeatIcon(customer.heatLevel)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {customer.region} | {customer.annualVolume} | 热度{customer.score}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          customer.score >= 80
                            ? 'border-red-300 text-red-600'
                            : customer.score >= 60
                              ? 'border-orange-300 text-orange-600'
                              : 'border-slate-300 text-slate-500'
                        )}
                      >
                        {customer.score}分
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Result */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {showCase ? '6月3日东莞实战案例' : '路线规划结果'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedRoute ? (
              <div className="space-y-3">
                {/* Route Summary */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <div className="text-xs text-slate-500">拜访家数</div>
                    <div className="text-lg font-bold text-slate-800">
                      {generatedRoute.stops.filter(s => !s.customerName.includes('午餐')).length}家
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <div className="text-xs text-slate-500">总里程</div>
                    <div className="text-lg font-bold text-slate-800">
                      {generatedRoute.totalDistance}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded text-center">
                    <div className="text-xs text-slate-500">路上时间</div>
                    <div className="text-lg font-bold text-slate-800">
                      {generatedRoute.totalDrivingTime}
                    </div>
                  </div>
                </div>

                {/* Stops Timeline */}
                <div className="space-y-0">
                  {generatedRoute.stops.map((stop, idx) => (
                    <div key={stop.sequence} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                            stop.customerName.includes('午餐')
                              ? 'bg-slate-100 text-slate-500'
                              : stop.priority === 'P0'
                                ? 'bg-red-100 text-red-700'
                                : stop.priority === 'P1'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {stop.sequence}
                        </div>
                        {idx < generatedRoute.stops.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-200 my-1" />
                        )}
                      </div>

                      {/* Stop info */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-slate-800">
                            {stop.customerName}
                          </span>
                          {!stop.customerName.includes('午餐') && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                stop.priority === 'P0' && 'border-red-300 text-red-600',
                                stop.priority === 'P1' && 'border-orange-300 text-orange-600'
                              )}
                            >
                              {stop.priority}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {stop.time}
                          </span>
                          {stop.distance !== '-' && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {stop.distance}
                            </span>
                          )}
                        </div>
                        {stop.talkingPoints.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {stop.talkingPoints.map((point, pidx) => (
                              <span
                                key={pidx}
                                className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Case Study Effect */}
                {showCase && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-700 mb-2">优化效果</h4>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>单日5家客户 + 1代理店</li>
                      <li>总里程65km，路上时间约2小时</li>
                      <li>高热客户覆盖率100%</li>
                      <li className="font-semibold">效率提升约40%</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Route className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-500">暂无路线规划</h3>
                <p className="text-sm text-slate-400 mt-1">
                  选择客户后点击"生成路线"，或查看6/3实战案例
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

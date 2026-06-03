import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Save,
  Clock,
} from 'lucide-react';
import type { AppState, QuoteRecord } from '@/types';
import { PRODUCT_MODELS } from '@/hooks/useAppState';
import { generateId, formatDateTime } from '@/utils/local-storage';
import { cn } from '@/lib/utils';

interface Props {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

export function P1QuoteCalculator({ data, updateData }: Props) {
  const [selectedModel, setSelectedModel] = useState('');
  const [customer, setCustomer] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [quotePrice, setQuotePrice] = useState(0);
  const [competitorPrice, setCompetitorPrice] = useState(0);
  const profitBaseline = data.settings.profitBaseline;

  // 选择型号
  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    const product = PRODUCT_MODELS.find(p => p.model === model);
    if (product) {
      setCostPrice(product.costPrice);
      setQuotePrice(product.suggestedPrice);
    }
  };

  // 计算利润
  const calculation = useMemo(() => {
    if (!quotePrice || !costPrice || !quantity) return null;

    const unitProfit = quotePrice - costPrice;
    const totalProfit = unitProfit * quantity;
    const profitRate = (unitProfit / quotePrice) * 100;
    const taxExcludedPrice = quotePrice / 1.13; // 13% 增值税

    let status: 'danger' | 'warning' | 'pass' = 'pass';
    if (profitRate < profitBaseline * 0.5) {
      status = 'danger';
    } else if (profitRate < profitBaseline) {
      status = 'warning';
    }

    let competitorDiff = 0;
    if (competitorPrice > 0) {
      competitorDiff = ((quotePrice - competitorPrice) / competitorPrice) * 100;
    }

    return {
      unitProfit,
      totalProfit,
      profitRate,
      taxExcludedPrice,
      status,
      competitorDiff,
    };
  }, [quotePrice, costPrice, quantity, competitorPrice, profitBaseline]);

  // 保存报价
  const handleSave = async () => {
    if (!calculation || !selectedModel || !customer) return;

    const record: QuoteRecord = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      customer,
      model: selectedModel,
      quantity,
      costPrice,
      quotePrice,
      profitRate: calculation.profitRate,
      unitProfit: calculation.unitProfit,
      totalProfit: calculation.totalProfit,
      taxExcludedPrice: calculation.taxExcludedPrice,
      competitorPrice: competitorPrice || undefined,
      competitorDiff: competitorPrice ? calculation.competitorDiff : undefined,
      status: calculation.status,
    };

    await updateData(prev => ({
      ...prev,
      quotes: [record, ...prev.quotes.slice(0, 19)], // 保留最近20条
    }));
  };

  // 利润状态显示
  function getProfitStatus(rate: number) {
    if (rate < profitBaseline * 0.5) {
      return {
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-300',
        label: '严重预警',
        icon: AlertTriangle,
        action: '重新议价或放弃',
      };
    }
    if (rate < profitBaseline) {
      return {
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-300',
        label: '利润预警',
        icon: TrendingDown,
        action: '需特批或调整方案',
      };
    }
    return {
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-300',
      label: '利润达标',
      icon: CheckCircle2,
      action: '可推进',
    };
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Calculator */}
        <div className="lg:col-span-2 space-y-4">
          {/* Model Selection */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                型号选择（点击快速填充）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_MODELS.map(product => (
                  <Button
                    key={product.model}
                    variant={selectedModel === product.model ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectModel(product.model)}
                    className={cn(
                      'text-xs',
                      selectedModel === product.model && 'ring-2 ring-blue-300'
                    )}
                  >
                    {product.model}
                    <span className="ml-1 text-[10px] opacity-60">{product.application}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>客户名称</Label>
                  <Input
                    placeholder="输入客户名"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>数量</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>成本价（元/台）</Label>
                  <Input
                    type="number"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>报价（元/台）</Label>
                  <Input
                    type="number"
                    value={quotePrice}
                    onChange={e => setQuotePrice(parseFloat(e.target.value) || 0)}
                    className={cn(
                      calculation &&
                        (calculation.status === 'danger'
                          ? 'border-red-300 focus-visible:ring-red-200'
                          : calculation.status === 'warning'
                            ? 'border-orange-300 focus-visible:ring-orange-200'
                            : 'border-green-300 focus-visible:ring-green-200')
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>竞品价格（元/台，可选）</Label>
                  <Input
                    type="number"
                    placeholder="可选"
                    value={competitorPrice || ''}
                    onChange={e => setCompetitorPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {calculation && (
            <Card
              className={cn(
                'border-2',
                calculation.status === 'danger'
                  ? 'border-red-300 bg-red-50/30'
                  : calculation.status === 'warning'
                    ? 'border-orange-300 bg-orange-50/30'
                    : 'border-green-300 bg-green-50/30'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = getProfitStatus(calculation.profitRate);
                      const Icon = status.icon;
                      return (
                        <>
                          <Icon className={cn('w-5 h-5', status.color)} />
                          <span className={cn('font-semibold', status.color)}>{status.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-slate-500">
                    利润底线: {profitBaseline}% | 建议操作:
                    {getProfitStatus(calculation.profitRate).action}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">实际利润率</div>
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        calculation.status === 'danger'
                          ? 'text-red-600'
                          : calculation.status === 'warning'
                            ? 'text-orange-600'
                            : 'text-green-600'
                      )}
                    >
                      {calculation.profitRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">单台毛利</div>
                    <div className="text-xl font-semibold text-slate-800">
                      ¥{calculation.unitProfit.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">总毛利</div>
                    <div className="text-xl font-semibold text-slate-800">
                      ¥{calculation.totalProfit.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">不含税单价</div>
                    <div className="text-xl font-semibold text-slate-800">
                      ¥{calculation.taxExcludedPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {competitorPrice > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-600">
                      与竞品价差:{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          calculation.competitorDiff > 0 ? 'text-red-500' : 'text-green-500'
                        )}
                      >
                        {calculation.competitorDiff > 0 ? '+' : ''}
                        {calculation.competitorDiff.toFixed(1)}%
                      </span>
                      <span className="text-slate-400 ml-2">
                        {calculation.competitorDiff > 0
                          ? '需评估客户价格敏感度'
                          : '价格竞争力强'}
                      </span>
                    </span>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={!customer}>
                    <Save className="w-4 h-4 mr-1" />
                    保存报价记录
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: History */}
        <div>
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  报价历史（最近20条）
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                {data.quotes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">暂无报价记录</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.quotes.map(q => (
                      <div key={q.id} className="p-3 hover:bg-slate-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{q.customer}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              q.status === 'danger' && 'border-red-300 text-red-600',
                              q.status === 'warning' && 'border-orange-300 text-orange-600',
                              q.status === 'pass' && 'border-green-300 text-green-600'
                            )}
                          >
                            {q.profitRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {q.model} x{q.quantity} | 报价: ¥{q.quotePrice} | 成本: ¥{q.costPrice}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(q.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

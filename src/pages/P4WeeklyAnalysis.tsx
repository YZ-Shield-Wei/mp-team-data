import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Sparkles,
  Users,
  AlertTriangle,
  TrendingUp,
  Share2,
  Zap,
  Download,
} from 'lucide-react';
import type { AppState, WeeklyReport, AnalysisSuggestion, Owner } from '@/types';

import { generateId, getCurrentWeekNumber } from '@/utils/local-storage';
import { cn } from '@/lib/utils';

interface Props {
  data: AppState;
  updateData: (updater: (prev: AppState) => AppState) => Promise<void>;
}

// 预置分析模板
const presetSuggestions: AnalysisSuggestion[] = [
  {
    type: '协同建议',
    title: '半导体设备客户联合技术讲习会',
    trigger: '三人周报均出现"半导体"关键词',
    content: '联合举办「半导体设备精密传动部件技术讲习会」，覆盖产品：联轴器+制动器+直线电机',
    priority: 'P1',
  },
  {
    type: '隐藏商机',
    title: '东莞机床集群TSB产品交叉销售',
    trigger: '苏拜访东莞机床客户 + 褚玮负责TSB直线电机',
    content: '苏在后续拜访中导入TSB产品线，覆盖东莞匠运、众鑫、捷程等客户',
    priority: 'P0',
  },
  {
    type: '风险预警',
    title: 'SFC-050螺栓缺口多客户影响',
    trigger: '三人分别负责的客户均涉及SFC-050',
    content: '联合向日本总部申请紧急调拨，优先保障青岛宝丽金6月展会样品',
    priority: 'P0',
  },
  {
    type: '情报共享',
    title: '代理店协同效应优化',
    trigger: '三人分别通过不同代理店推进',
    content: '建立代理店"红黑榜"，优化渠道资源配置，重点关注会通代理库存',
    priority: 'P1',
  },
];

export function P4WeeklyAnalysis({ data, updateData }: Props) {
  const [activeTab, setActiveTab] = useState<string>('input');
  const [reports, setReports] = useState<Record<string, string>>({
    苏: '',
    褚玮: '',
    沈忆: '',
  });
  const [generatedAnalysis, setGeneratedAnalysis] = useState<AnalysisSuggestion[] | null>(null);

  // 获取当前周的报告
  const currentWeek = getCurrentWeekNumber();
  const weekReports = useMemo(
    () => data.weeklyReports.filter(r => r.weekNumber === currentWeek),
    [data.weeklyReports, currentWeek]
  );

  // 保存单个人的周报
  const handleSaveReport = async (owner: Owner) => {
    const content = reports[owner];
    if (!content.trim()) return;

    const existingIdx = data.weeklyReports.findIndex(
      r => r.owner === owner && r.weekNumber === currentWeek
    );

    const report: WeeklyReport = {
      id: existingIdx >= 0 ? data.weeklyReports[existingIdx].id : generateId(),
      owner,
      weekNumber: currentWeek,
      content,
      submittedAt: new Date().toISOString(),
    };

    await updateData(prev => {
      const updated = [...prev.weeklyReports];
      if (existingIdx >= 0) {
        updated[existingIdx] = report;
      } else {
        updated.push(report);
      }
      return { ...prev, weeklyReports: updated };
    });
  };

  // 关键词提取（简单实现）
  const extractKeywords = (text: string): string[] => {
    const keywords = [
      '半导体',
      'TSB',
      'SFC-050',
      'ALS',
      '东莞',
      '苏州',
      '青岛',
      '浙江',
      '代理',
      '讲习会',
      '样品',
      '报价',
      '交期',
      '人事变动',
      '机床',
    ];
    return keywords.filter(kw => text.includes(kw));
  };

  // 执行交叉分析
  const handleAnalyze = () => {
    const allContent = Object.values(reports).join('\n');
    const keywords = extractKeywords(allContent);

    // 根据关键词匹配预设建议
    const matched = presetSuggestions.filter(s => {
      if (s.trigger.includes('半导体') && keywords.includes('半导体')) return true;
      if (s.trigger.includes('TSB') && allContent.includes('TSB')) return true;
      if (s.trigger.includes('SFC-050') && allContent.includes('SFC-050')) return true;
      if (s.trigger.includes('代理') && keywords.includes('代理')) return true;
      return false;
    });

    // 如果没有匹配到，显示所有预设建议
    setGeneratedAnalysis(matched.length > 0 ? matched : presetSuggestions);
    setActiveTab('result');
  };

  // 导出分析报告
  const handleExport = () => {
    if (!generatedAnalysis) return;

    const lines = [
      `【团队周报交叉分析报告】`,
      `分析时间: ${new Date().toLocaleString('zh-CN')}`,
      `参与人员: 苏、褚玮、沈忆`,
      `当前周: ${currentWeek}`,
      ``,
      `=== 分析建议 ===`,
      ...generatedAnalysis.map((s, i) => {
        return `
[${s.type}] #${i + 1}: ${s.title}
优先级: ${s.priority}
触发条件: ${s.trigger}
建议内容: ${s.content}
`;
      }),
    ];

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
  };

  // 建议类型样式
  const getSuggestionStyle = (type: AnalysisSuggestion['type']) => {
    switch (type) {
      case '协同建议':
        return { bg: 'bg-blue-50 border-blue-300', icon: Users, color: 'text-blue-600' };
      case '隐藏商机':
        return { bg: 'bg-green-50 border-green-300', icon: TrendingUp, color: 'text-green-600' };
      case '风险预警':
        return { bg: 'bg-red-50 border-red-300', icon: AlertTriangle, color: 'text-red-600' };
      case '情报共享':
        return { bg: 'bg-purple-50 border-purple-300', icon: Share2, color: 'text-purple-600' };
    }
  };

  const mainOwners: Owner[] = ['苏', '褚玮', '沈忆'];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">
            <FileText className="w-4 h-4 mr-1" />
            周报录入
          </TabsTrigger>
          <TabsTrigger value="result">
            <Sparkles className="w-4 h-4 mr-1" />
            交叉分析
          </TabsTrigger>
        </TabsList>

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {mainOwners.map(owner => {
              const existingReport = weekReports.find(r => r.owner === owner);
              return (
                <Card key={owner} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {owner} 的周报
                      {existingReport && (
                        <Badge variant="outline" className="text-[10px] ml-auto text-green-600 border-green-300">
                          已提交
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder={`粘贴 ${owner} 的周报内容...`}
                      className="min-h-[200px] text-sm"
                      value={reports[owner] || existingReport?.content || ''}
                      onChange={e =>
                        setReports(prev => ({ ...prev, [owner]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleSaveReport(owner)}
                      disabled={!reports[owner]?.trim()}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      保存 {owner} 的周报
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!Object.values(reports).some(r => r.trim())}
            >
              <Zap className="w-5 h-5 mr-2" />
              执行交叉分析
            </Button>
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="space-y-4">
          {generatedAnalysis ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">交叉分析报告</h3>
                  <p className="text-sm text-slate-500">
                    分析时间: {new Date().toLocaleString('zh-CN')} | 周: {currentWeek}
                  </p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" />
                  复制报告
                </Button>
              </div>

              <div className="space-y-3">
                {generatedAnalysis.map((suggestion, idx) => {
                  const style = getSuggestionStyle(suggestion.type);
                  const Icon = style.icon;
                  return (
                    <Card key={idx} className={cn('border-2', style.bg)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                              style.bg
                            )}
                          >
                            <Icon className={cn('w-5 h-5', style.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', style.color)}
                              >
                                {suggestion.type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  suggestion.priority === 'P0'
                                    ? 'border-red-300 text-red-600'
                                    : 'border-orange-300 text-orange-600'
                                )}
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-1">
                              #{idx + 1}: {suggestion.title}
                            </h4>
                            <p className="text-xs text-slate-500 mb-2">
                              触发: {suggestion.trigger}
                            </p>
                            <p className="text-sm text-slate-700">{suggestion.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-500">暂无分析结果</h3>
              <p className="text-sm text-slate-400 mt-1">
                先在"周报录入"标签页输入周报内容，然后执行交叉分析
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

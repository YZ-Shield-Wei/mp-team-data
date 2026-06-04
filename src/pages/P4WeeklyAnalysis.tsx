import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Sparkles,
  Users,
  Share2,
  Zap,
  Download,
  BrainCircuit,
  Target,
  ShieldAlert,
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import type { PageProps } from '@/types';
import { canAccessWeeklyAnalysis } from '@/types';
import { analyzeWeeklyReports } from '@/utils/weekly-analyzer';
import type { Insight } from '@/utils/weekly-analyzer';
import { cn } from '@/lib/utils';

export function P4WeeklyAnalysis({ data, updateData, roleConfig }: PageProps) {
  const [activeTab, setActiveTab] = useState<string>('input');
  const [reports, setReports] = useState<Record<string, string>>({
    苏: '',
    褚玮: '',
    沈忆: '',
  });
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeWeeklyReports> | null>(null);

  const { role } = roleConfig;

  // 获取当前周的报告（从data中加载已保存的）
  const weekReports = useMemo(() => {
    const now = new Date();
    const weekNum = `${now.getFullYear()}W${String(Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1).padStart(2, '0')}`;
    return data.weeklyReports.filter(r => r.weekNumber === weekNum);
  }, [data.weeklyReports]);

  // 保存单个人的周报
  const handleSaveReport = async (owner: string) => {
    const content = reports[owner];
    if (!content.trim()) return;

    const now = new Date();
    const weekNum = `${now.getFullYear()}W${String(Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1).padStart(2, '0')}`;

    const existingIdx = data.weeklyReports.findIndex(
      r => r.owner === owner && r.weekNumber === weekNum
    );

    const report = {
      id: existingIdx >= 0 ? data.weeklyReports[existingIdx].id : `wr_${Date.now()}_${owner}`,
      owner: owner as '苏' | '褚玮' | '沈忆',
      weekNumber: weekNum,
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

  // 执行交叉分析
  const handleAnalyze = () => {
    const filledReports: Record<string, string> = {};
    
    // 优先使用编辑框中的内容，如果没有则用已保存的
    for (const owner of ['苏', '褚玮', '沈忆'] as const) {
      const text = reports[owner]?.trim() || weekReports.find(r => r.owner === owner)?.content || '';
      if (text) filledReports[owner] = text;
    }

    if (Object.keys(filledReports).length === 0) {
      return;
    }

    const result = analyzeWeeklyReports(filledReports);
    setAnalysisResult(result);
    setActiveTab('result');
  };

  // 导出分析报告
  const handleExport = () => {
    if (!analysisResult) return;
    const lines = [
      '【团队周报交叉分析报告】',
      `分析时间: ${new Date().toLocaleString('zh-CN')}`,
      `参与人员: ${Object.keys(analysisResult.keywordStats).join('、')}`,
      '',
      `=== ${analysisResult.summary} ===`,
      '',
      `发现 ${analysisResult.dimensions.length} 个交叉维度:`,
      ...analysisResult.dimensions.map(d =>
        `• [${d.dimension}] "${d.keyword}" — ${d.participants.join('、')} (${d.frequency}人提及)`
      ),
      '',
      '=== 核心洞察 ===',
      ...analysisResult.insights.map((insight, idx) => `
[${insight.type}] #${idx + 1}: ${insight.title}
优先级: ${insight.priority} | 置信度: ${insight.confidence}%
依据:
${insight.evidence.map(e => `  • ${e}`).join('\n')}
建议行动: ${insight.action}
`),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
  };

  // 洞察类型样式
  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case '协同建议':
        return { bg: 'bg-blue-50 border-blue-300', icon: Users, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
      case '隐藏商机':
        return { bg: 'bg-amber-50 border-amber-300', icon: Lightbulb, color: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
      case '风险预警':
        return { bg: 'bg-red-50 border-red-300', icon: ShieldAlert, color: 'text-red-600', badge: 'bg-red-100 text-red-700' };
      case '情报共享':
        return { bg: 'bg-purple-50 border-purple-300', icon: Share2, color: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' };
      case '趋势洞察':
        return { bg: 'bg-emerald-50 border-emerald-300', icon: BarChart3, color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
    }
  };

  const mainOwners = ['苏', '褚玮', '沈忆'] as const;

  if (!canAccessWeeklyAnalysis(role)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-lg">周报分析功能仅对 Master 和 Manager 开放</p>
          <p className="text-sm mt-1">你的角色：{roleConfig.label}</p>
        </div>
      </div>
    );
  }

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
                      placeholder={`输入 ${owner} 本周工作内容、客户拜访、市场动态等...`}
                      className="min-h-[160px] text-sm"
                      value={reports[owner] || existingReport?.content || ''}
                      onChange={e => setReports(prev => ({ ...prev, [owner]: e.target.value }))}
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

          {/* 填写提示 */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <BrainCircuit className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">分析建议：</span>
                  尽量包含客户名、产品型号、区域、行业等关键词，分析引擎会据此生成交叉洞察。
                  例如："东莞匠运 ALS-040ARN 样品测试通过，机床行业有替换窗口期"
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!Object.values(reports).some(r => r?.trim())}
            >
              <Zap className="w-5 h-5 mr-2" />
              执行交叉分析
            </Button>
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="space-y-4">
          {!analysisResult ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-500">暂无分析结果</h3>
              <p className="text-sm text-slate-400 mt-1">
                先在"周报录入"标签页输入周报内容，然后执行交叉分析
              </p>
            </div>
          ) : (
            <>
              {/* Summary Header */}
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-800">分析摘要</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-1" />
                      复制报告
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{analysisResult.summary}</p>
                  <div className="flex gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{analysisResult.dimensions.length}</div>
                      <div className="text-xs text-slate-400">交叉维度</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{analysisResult.insights.length}</div>
                      <div className="text-xs text-slate-400">核心洞察</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">
                        {Object.keys(analysisResult.keywordStats).length}
                      </div>
                      <div className="text-xs text-slate-400">参与人数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cross Dimensions */}
              {analysisResult.dimensions.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      交叉维度发现
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[240px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-500 w-[80px]">维度</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">关键词</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500 w-[120px]">提及人</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-500">上下文</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysisResult.dimensions.map((dim, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {dim.dimension}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-700">{dim.keyword}</td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {dim.participants.map(p => (
                                    <span key={p} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500 max-w-[300px] truncate">
                                {dim.summary}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  核心洞察与建议（{analysisResult.insights.length}条）
                </h3>

                {analysisResult.insights.map((insight, idx) => {
                  const style = getInsightStyle(insight.type);
                  const Icon = style.icon;
                  return (
                    <Card key={idx} className={cn('border-2', style.bg)}>
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', style.bg)}>
                            <Icon className={cn('w-5 h-5', style.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={cn('text-[10px] text-white border-0', style.badge)}>
                                {insight.type}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  insight.priority === 'P0' && 'border-red-400 text-red-600 bg-red-50',
                                  insight.priority === 'P1' && 'border-orange-400 text-orange-600 bg-orange-50',
                                  insight.priority === 'P2' && 'border-slate-400 text-slate-500 bg-slate-50',
                                )}
                              >
                                {insight.priority}
                              </Badge>
                              <span className="text-[10px] text-slate-400">置信度 {insight.confidence}%</span>
                            </div>
                            <h4 className={cn('font-semibold text-slate-800', style.color)}>
                              #{idx + 1}: {insight.title}
                            </h4>
                          </div>
                        </div>

                        {/* Evidence */}
                        <div className="mb-3">
                          <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            依据
                          </div>
                          <div className="space-y-1">
                            {insight.evidence.map((e, eidx) => (
                              <div key={eidx} className="flex items-start gap-2 text-sm text-slate-600">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span>{e}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Confidence Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>置信度</span>
                            <span>{insight.confidence}%</span>
                          </div>
                          <Progress
                            value={insight.confidence}
                            className={cn(
                              'h-1.5',
                              insight.confidence >= 90 ? 'bg-red-100' :
                              insight.confidence >= 80 ? 'bg-orange-100' :
                              'bg-blue-100'
                            )}
                          />
                        </div>

                        {/* Action */}
                        <div className={cn('p-3 rounded-lg border', style.bg)}>
                          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            建议行动
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{insight.action}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {analysisResult.insights.length === 0 && (
                <Card className="border-slate-200">
                  <CardContent className="p-6 text-center">
                    <BrainCircuit className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">未生成洞察建议</p>
                    <p className="text-xs text-slate-400 mt-1">
                      当前周报内容较为分散，建议补充更多具体的客户名、产品型号、区域和行业关键词
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

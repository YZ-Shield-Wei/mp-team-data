"""Generate visualization charts for Phase 0 demo report"""
import pandas as pd, numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Use a font that supports CJK
plt.rcParams['font.sans-serif'] = ['Noto Sans CJK JP', 'Noto Serif CJK JP', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['figure.facecolor'] = 'white'

sku_month = pd.read_csv('output/sku_month_matrix.csv', index_col=0)
sku_month.columns = pd.PeriodIndex(sku_month.columns, freq='M')
sku_profile = pd.read_csv('output/sku_profile.csv', index_col=0)

# ============= Chart 1: ABC Pareto =============
fig, ax = plt.subplots(figsize=(10, 5.5))
sku_total = sku_profile['total_qty'].sort_values(ascending=False)
n = len(sku_total)
cum = sku_total.cumsum() / sku_total.sum() * 100
x = np.arange(n)
ax.fill_between(x, 0, cum, alpha=0.3, color='steelblue', label='累计销量占比 %')
ax.plot(x, cum, color='steelblue', lw=2)
ax.axhline(70, color='red', ls='--', alpha=0.6)
ax.axhline(90, color='orange', ls='--', alpha=0.6)
ax.axvline(56, color='red', ls='--', alpha=0.6)
ax.axvline(56+237, color='orange', ls='--', alpha=0.6)
ax.text(56, 72, ' A类: 56个SKU = 70%销量', color='red', fontsize=11, weight='bold')
ax.text(56+237, 92, ' B类: 237个 = 20%', color='orange', fontsize=10)
ax.text(56+237+200, 72, 'C类: 2,777个 SKU = 仅10%销量\n(典型长尾, 应批量自动化)', fontsize=10)
ax.set_xlabel('SKU 排名（按销量降序）', fontsize=11)
ax.set_ylabel('累计销量占比 (%)', fontsize=11)
ax.set_title('ABC 分析：80/20 法则极其极端 → Pilot 应聚焦 56 个 A 类 SKU', fontsize=13, weight='bold')
ax.set_xlim(0, n)
ax.set_ylim(0, 105)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig('output/chart1_abc_pareto.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 1 saved')

# ============= Chart 2: Demand Pattern Distribution =============
fig, ax = plt.subplots(figsize=(10, 5))
crosstab = pd.crosstab(sku_profile['class'], sku_profile['pattern'])
crosstab = crosstab[['Smooth','Erratic','Intermittent','Lumpy']]
colors = ['#2ecc71', '#f39c12', '#3498db', '#e74c3c']
crosstab.plot(kind='bar', stacked=True, ax=ax, color=colors, width=0.6, edgecolor='white')
ax.set_xlabel('ABC 等级', fontsize=11)
ax.set_ylabel('SKU 数量', fontsize=11)
ax.set_title('需求模式分布（ADI / CV² 分类）：A 类适合 ML，C 类应用 Croston 批量处理', fontsize=12, weight='bold')
ax.legend(title='需求模式', loc='upper left')
plt.xticks(rotation=0)
# Add value labels
for i, cls in enumerate(crosstab.index):
    cum = 0
    for j, pat in enumerate(crosstab.columns):
        v = crosstab.iloc[i,j]
        if v > 0:
            ax.text(i, cum + v/2, str(v), ha='center', va='center', fontsize=9, color='white', weight='bold')
        cum += v
plt.tight_layout()
plt.savefig('output/chart2_demand_pattern.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 2 saved')

# ============= Chart 3: 3 Pilot SKU Time Series =============
pilots_info = [
    ('CPG-030-T007A', 'Smooth · 伺服电机 · 江苏', '#2ecc71'),
    ('SFC-030SA2-10B-14B', 'Erratic · 半导体检查 · 广东', '#f39c12'),
    ('BXR-13-20-A-22', 'Intermittent · 伺服电机 · 江苏（断单案例）', '#e74c3c'),
]
fig, axes = plt.subplots(3, 1, figsize=(11, 9), sharex=True)
for ax, (sku, label, color) in zip(axes, pilots_info):
    ts = sku_month.loc[sku]
    months_str = [str(m) for m in ts.index]
    ax.bar(range(len(ts)), ts.values, color=color, alpha=0.85, edgecolor='black', lw=0.5)
    # Mark the test window
    ax.axvspan(9.5, 14.5, alpha=0.12, color='blue', label='测试窗口（验证模型）')
    ax.set_title(f'{sku}  [{label}]', fontsize=11, weight='bold', loc='left')
    ax.set_ylabel('月销量 (件)', fontsize=10)
    ax.grid(axis='y', alpha=0.3)
    # Mark zeros
    for i, v in enumerate(ts.values):
        if v == 0:
            ax.text(i, ax.get_ylim()[1]*0.05, '0', ha='center', fontsize=9, color='red', weight='bold')
    ax.set_xticks(range(len(ts)))
    ax.set_xticklabels([m.split('-')[1] for m in months_str], fontsize=9)
axes[-1].set_xlabel('月份（2025-01 ~ 2026-03）', fontsize=10)
axes[0].legend(loc='upper left', fontsize=9)
plt.suptitle('3 个 Pilot SKU 月度销量曲线：覆盖 Smooth / Erratic / Intermittent 三种模式', fontsize=13, weight='bold', y=1.005)
plt.tight_layout()
plt.savefig('output/chart3_pilot_skus.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 3 saved')

# ============= Chart 4: Forecast Accuracy Comparison =============
final = pd.read_csv('output/round3_summary.csv', index_col=0)
final = final.sort_values('WMAPE_%')
naive_baseline = final.loc['B1_LastMonth', 'WMAPE_%']

fig, ax = plt.subplots(figsize=(11, 6))
colors_map = []
for m in final.index:
    if m == 'B1_LastMonth':
        colors_map.append('#7f8c8d')  # gray for baseline
    elif m.startswith('M'):
        colors_map.append('#3498db')  # blue for ML
    else:
        colors_map.append('#2ecc71')  # green for naive variants

bars = ax.barh(range(len(final)), final['WMAPE_%'], color=colors_map, edgecolor='black', lw=0.5)
ax.axvline(naive_baseline, color='red', ls='--', lw=1.5, label=f'拍脑袋基线 ({naive_baseline:.1f}%)')
ax.set_yticks(range(len(final)))
ax.set_yticklabels(final.index, fontsize=10)
ax.invert_yaxis()
ax.set_xlabel('WMAPE - 加权平均绝对误差率 (%) — 越低越好', fontsize=11)
ax.set_title('Phase 0 Demo: 不同方法在 2 个可预测 Pilot SKU 上的对比\n（测试窗口：2025-10 ~ 2026-03，共 12 次预测/模型）', fontsize=12, weight='bold')

# Annotate improvement
for i, (idx, row) in enumerate(final.iterrows()):
    imp = (naive_baseline - row['WMAPE_%']) / naive_baseline * 100
    label = f'  {row["WMAPE_%"]:.1f}%'
    if abs(imp) > 0.5:
        sign = '+' if imp > 0 else ''
        label += f'  ({sign}{imp:.1f}% vs 基线)'
    color = 'darkgreen' if imp > 5 else 'darkred' if imp < -5 else 'black'
    ax.text(row['WMAPE_%']+1, i, label, va='center', fontsize=9, color=color, weight='bold' if abs(imp)>5 else 'normal')

# Legend
gray_patch = mpatches.Patch(color='#7f8c8d', label='Naive 基线（"拍脑袋"代理）')
green_patch = mpatches.Patch(color='#2ecc71', label='简单统计法（移动平均/季节朴素）')
blue_patch = mpatches.Patch(color='#3498db', label='ML / 高级方法')
ax.legend(handles=[gray_patch, green_patch, blue_patch], loc='lower right', fontsize=10)
ax.grid(axis='x', alpha=0.3)
ax.set_xlim(0, max(final['WMAPE_%'])*1.25)
plt.tight_layout()
plt.savefig('output/chart4_accuracy_comparison.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 4 saved')

# ============= Chart 5: BXR Churn Detection =============
fig, ax = plt.subplots(figsize=(11, 5.5))
ts = sku_month.loc['BXR-13-20-A-22']
arr = ts.values
months_str = [str(m).split('-')[0][2:]+'-'+str(m).split('-')[1] for m in ts.index]

# Bars colored by alert level
colors_b = []
alerts = ['']*len(arr)
for i in range(len(arr)):
    if i < 6:
        colors_b.append('#bdc3c7'); continue
    window = arr[i-6:i]
    m, s = window.mean(), window.std()
    z = (arr[i] - m) / max(s, 1)
    if arr[i] == 0 and m > 100:
        colors_b.append('#c0392b'); alerts[i] = '🚨断单'
    elif z < -1.5:
        colors_b.append('#e67e22'); alerts[i] = '⚠️下滑'
    elif z > 1.5:
        colors_b.append('#f39c12'); alerts[i] = '📈激增'
    else:
        colors_b.append('#2ecc71')

ax.bar(range(len(arr)), arr, color=colors_b, edgecolor='black', lw=0.5)
ax.set_xticks(range(len(arr)))
ax.set_xticklabels(months_str, fontsize=9, rotation=45)
ax.set_ylabel('月销量 (件)', fontsize=11)
ax.set_title('BXR-13-20-A-22 业务断单事件检测（Z-score 异常告警）\n💡 11月异常激增 → 12月起持续断单：可提前2-3月预警库存与采购', fontsize=12, weight='bold')
# Add alert annotations
for i, a in enumerate(alerts):
    if a:
        ax.text(i, arr[i]+200 if arr[i]>0 else 200, a, ha='center', fontsize=10, color=colors_b[i], weight='bold')

# Legend
patches = [
    mpatches.Patch(color='#2ecc71', label='正常'),
    mpatches.Patch(color='#f39c12', label='激增预警 (Z>1.5)'),
    mpatches.Patch(color='#e67e22', label='下滑预警 (Z<-1.5)'),
    mpatches.Patch(color='#c0392b', label='断单告警 (Actual=0)'),
]
ax.legend(handles=patches, loc='upper right', fontsize=10)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig('output/chart5_churn_detection.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 5 saved')

# ============= Chart 6: Pilot SKU Forecast vs Actual =============
all_res = pd.read_csv('output/round3_all_results.csv')
all_res['period'] = pd.PeriodIndex(all_res['period'], freq='M')
focus_skus = ['CPG-030-T007A', 'SFC-030SA2-10B-14B']
focus_models = ['B1_LastMonth', 'M1_AutoETS', 'B4_MA6']

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for ax, sku in zip(axes, focus_skus):
    sub = all_res[all_res.sku == sku]
    months = sorted(sub.period.unique())
    actuals = [sub[sub.period==m].actual.iloc[0] for m in months]
    ax.plot(range(len(months)), actuals, 'k-o', lw=2.5, markersize=8, label='实际', zorder=10)
    
    colors_line = {'B1_LastMonth':'#e74c3c', 'M1_AutoETS':'#3498db', 'B4_MA6':'#2ecc71'}
    labels = {'B1_LastMonth':'拍脑袋基线 (B1)', 'M1_AutoETS':'AutoETS 统计', 'B4_MA6':'MA6 移动平均'}
    for mod in focus_models:
        ms = sub[sub.model==mod].sort_values('period')
        if len(ms)==len(months):
            ax.plot(range(len(months)), ms.pred.values, '--', color=colors_line[mod], 
                    lw=1.8, alpha=0.85, label=labels[mod], marker='s', markersize=6)
    
    ax.set_title(f'{sku}', fontsize=11, weight='bold')
    ax.set_xticks(range(len(months)))
    ax.set_xticklabels([str(m).split('-')[1] for m in months], fontsize=9)
    ax.set_xlabel('测试月份')
    ax.set_ylabel('销量 (件)')
    ax.grid(alpha=0.3)
    ax.legend(loc='best', fontsize=9)
plt.suptitle('Pilot SKU 预测对比：实际 vs 各方法', fontsize=13, weight='bold')
plt.tight_layout()
plt.savefig('output/chart6_forecast_vs_actual.png', dpi=130, bbox_inches='tight')
plt.close()
print('✅ Chart 6 saved')

print('\nAll charts generated in output/')
import os
for f in sorted(os.listdir('output')):
    if f.endswith('.png'):
        size = os.path.getsize(f'output/{f}')/1024
        print(f'  {f}: {size:.1f} KB')

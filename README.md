# MP 上海团队管理优化系统

> 轻量级、零成本、即开即用的团队管理工具套件，基于 GitHub 数据同步 + OpenClaw 自动化

## 功能模块

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **P0 待办时效面板** | 团队待办追踪、时效预警、Top5 导出 | P0 |
| **P1 报价利润计算器** | 12个型号预设、利润率实时计算、竞品对比 | P0 |
| **P2 客户机会雷达** | 18家客户热度评分、沉睡客户唤醒、标签筛选 | P0 |
| **P3 SRM 订单监控** | 截图解析、订单状态追踪、自动生成待办 | P1 |
| **P4 周报交叉分析** | 三人周报关键词提取、协同建议、商机发现 | P1 |
| **P5 路线优化器** | 客户地理聚类、路线规划、实战案例复盘 | P2 |

## 快速开始（只需 3 步）

### 第 1 步：Fork 本仓库

1. 访问 GitHub，Fork 本仓库到你自己的账号下
2. 仓库名建议保持 `mp-shanghai-team-suite`

### 第 2 步：申请 GitHub Token

1. 打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 **Generate new token (classic)**
3. 勾选权限：
   - ✅ `repo`（完整仓库访问权限）
4. 点击 **Generate token**
5. **复制并保存 Token**（只显示一次）

### 第 3 步：配置 OpenClaw

在每个人的 OpenClaw 环境中执行以下操作：

#### 3.1 设置环境变量

```bash
# 在 OpenClaw 终端中执行
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"  # 替换为你的 Token
export GITHUB_OWNER="your-github-username"       # 你的 GitHub 用户名
export GITHUB_REPO="mp-shanghai-team-suite"      # 仓库名
```

#### 3.2 克隆数据仓库

```bash
# 创建工作目录
mkdir -p ~/.openclaw/workspace
cd ~/.openclaw/workspace

# 克隆仓库
git clone https://${GITHUB_TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git mp-team-data

# 初始化数据文件
cd mp-team-data
mkdir -p data weekly reports srm_snapshots

# 创建初始数据文件（空数组）
echo "[]" > data/todos.json
echo "[]" > data/quotes.json
echo "[]" > data/weekly-reports.json
echo "[]" > data/weekly-analyses.json
echo "[]" > data/srm-orders.json
echo "[]" > data/route-plans.json
echo '{"profitBaseline":30,"defaultMaxVisitsPerDay":5,"todoWarningHours":24}' > data/settings.json

# 提交初始数据
git add .
git commit -m "init: 初始化团队数据仓库"
git push origin main
```

#### 3.3 安装定时任务 Skill

将 `skills/` 目录下的 5 个 Skill 文件复制到 OpenClaw 的 Skill 目录：

```bash
# 复制 Skill 文件到 OpenClaw
cp skills/*.md ~/.openclaw/skills/
```

然后重启 OpenClaw，让 Skill 生效。

### 第 4 步：部署前端（可选）

如果需要团队共享访问网页版：

1. 在 GitHub 仓库中，进入 Settings → Pages
2. Source 选择 "GitHub Actions"
3. 每次 push 到 main 分支会自动部署

访问地址：`https://your-username.github.io/mp-shanghai-team-suite/`

## OpenClaw 定时任务配置

### Skill 清单

| Skill 文件 | 功能 | 建议定时 | 触发命令 |
|-----------|------|---------|---------|
| `mp-todo-sync.md` | 待办同步 + Top5 生成 | 每天 8:00 | "生成 Top5" |
| `mp-weekly-analyzer.md` | 周报交叉分析 | 每周一 9:00 | "分析周报" |
| `mp-customer-radar.md` | 客户档案更新 | 手动触发 | "更新客户档案" |
| `mp-srm-monitor.md` | SRM 订单监控 | 每 4 小时 | "检查 SRM" |
| `mp-route-optimizer.md` | 路线规划 | 手动触发 | "规划路线" |

### 配置定时任务（Cron）

在 OpenClaw 的配置文件中添加：

```yaml
scheduled_tasks:
  - name: "晨会待办同步"
    skill: "mp-todo-sync"
    schedule: "0 8 * * 1-6"  # 工作日早上8点

  - name: "周报交叉分析"
    skill: "mp-weekly-analyzer"
    schedule: "0 9 * * 1"     # 每周一早上9点

  - name: "SRM 订单监控"
    skill: "mp-srm-monitor"
    schedule: "0 */4 * * 1-5" # 工作日每4小时
```

## 数据架构

```
mp-team-data/                    # GitHub 仓库 = 团队数据库
├── data/
│   ├── todos.json               # 全员待办（含时效状态）
│   ├── customers.json           # 客户档案（18家 + 热度评分）
│   ├── quotes.json              # 报价历史记录
│   ├── weekly-reports.json      # 周报原文
│   ├── weekly-analyses.json     # 交叉分析报告
│   ├── srm-orders.json          # SRM 订单监控
│   ├── route-plans.json         # 路线规划记录
│   └── settings.json            # 团队设置
├── weekly/                      # 周报原始文本
│   ├── 苏_2026W23.md
│   ├── 褚玮_2026W23.md
│   └── 沈忆_2026W23.md
├── reports/                     # 分析报告
│   └── weekly_analysis_2026W23.md
├── srm_snapshots/               # SRM 监控截图存档
└── .github/workflows/           # 前端自动部署
    └── deploy.yml
```

## 日常使用流程

### 苏总（Master）每日流程

```
08:00  OpenClaw 自动生成 Top5 → 粘贴到微信群晨会
08:30  打开网页版查看待办面板 → 确认优先级
09:00  拜访途中 → 手机打开网页版新增待办/查看客户档案
12:00  报价时 → 打开利润计算器 → 输入报价 → 确认利润率达标
18:00  下班前 → OpenClaw 自动推送当日变更到 GitHub
20:00  查看周报分析报告（周一）
```

### 褚玮/沈忆 每日流程

```
08:00  查看微信群 Top5 → 确认自己的待办
09:00  拜访后 → 告诉 OpenClaw "更新客户档案：今天拜访了XX..."
18:00  OpenClaw 自动同步数据到 GitHub
```

## 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **数据层**: GitHub 仓库（JSON 文件）+ GitHub API
- **自动化**: OpenClaw Skill + 定时任务
- **部署**: GitHub Pages

## 注意事项

1. **GitHub Token 安全**：Token 只保存在本地 OpenClaw 环境，不提交到仓库
2. **数据冲突**：多人同时修改时，OpenClaw 会自动合并（以时间戳最新的为准）
3. **离线使用**：无网络时数据保存在浏览器 LocalStorage，有网后自动同步
4. **数据备份**：Git 历史就是备份，可随时回滚到任意版本

## 常见问题

**Q: 为什么数据保存在 GitHub 而不是数据库？**
> 零成本 + 版本控制 + 团队共享 + 数据主权完全自主

**Q: GitHub API 有限流吗？**
> Personal Access Token 每小时 5000 次请求，对于 22 人团队完全够用

**Q: 没有网络能用吗？**
> 可以！数据会保存在浏览器本地，有网后自动同步到 GitHub

**Q: 如何添加新客户？**
> 在 P2 客户雷达页面直接添加，或通过 OpenClaw 说"添加客户：XXX"

**Q: 如何修改利润底线？**
> 在设置页面修改，或修改 `data/settings.json` 中的 `profitBaseline`

## 联系方式

- 产品负责人：苏
- 技术支持：OpenClaw 社区

---

**MP 上海团队管理优化系统 v1.0** | 数据主权归属：MP 上海营业部

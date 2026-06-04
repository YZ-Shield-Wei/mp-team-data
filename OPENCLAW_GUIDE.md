# OpenClaw 操作完全指南

> 本文档面向 MP 上海团队全体成员，手把手教你配置和使用 OpenClaw 自动化

---

## 一、OpenClaw 是什么？

**OpenClaw = 你电脑里的智能助手**，能听懂自然语言命令，自动帮你操作电脑。

在本项目中，OpenClaw 扮演**"数据管家"**角色：
- 每天早上自动读取团队待办，生成 Top5 报告
- 每周一自动分析三人周报，发现隐藏商机
- 定时监控 SRM 订单，有变化立刻通知
- 你说话就能更新客户档案、规划拜访路线

**网页版（浏览器）= 操作界面**
**OpenClaw（本地）= 自动化大脑**

两者数据通过 GitHub 仓库同步，完美配合。

---

## 二、每个人的配置步骤（只需一次）

### 第 1 步：确认你有 OpenClaw

在终端里输入：
```bash
which openclaw
```

如果显示路径（如 `/usr/local/bin/openclaw`），说明已安装。

如果没安装，联系苏或技术支持。

### 第 2 步：获取 GitHub Token

向苏申请 Token（苏在 GitHub 仓库设置里生成后分发）。

Token 长这样：
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ 安全提醒**：Token 相当于密码，不要发给其他人，不要截图到微信群。

### 第 3 步：一键配置脚本

把下面的脚本复制到 OpenClaw 终端，**修改前3个变量**后执行：

```bash
#!/bin/bash
# ========================================
# MP 团队 OpenClaw 一键配置脚本
# 使用前请修改：TOKEN、YOUR_NAME、YOUR_ROLE
# ========================================

# ===== 必填：修改这3个变量 =====
TOKEN="ghp_你的Token"           # 苏给你的 Token
YOUR_NAME="苏"                  # 你的名字（苏/褚玮/沈忆/王成/张璐/雷洪/杨尚达）
YOUR_ROLE="master"              # 你的角色（master/manager/member）
# =================================

GITHUB_OWNER="YZ-Shield-Wei"
GITHUB_REPO="mp-team-data"
WORKSPACE_DIR="$HOME/.openclaw/workspace"
REPO_DIR="$WORKSPACE_DIR/mp-team-data"
SKILLS_DIR="$HOME/.openclaw/skills"

echo "=== MP 团队 OpenClaw 配置开始 ==="
echo "用户名: $YOUR_NAME"
echo "角色: $YOUR_ROLE"

# 1. 创建工作目录
mkdir -p "$WORKSPACE_DIR"
mkdir -p "$SKILLS_DIR"

# 2. 克隆/更新数据仓库
if [ -d "$REPO_DIR/.git" ]; then
    echo "[1/6] 更新数据仓库..."
    cd "$REPO_DIR"
    git pull "https://${TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" main
else
    echo "[1/6] 克隆数据仓库..."
    git clone "https://${TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" "$REPO_DIR"
fi

# 3. 初始化数据文件
echo "[2/6] 初始化数据文件..."
cd "$REPO_DIR"
mkdir -p data weekly reports srm_snapshots

# 确保数据文件存在
for file in todos.json customers.json quotes.json srm-orders.json weekly-reports.json weekly-analyses.json route-plans.json settings.json; do
    [ -f "data/$file" ] || echo "[]" > "data/$file"
done
[ -s "data/settings.json" ] || echo '{"profitBaseline":30,"defaultMaxVisitsPerDay":5,"todoWarningHours":24}' > "data/settings.json"

# 4. 保存配置到环境变量
echo "[3/6] 保存配置..."
cat > "$WORKSPACE_DIR/.env" << EOF
GITHUB_TOKEN=${TOKEN}
GITHUB_OWNER=${GITHUB_OWNER}
GITHUB_REPO=${GITHUB_REPO}
MP_USER_NAME=${YOUR_NAME}
MP_USER_ROLE=${YOUR_ROLE}
EOF

# 5. 添加定时任务到 crontab
echo "[4/6] 配置定时任务..."
CRON_FILE="$WORKSPACE_DIR/crontab.txt"

# 根据角色配置不同的定时任务
case "$YOUR_ROLE" in
    master)
        cat > "$CRON_FILE" << 'EOF'
# MP 团队定时任务（苏 - Master）
# 每天早上8:00生成Top5
0 8 * * 1-6 cd ~/.openclaw/workspace/mp-team-data && git pull origin main && echo "=== 晨会Top5 ===" && python3 -c "
import json
from datetime import datetime, timedelta

with open('data/todos.json') as f:
    todos = json.load(f)

now = datetime.now()
urgent = []
for t in todos:
    deadline = datetime.fromisoformat(t['deadline'].replace('Z', '+00:00').replace('+00:00', ''))
    hours = (deadline - now).total_seconds() / 3600
    if hours <= 24 and hours > 0:
        t['_hours'] = hours
        urgent.append(t)
    elif hours <= 0:
        t['_hours'] = hours
        urgent.append(t)

urgent.sort(key=lambda x: x['_hours'])
top5 = urgent[:5]

print(f'【今日Top5紧急待办】{now.strftime(\"%Y-%m-%d\")}')
print()
for i, t in enumerate(top5, 1):
    h = t['_hours']
    status = '已超期' if h <= 0 else f'还剩{int(h)}小时'
    print(f'{i}. [{t[\"priority\"]}] {t[\"title\"]}')
    print(f'   客户: {t[\"customer\"]} | 负责人: {t[\"owner\"]} | {status}')
    if t.get('note'):
        print(f'   备注: {t[\"note\"]}')
    print()

if not top5:
    print('今日暂无紧急待办')
" >> ~/.openclaw/logs/daily-top5.log 2>&1

# 每周一9:00分析周报
0 9 * * 1 cd ~/.openclaw/workspace/mp-team-data && echo "=== 周报分析 ===" >> ~/.openclaw/logs/weekly-analysis.log 2>&1

# 工作日每4小时检查SRM
0 */4 * * 1-5 cd ~/.openclaw/workspace/mp-team-data && echo "=== SRM检查 ===" >> ~/.openclaw/logs/srm-check.log 2>&1
EOF
        ;;
    manager)
        cat > "$CRON_FILE" << 'EOF'
# MP 团队定时任务（主管）
# 每天早上8:30拉取最新数据
30 8 * * 1-6 cd ~/.openclaw/workspace/mp-team-data && git pull origin main
EOF
        ;;
    member)
        cat > "$CRON_FILE" << 'EOF'
# MP 团队定时任务（成员）
# 每天早上8:30拉取最新数据
30 8 * * 1-6 cd ~/.openclaw/workspace/mp-team-data && git pull origin main
EOF
        ;;
esac
# 安装定时任务（不覆盖其他crontab）
(crontab -l 2>/dev/null; cat "$CRON_FILE") | crontab -

# 6. 完成
echo "[5/6] 提交初始数据..."
cd "$REPO_DIR"
git add data/ 2>/dev/null
git diff --cached --quiet || git commit -m "init: 数据初始化 by ${YOUR_NAME}"
git push "https://${TOKEN}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" main 2>/dev/null || true

echo "[6/6] 配置完成！"
echo ""
echo "=== 配置摘要 ==="
echo "数据仓库: $REPO_DIR"
echo "角色: $YOUR_ROLE"
echo "定时任务:"
crontab -l | grep -A1 "MP 团队"
echo ""
echo "=== 常用命令 ==="
echo "查看待办:   openclaw '生成Top5'"
echo "更新客户:   openclaw '更新客户档案'"
echo "检查SRM:    openclaw '检查SRM订单'"
echo ""
```

**执行方式**：把上面脚本保存为 `setup.sh`，然后在终端运行：
```bash
bash setup.sh
```

---

## 三、常用命令清单（自然语言对话）

配置完成后，在 OpenClaw 里用**自然语言**说话即可，不用记命令。

### 通用命令（所有人可用）

| 你想做什么 | 对 OpenClaw 说 |
|-----------|---------------|
| 查看今天有什么急事 | `生成Top5` 或 `今天有什么紧急待办` |
| 记录拜访了某客户 | `更新客户档案：今天拜访了东莞匠运，确认了ALS-040ARN报价` |
| 查看某客户信息 | `查看东莞匠运的客户档案` |
| 检查SRM订单 | `检查SRM订单` 或 `SRM有什么变化` |
| 规划明天拜访路线 | `规划路线：明天去东莞拜访` |
| 查看本周周报 | `查看周报分析` |
| 手动同步数据 | `同步团队数据` |
| 查看帮助 | `MP团队系统帮助` |

### 苏（Master）专属命令

| 你想做什么 | 对 OpenClaw 说 |
|-----------|---------------|
| 给褚玮派任务 | `发布任务：褚玮负责确认青岛宝丽金样品进度，P1，明天18:00截止` |
| 晨会前生成Top5 | `生成今日Top5紧急待办` → 自动复制到剪贴板 → 粘贴到微信群 |
| 分析三人周报 | `分析本周周报` → 自动读取三人周报 → 生成交叉分析报告 |
| 修改利润底线 | `修改利润底线为35%` |
| 添加新客户 | `添加新客户：xxx公司，区域东莞，负责人沈忆` |
| 导出所有数据 | `导出团队数据备份` |

### 主管（褚玮/沈忆）专属命令

| 你想做什么 | 对 OpenClaw 说 |
|-----------|---------------|
| 提交本周周报 | `提交周报：本周拜访了...` |
| 查看自己部门数据 | `查看我的客户列表` |

---

## 四、定时任务说明

配置脚本会自动设置定时任务，下面是每个角色的任务清单：

### 苏（Master）- 5个定时任务

```
每天 8:00   → 生成 Top5 紧急待办（输出到终端+日志）
每周一 9:00 → 交叉分析三人周报（生成报告）
每4小时     → 检查 SRM 订单变化（工作日）
```

### 褚玮/沈忆（Manager）- 1个定时任务

```
每天 8:30   → 拉取最新团队数据
```

### 其他成员 - 1个定时任务

```
每天 8:30   → 拉取最新团队数据
```

---

## 五、苏发布任务的标准流程

### 方式一：网页发布（推荐日常用）

```
1. 打开网页 https://yz-shield-wei.github.io/mp-team-data/
2. 选择身份：苏（Master）
3. 进入 P0 待办时效面板
4. 点击"新增待办"
5. 填写：事项 / 客户 / 负责人（选任何人）/ 优先级 / 截止时间
6. 保存 → 数据自动同步到 GitHub
7. 被指派人的 OpenClaw 下次同步时会收到通知
```

### 方式二：OpenClaw 语音发布（快速派活）

```
苏："发布任务：褚玮负责联系青岛宝丽金确认样品进度，P1优先级，明天晚上6点截止"

OpenClaw：
1. 解析出：负责人=褚玮，事项=联系青岛宝丽金确认样品进度，优先级=P1，截止=明天18:00
2. 生成待办 JSON
3. 写入 data/todos.json
4. git commit + push
5. 回复："任务已发布给褚玮，截止明天18:00"

褚玮的 OpenClaw（下次同步时）：
→ 检测到新待办
→ 终端显示："【新任务】联系青岛宝丽金确认样品进度，截止6/5 18:00"
```

### 方式三：晨会 Top5（每天必做）

```
每天早上 8:00（自动）
→ OpenClaw 生成 Top5
→ 苏查看终端输出
→ 复制粘贴到微信群
→ @对应负责人
```

Top5 格式示例：
```
【今日Top5紧急待办】2026-06-05

1. [P0] 东莞匠运ALS-040ARN报价确认
   客户: 东莞匠运 | 负责人: 苏 | 还剩8小时
   备注: 48小时报价时效

2. [P1] 青岛宝丽金样品进度跟进
   客户: 青岛宝丽金 | 负责人: 褚玮 | 已超期2小时
   
3. [P0] SFC-050螺栓缺口协调
   客户: 多客户 | 负责人: 苏 | 还剩12小时
```

---

## 六、数据同步机制

### 自动同步
- 网页版：每5分钟自动从 GitHub 拉取最新数据
- OpenClaw：定时任务自动 pull/push

### 手动同步
```bash
# 在 OpenClaw 终端
openclaw '同步数据'

# 或手动命令
cd ~/.openclaw/workspace/mp-team-data
git pull origin main   # 拉取最新
git push origin main   # 推送本地修改
```

### 冲突处理
如果两人同时修改了同一文件：
1. OpenClaw 会检测冲突
2. 以**时间戳最新**的为准
3. 如果无法自动合并，会提示你手动确认

---

## 七、常见问题

**Q: OpenClaw 说"找不到命令"怎么办？**
> 检查环境变量是否生效：
> ```bash
> echo $GITHUB_TOKEN
> ```
> 如果没输出，重新运行配置脚本。

**Q: 数据同步失败怎么办？**
> 1. 检查网络连接
> 2. 检查 Token 是否过期（找苏重新生成）
> 3. 手动执行 `cd ~/.openclaw/workspace/mp-team-data && git pull`

**Q: 我换了电脑怎么办？**
> 重新运行一遍配置脚本（第3步），数据会自动从 GitHub 克隆下来。

**Q: 团队成员离职了怎么办？**
> 苏在 GitHub 仓库 Settings → Manage access 移除其权限，并在网页上把该人的待办转给其他人。

**Q: 可以在手机上用吗？**
> 网页版可以在手机浏览器打开（响应式设计）。OpenClaw 需要在电脑/服务器上运行。

---

## 八、文件位置速查

| 文件 | 位置 | 说明 |
|------|------|------|
| 待办数据 | `~/.openclaw/workspace/mp-team-data/data/todos.json` | 全员待办 |
| 客户档案 | `~/.openclaw/workspace/mp-team-data/data/customers.json` | 18家客户 |
| 报价历史 | `~/.openclaw/workspace/mp-team-data/data/quotes.json` | 报价记录 |
| 周报原文 | `~/.openclaw/workspace/mp-team-data/weekly/` | 三人周报 |
| 分析报告 | `~/.openclaw/workspace/mp-team-data/reports/` | 交叉分析 |
| 配置文件 | `~/.openclaw/workspace/mp-team-data/.env` | Token等配置 |
| 定时任务 | `crontab -l` | 查看所有定时任务 |
| 日志文件 | `~/.openclaw/logs/` | 运行日志 |

---

**文档版本**: v1.0
**适用对象**: MP上海团队全体成员
**配置有问题请联系**: 苏 或 技术支持

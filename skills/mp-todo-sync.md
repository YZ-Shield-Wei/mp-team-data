# MP 待办同步管家

## 描述
MP上海团队待办事项的定时同步服务，负责每天早上拉取团队最新待办数据、生成晨会 Top5 报告、推送超期预警。

## 触发条件
- 定时任务：每天早上 8:00 执行（cron: `0 8 * * 1-6`）
- 手动触发：当用户说"同步待办"或"生成 Top5"时

## 工具依赖
- GitHub CLI (`gh`) 或 Git 命令行
- 环境变量：`GITHUB_TOKEN`（需有 repo 权限）
- 仓库：`MP_SHANGHAI_REPO`（默认: `mp-team-data`）
- 仓库所有者：`GITHUB_OWNER`

## 执行步骤

### 1. 拉取最新数据
```bash
# 进入工作目录（假设在 ~/.openclaw/workspace/mp-team-data）
cd ~/.openclaw/workspace/mp-team-data

# 拉取最新数据
git pull origin main

# 读取待办文件
cat data/todos.json
```

### 2. 生成晨会 Top5 报告
读取 `data/todos.json`，按以下规则筛选：
1. 排除 status 为 "normal" 的待办
2. 按截止时间排序（最近的在前）
3. 取前 5 条

生成格式：
```
【今日 Top5 紧急待办】
{YYYY年MM月DD日}

1. [优先级] 事项内容
   客户: XXX | 负责人: XXX | 截止: MM/DD | 剩余: XX小时
   备注: XXX

2. ...
```

### 3. 推送 Top5 到终端
将生成的 Top5 报告输出到终端，提醒用户：
```
=== 晨会 Top5 紧急待办 ===
（已复制到剪贴板，可直接粘贴到微信群）
```

### 4. 超期预警检测
扫描所有待办：
- 如果存在 status 为 "overdue" 的待办，输出红色警告：
  ```
  ⚠️ 警告：有 X 条待办已超期！
  - [事项内容] 超期 XX 小时
  ```
- 如果存在 status 为 "urgent"（24小时内到期）的待办，输出橙色提醒：
  ```
  ⏰ 提醒：有 X 条待办将在24小时内到期
  - [事项内容] 还剩 XX 小时
  ```

### 5. 同步回本地
如果有本地修改，提交并推送：
```bash
git add data/todos.json
git commit -m "sync: 待办同步 $(date '+%Y-%m-%d %H:%M')"
git push origin main
```

## 输出格式
```json
{
  "type": "todo_sync_report",
  "timestamp": "2026-06-04T08:00:00+08:00",
  "top5": [...],
  "overdue_count": 0,
  "urgent_count": 2,
  "total": 50
}
```

## 注意事项
- 如果 GitHub Token 无效，报错并提示用户重新配置
- 如果仓库不存在，提示用户先初始化
- 数据合并冲突时，以时间戳最新的为准

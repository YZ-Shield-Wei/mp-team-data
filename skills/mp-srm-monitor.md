# MP SRM 订单监控

## 描述
SRM（供应商关系管理）系统的半自动化监控服务。通过定时登录 SRM 系统、截取订单页面、解析订单状态变化，自动生成待办事项。

## 触发条件
- 定时任务：每 4 小时执行一次（cron: `0 */4 * * 1-5`）
- 手动触发：当用户说"检查 SRM"或"监控订单"时

## 工具依赖
- Python 3.x
- 依赖库：`requests`, `Pillow`, `pytesseract`（可选）
- 环境变量：`GITHUB_TOKEN`
- SRM 系统登录凭据（需用户手动配置）

## 执行步骤

### 1. 准备工作目录
```bash
cd ~/.openclaw/workspace/mp-team-data
git pull origin main
```

### 2. 读取监控配置
从 `data/srm-config.json` 读取：
- SRM 系统 URL
- 登录用户名/密码（如已保存）
- 重点追踪订单列表

### 3. 登录 SRM 系统
使用 Python 脚本模拟登录：
```python
import requests

# SRM 系统登录（需根据实际系统调整）
session = requests.Session()
login_url = "https://srm.example.com/login"
response = session.post(login_url, data={
    "username": SRM_USERNAME,
    "password": SRM_PASSWORD
})

# 检查登录是否成功
if response.status_code == 200:
    print("SRM 登录成功")
else:
    print("SRM 登录失败，跳过本次监控")
    exit(1)
```

### 4. 获取订单列表
```python
# 获取订单页面
order_url = "https://srm.example.com/orders"
response = session.get(order_url)

# 保存页面内容供后续解析
with open("srm_snapshot.html", "w", encoding="utf-8") as f:
    f.write(response.text)
```

### 5. 解析订单信息
根据 SRM 系统的 HTML 结构提取订单信息：
```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(response.text, 'html.parser')
# 根据实际页面结构解析订单数据
# 提取：订单号、客户、产品、数量、状态、交期
```

### 6. 比对历史数据
读取上次监控结果 `data/srm-orders.json`：
- 新订单（历史中没有）→ 标记为 "新增"
- 状态变化 → 标记为 "变更"
- 无变化 → 标记为 "无变化"

### 7. 生成差异报告
```
=== SRM 订单监控报告 ===
监控时间: {datetime}

新增订单 ({N}条):
- [客户名] [产品] [数量] [状态]

状态变更 ({N}条):
- [客户名] [产品] [旧状态] → [新状态]

无变化 ({N}条)
```

### 8. 生成待办（仅新增/变更）
对于有变化的订单，自动生成待办：
```json
{
  "id": 自动生成,
  "title": "SRM订单变更: {客户} {产品}",
  "customer": "{客户名}",
  "owner": "苏",
  "priority": "P1",
  "deadline": "{now + 48h}",
  "note": "SRM监控: {变更详情}",
  "status": "urgent",
  "createdAt": "{now}",
  "updatedAt": "{now}"
}
```

### 9. 保存并推送
更新 `data/srm-orders.json` 和 `data/todos.json`：
```bash
git add data/srm-orders.json data/todos.json srm_snapshots/
git commit -m "srm: 订单监控 $(date '+%Y-%m-%d %H:%M')

新增: X条
变更: X条
无变化: X条"
git push origin main
```

### 10. 输出到终端
```
=== SRM 监控完成 ===
新增订单: X条
状态变更: X条
已生成待办: X条

重点提醒:
- [客户] [产品] 状态变为 [新状态]，需跟进

监控截图保存: srm_snapshots/{timestamp}.png
```

## 注意事项
- SRM 系统的登录方式和页面结构因实际系统而异，需要根据实际情况调整
- 如果 SRM 系统有反爬虫机制，需要增加请求间隔（建议 ≥5秒）
- 登录凭据建议保存在环境变量或本地配置文件，不要硬编码
- 监控频率不要过高，避免对 SRM 系统造成压力
- 如果本次监控失败，保留上次数据，不覆盖

## 与前端工具的联动
P3 SRM 订单监控助手（前端工具）可以：
1. 查看历史监控截图
2. 手动上传截图进行解析
3. 查看生成的待办
4. 调整重点追踪订单列表

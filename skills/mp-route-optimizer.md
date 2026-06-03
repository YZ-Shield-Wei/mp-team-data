# MP 拜访路线优化

## 描述
客户拜访路线智能规划服务。根据客户地理位置、热度评分、拜访优先级等参数，自动生成最优拜访路线。

## 触发条件
- 手动触发：当用户说"规划路线"或"生成拜访计划"时
- 手动触发：当用户说"明天去 {城市} 拜访"时

## 工具依赖
- 高德地图 API Key 或百度地图 API Key（可选，无 API 时按区域聚类）
- GitHub CLI (`gh`)
- 环境变量：`GITHUB_TOKEN`

## 执行步骤

### 1. 拉取客户数据
```bash
cd ~/.openclaw/workspace/mp-team-data
git pull origin main
cat data/customers.json
```

### 2. 解析用户输入
用户可能用自然语言描述拜访需求，例如：
- "明天去东莞拜访"
- "后天去苏州，最多拜访4家"
- "下周去青岛，优先高热客户"

从输入中提取：
- 目标城市/区域
- 拜访日期（默认明天）
- 每日最大拜访数（默认5家）
- 优先级偏好（高热优先/距离优先）

### 3. 筛选目标客户
根据区域筛选客户：
```python
target_customers = [c for c in customers if c.region == target_city]
# 按热度评分排序
target_customers.sort(key=lambda c: c.score, reverse=True)
# 取前 max_visits 家
selected = target_customers[:max_visits]
```

### 4. 计算最优顺序
**方式一：有地图 API**
```python
import requests

# 使用高德地图路径规划 API
def get_distance(origin, destination):
    url = "https://restapi.amap.com/v3/direction/driving"
    params = {
        "origin": f"{origin.lng},{origin.lat}",
        "destination": f"{destination.lng},{destination.lat}",
        "key": AMAP_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    return int(data["route"]["paths"][0]["duration"])  # 秒

# 贪心算法求解近似最优路线
def optimize_route(customers):
    # 以第一个客户为起点，每次选择最近的未访问客户
    route = [customers[0]]
    remaining = set(customers[1:])
    
    while remaining:
        current = route[-1]
        nearest = min(remaining, key=lambda c: get_distance(current, c))
        route.append(nearest)
        remaining.remove(nearest)
    
    return route
```

**方式二：无地图 API（按区域聚类）**
```python
def optimize_route_simple(customers):
    # 按热度排序（P0 优先）
    p0 = [c for c in customers if c.score >= 80]
    p1 = [c for c in customers if 60 <= c.score < 80]
    p2 = [c for c in customers if c.score < 60]
    
    # 同一优先级按区域聚类
    return p0 + p1 + p2
```

### 5. 生成路线计划
```json
{
  "id": "自动生成",
  "date": "2026-06-05",
  "region": "东莞",
  "stops": [
    {
      "sequence": 1,
      "customerId": "xxx",
      "customerName": "东莞匠运精密",
      "address": "东莞市长安镇",
      "time": "09:30-10:30",
      "distance": "-",
      "duration": "-",
      "priority": "P0",
      "talkingPoints": ["ALS-040ARN报价确认", "样品测试反馈"]
    },
    ...
  ],
  "totalDistance": "65km",
  "totalDrivingTime": "约2小时",
  "createdAt": "2026-06-04T20:00:00"
}
```

### 6. 生成时间表
为每个客户分配时间段：
- 第1站: 09:30-10:30（预留路上时间）
- 路上: 10:30-11:00（30分钟）
- 第2站: 11:00-12:00
- 午餐: 12:00-13:30
- 第3站: 13:30-14:30
- ...

### 7. 保存并推送
```bash
git add data/route-plans.json
git commit -m "route: 生成 {城市} 拜访路线 $(date '+%Y-%m-%d')"
git push origin main
```

### 8. 输出到终端
```
=== 拜访路线规划完成 ===
日期: {date}
区域: {region}
拜访家数: {N}家
预计总里程: {distance}
预计路上时间: {driving_time}

路线安排:
09:30 东莞匠运精密 (P0) - ALS-040ARN报价确认
11:00 东莞众鑫精密 (P0) - ALS-055ARN型号确认
12:00 午餐/休息
13:30 广东捷程数控 (P1) - SFC系列交期协调
...

高热客户覆盖率: 100%
效率提升预计: 40%
```

## 实战案例参考
**6月3日东莞案例**：
- 单日5家客户 + 1代理店
- 总里程65km
- 路上时间约2小时
- 高热客户覆盖率100%
- 效率提升约40%

## 注意事项
- 客户地址需要完整才能使用地图 API，否则按区域聚类
- 拜访时间预留应包含路上时间和会谈时间
- 午餐时间默认安排在12:00-13:30
- 如果某客户地址不详，在计划中标注"地址待确认"
- 路线规划结果仅供参考，实际执行需考虑交通状况

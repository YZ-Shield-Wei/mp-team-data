// ============================================
// GitHub API 工具层
// 通过 GitHub REST API 读写仓库中的 JSON 文件
// ============================================

import type { AppState, AppSettings, GitHubConfig, GitHubFileResponse } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';

// 生成请求头
function getHeaders(config: GitHubConfig) {
  return {
    Authorization: `token ${config.token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// 编码内容为 base64
function encodeContent(content: string): string {
  try {
    return btoa(unescape(encodeURIComponent(content)));
  } catch {
    // fallback
    return btoa(content);
  }
}

// 解码 base64 内容
function decodeContent(content: string): string {
  try {
    return decodeURIComponent(escape(atob(content)));
  } catch {
    return atob(content);
  }
}

// 获取文件路径
function getFilePath(filename: string): string {
  return `data/${filename}`;
}

// 读取仓库中的 JSON 文件
export async function readRepoFile(
  config: GitHubConfig,
  filename: string
): Promise<{ content: string; sha: string } | null> {
  const path = getFilePath(filename);
  const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(config),
    });

    if (response.status === 404) {
      return null; // 文件不存在
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API 错误: ${error.message}`);
    }

    const data: GitHubFileResponse = await response.json();
    return {
      content: decodeContent(data.content),
      sha: data.sha,
    };
  } catch (error) {
    console.error(`读取文件 ${filename} 失败:`, error);
    throw error;
  }
}

// 写入（创建或更新）仓库中的 JSON 文件
export async function writeRepoFile(
  config: GitHubConfig,
  filename: string,
  content: string,
  sha?: string
): Promise<void> {
  const path = getFilePath(filename);
  const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;

  const body: Record<string, string> = {
    message: `更新 ${filename} - ${new Date().toLocaleString('zh-CN')}`,
    content: encodeContent(content),
    branch: config.branch,
  };

  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(config),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.message?.includes('sha')) {
        throw new Error('文件已被其他人修改，请刷新后重试');
      }
      throw new Error(`GitHub API 错误: ${error.message}`);
    }
  } catch (error) {
    console.error(`写入文件 ${filename} 失败:`, error);
    throw error;
  }
}

// 删除仓库中的文件
export async function deleteRepoFile(
  config: GitHubConfig,
  filename: string,
  sha: string
): Promise<void> {
  const path = getFilePath(filename);
  const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(config),
      body: JSON.stringify({
        message: `删除 ${filename}`,
        sha,
        branch: config.branch,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API 错误: ${error.message}`);
    }
  } catch (error) {
    console.error(`删除文件 ${filename} 失败:`, error);
    throw error;
  }
}

// 验证 GitHub 配置是否有效
export async function validateGitHubConfig(config: GitHubConfig): Promise<boolean> {
  try {
    const url = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(config),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 初始化数据文件（如果不存在则创建空文件）
export async function initDataFiles(config: GitHubConfig): Promise<void> {
  const files = [
    { name: 'todos.json', defaultContent: '[]' },
    { name: 'customers.json', defaultContent: '[]' },
    { name: 'quotes.json', defaultContent: '[]' },
    { name: 'srm-orders.json', defaultContent: '[]' },
    { name: 'weekly-reports.json', defaultContent: '[]' },
    { name: 'weekly-analyses.json', defaultContent: '[]' },
    { name: 'route-plans.json', defaultContent: '[]' },
    { name: 'settings.json', defaultContent: '' },
  ];

  for (const file of files) {
    try {
      const existing = await readRepoFile(config, file.name);
      if (!existing) {
        let content = file.defaultContent;
        if (file.name === 'settings.json') {
          content = JSON.stringify({
            profitBaseline: 30,
            defaultMaxVisitsPerDay: 5,
            todoWarningHours: 24,
          } as AppSettings);
        }
        await writeRepoFile(config, file.name, content);
      }
    } catch (error) {
      console.warn(`初始化 ${file.name} 失败:`, error);
    }
  }
}

// 从 GitHub 加载完整应用状态
export async function loadAppState(config: GitHubConfig): Promise<Partial<AppState>> {
  const state: Partial<AppState> = {};

  const files: { key: keyof AppState; filename: string }[] = [
    { key: 'todos', filename: 'todos.json' },
    { key: 'customers', filename: 'customers.json' },
    { key: 'quotes', filename: 'quotes.json' },
    { key: 'srmOrders', filename: 'srm-orders.json' },
    { key: 'weeklyReports', filename: 'weekly-reports.json' },
    { key: 'weeklyAnalyses', filename: 'weekly-analyses.json' },
    { key: 'routePlans', filename: 'route-plans.json' },
  ];

  for (const { key, filename } of files) {
    try {
      const result = await readRepoFile(config, filename);
      if (result) {
        (state[key] as unknown) = JSON.parse(result.content);
      }
    } catch (error) {
      console.warn(`加载 ${filename} 失败:`, error);
    }
  }

  // 加载设置
  try {
    const result = await readRepoFile(config, 'settings.json');
    if (result) {
      state.settings = JSON.parse(result.content);
      state.settings!.githubConfig = config;
    }
  } catch (error) {
    console.warn('加载 settings.json 失败:', error);
  }

  return state;
}

// 保存完整应用状态到 GitHub
export async function saveAppState(config: GitHubConfig, state: AppState): Promise<void> {
  const files: { key: keyof AppState; filename: string }[] = [
    { key: 'todos', filename: 'todos.json' },
    { key: 'customers', filename: 'customers.json' },
    { key: 'quotes', filename: 'quotes.json' },
    { key: 'srmOrders', filename: 'srm-orders.json' },
    { key: 'weeklyReports', filename: 'weekly-reports.json' },
    { key: 'weeklyAnalyses', filename: 'weekly-analyses.json' },
    { key: 'routePlans', filename: 'route-plans.json' },
  ];

  // 先读取所有文件的当前 SHA
  const shaMap: Record<string, string> = {};
  for (const { filename } of files) {
    try {
      const result = await readRepoFile(config, filename);
      if (result) {
        shaMap[filename] = result.sha;
      }
    } catch {
      // 文件不存在，将创建新文件
    }
  }

  // 设置文件 SHA
  try {
    const result = await readRepoFile(config, 'settings.json');
    if (result) {
      shaMap['settings.json'] = result.sha;
    }
  } catch {
    // 忽略
  }

  // 并行写入所有文件
  const promises = files.map(async ({ key, filename }) => {
    const content = JSON.stringify(state[key] ?? [], null, 2);
    await writeRepoFile(config, filename, content, shaMap[filename]);
  });

  // 写入设置
  const settingsToSave = {
    ...state.settings,
    githubConfig: undefined, // 不保存 token 到仓库
  };
  promises.push(
    writeRepoFile(config, 'settings.json', JSON.stringify(settingsToSave, null, 2), shaMap['settings.json'])
  );

  await Promise.all(promises);
}

// 导出单表数据（用于保存特定模块的数据）
export async function saveSingleTable(
  config: GitHubConfig,
  filename: string,
  data: unknown[]
): Promise<void> {
  let sha: string | undefined;
  try {
    const result = await readRepoFile(config, filename);
    if (result) {
      sha = result.sha;
    }
  } catch {
    // 文件不存在
  }

  const content = JSON.stringify(data, null, 2);
  await writeRepoFile(config, filename, content, sha);
}

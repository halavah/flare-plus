# articles.json 配置文件说明

## 概述

`articles.json` 是整个网站的核心配置文件，控制着网站的基本信息展示和文章列表管理。它分为两个主要部分：

- `config` - 网站全局配置
- `articles` - 文章列表配置

## 文件结构

```json
{
  "config": {
    // 网站基础配置
    "siteName": "网站名称",
    "siteDescription": "网站描述",
    "githubUrl": "GitHub链接",
    "beianNumber": "备案号",
    "copyrightText": "版权信息",
    "adLink": "广告链接",
    "defaultViewMode": "默认视图模式"
  },
  "articles": [
    // 文章列表配置
    {
      "title": "文章标题",
      "description": "文章描述",
      "htmlFile": "HTML文件路径",
      "category": "文章分类"
    }
  ]
}
```

## 配置项详解

### config 部分

| 配置项 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `siteName` | string | ✅ | 网站名称，显示在导航栏和页面标题 |
| `siteDescription` | string | ✅ | 网站描述，用于 SEO 和页面介绍 |
| `githubUrl` | string | ✅ | GitHub 仓库链接，显示在导航栏 |
| `beianNumber` | string | ✅ | ICP 备案号，显示在页脚 |
| `copyrightText` | string | ✅ | 版权信息，显示在页脚 |
| `adLink` | string | ✅ | 广告链接 API 地址 |
| `defaultViewMode` | string | ✅ | 首页默认视图模式：`"table"` 或 `"list"` |

### defaultViewMode 详解

这是新添加的功能，用于控制首页文章的展示方式：

- **`"table"`** - 表格视图
  - 以表格形式展示文章信息
  - 显示标题、描述、分类等列
  - 信息密度高，适合技术文档类网站

- **`"list"`** - 列表视图
  - 以卡片形式展示文章
  - 每张卡片显示文章标题、描述和标签
  - 视觉效果好，适合博客类网站

### articles 部分

每个文章对象包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 文章标题，用于显示和搜索 |
| `description` | string | ✅ | 文章简介，在列表中显示 |
| `htmlFile` | string | ✅ | HTML 文件相对路径（相对于 `public/` 目录） |
| `category` | string | ✅ | 文章分类，用于筛选和分组 |

## 文件路径规范

HTML 文件应放置在 `public/` 目录下的各个章节文件夹中：

```
public/
├── chapter01/          # 安装指南
│   ├── 0101.xxx.html
│   └── 0102.xxx.html
├── chapter02/          # 使用技巧
│   ├── 0101.xxx.html
│   └── 0102.xxx.html
├── chapter03/          # 使用工具
│   ├── 0101.xxx.html
│   └── 0102.xxx.html
└── chapter05/          # 其他
    ├── 0101.xxx.html
    └── 0102.xxx.html
```

## 自动更新脚本

项目提供了两个自动更新脚本，用于扫描 HTML 文件并生成 `articles.json`：

- `bin/update-articles.sh` - macOS/Linux 系统
- `bin/update-articles.bat` - Windows 系统

### 使用方法

```bash
# macOS/Linux
./bin/update-articles.sh

# Windows
.\bin\update-articles.bat
```

**注意**：运行脚本会覆盖现有的 `articles.json` 文件，但会保留 `config` 部分的配置（包括 `defaultViewMode`）。

## 示例配置

```json
{
  "config": {
    "siteName": "我的技术博客",
    "siteDescription": "分享前端开发和技术心得",
    "githubUrl": "https://github.com/username",
    "beianNumber": "京ICP备12345678号",
    "copyrightText": "© 2025 我的博客. All rights reserved.",
    "adLink": "https://api.example.com",
    "defaultViewMode": "list"
  },
  "articles": [
    {
      "title": "Next.js 入门指南",
      "description": "从零开始学习 Next.js 框架",
      "htmlFile": "chapter01/0101.nextjs-guide.html",
      "category": "安装指南"
    },
    {
      "title": "React Hooks 实战",
      "description": "深入理解 React Hooks 的使用",
      "htmlFile": "chapter02/0101.react-hooks.html",
      "category": "使用技巧"
    }
  ]
}
```

## 注意事项

1. **文件编码**：确保 `articles.json` 文件使用 UTF-8 编码
2. **JSON 格式**：严格按照 JSON 格式编写，注意逗号和引号
3. **文件路径**：`htmlFile` 字段中的路径必须相对于 `public/` 目录
4. **自动更新**：使用自动更新脚本时，会自动从 HTML 文件提取 `title` 和 `description`
5. **配置同步**：两个更新脚本都已同步支持 `defaultViewMode` 配置

## 相关文件

- `bin/update-articles.sh` - macOS/Linux 自动更新脚本
- `bin/update-articles.bat` - Windows 自动更新脚本
- `public/` - HTML 文件存放目录
- `app/page.tsx` - 首页组件（读取此配置文件）
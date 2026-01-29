# Claude Code Windows 系统完整安装指南

## 📋 目录
- [系统要求](#系统要求)
- [前置准备](#前置准备)
- [安装步骤](#安装步骤)
- [环境配置](#环境配置)
- [API 配置](#api-配置)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [进阶配置](#进阶配置)

---

## 系统要求

### 最低配置
- **操作系统**: Windows 10 或更高版本
- **内存**: 至少 4GB RAM（推荐 8GB+）
- **存储空间**: 至少 500MB 可用空间
- **网络**: 需要互联网连接（用于 API 调用和更新）

### 必需软件
- **Git for Windows**: 原生安装版本依赖 Git Bash 运行环境(npm 安装方式不强制要求)
- **PowerShell 5.1+**: 用于执行安装脚本（Windows 10 内置）
- **Node.js**: 如果选择 npm 安装方式,需要安装 Node.js 环境

---

## 前置准备

### 步骤 1: 安装 Git for Windows (原生安装方式必需)

如果你计划使用**原生安装方式**（方式一或方式二）,Claude Code 在 Windows 上需要 Git Bash 才能正常运行,这是最重要的前置条件。

> **注意**: 如果你选择使用 npm 安装方式(方式三),可以跳过此步骤,不强制要求安装 Git for Windows。

#### 下载 Git for Windows

1. 访问官方下载页面: [https://git-scm.com/downloads/win](https://git-scm.com/downloads/win)
2. 下载最新的 64 位安装包（通常命名为 `Git-<version>-64-bit.exe`）
3. 文件大小约 50MB,下载时间取决于网络速度

#### 安装 Git for Windows

1. 双击下载的安装包
2. 在安装向导中,建议使用以下配置:
   - **选择组件**: 保持默认选项,确保勾选 "Git Bash Here"
   - **默认编辑器**: 选择你喜欢的编辑器（如 Vim、Notepad++、VS Code）
   - **PATH 环境变量**: 选择 "Git from the command line and also from 3rd-party software"
   - **HTTPS 传输后端**: 选择 "Use the OpenSSL library"
   - **换行符转换**: 选择 "Checkout Windows-style, commit Unix-style line endings"
   - **终端模拟器**: 选择 "Use MinTTY (the default terminal of MSYS2)"
   - **其他选项**: 保持默认

3. 点击 "Install" 开始安装
4. 安装完成后,点击 "Finish"

#### 验证 Git Bash 安装

1. 在开始菜单搜索 "Git Bash"
2. 打开 Git Bash,应该看到类似 Linux 的命令行界面
3. 输入以下命令验证:
   ```bash
   git --version
   ```
4. 如果显示 Git 版本号(如 `git version 2.43.0.windows.1`),说明安装成功

---

## 安装步骤

Windows 系统提供多种安装 Claude Code 的方式,可根据需求选择。

### 方式一: 使用 PowerShell 原生安装（推荐）

这是最简单快捷的安装方式,适合大多数用户。

#### 步骤 1: 打开 PowerShell

1. 按 `Win + X` 键
2. 选择 "Windows PowerShell" 或 "终端"
3. 或者在开始菜单搜索 "PowerShell" 并打开

> **注意**: 不需要以管理员身份运行,普通用户权限即可。

#### 步骤 2: 执行安装命令

在 PowerShell 中运行以下命令:

**安装最新稳定版本**:
```powershell
irm https://claude.ai/install.ps1 | iex
```

**安装指定版本**:
```powershell
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 1.0.58
```

**安装最新开发版**:
```powershell
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) latest
```

#### 步骤 3: 等待安装完成

- 安装脚本会自动下载 Claude Code 二进制文件
- 文件将被安装到 `C:\Users\<你的用户名>\.local\bin\` 目录
- 整个过程通常需要 30 秒到 2 分钟,取决于网络速度

**安装过程示例输出**:
```
Downloading Claude Code...
Installing to C:\Users\YourName\.local\bin\
Claude Code installed successfully!
```

---

### 方式二: 使用 CMD 命令提示符安装

如果你更习惯使用传统的命令提示符,也可以使用这种方式。

#### 步骤 1: 打开命令提示符

1. 按 `Win + R` 键
2. 输入 `cmd` 并按回车
3. 或在开始菜单搜索 "命令提示符" 并打开

#### 步骤 2: 执行安装命令

**安装稳定版本**:
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**安装最新版本**:
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd latest && del install.cmd
```

**安装指定版本**:
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd 1.0.58 && del install.cmd
```

---

### 方式三: 使用 Node.js/npm 安装

如果你是开发者或需要使用 npm 包管理器,可以通过 Node.js 环境安装 Claude Code。

#### 步骤 1: 安装 Node.js 环境

##### 方法一: 官网下载（推荐）

1. 打开浏览器访问 [https://nodejs.org/](https://nodejs.org/)
2. 点击 "LTS" 版本进行下载（推荐长期支持版本）
3. 下载完成后双击 `.msi` 文件
4. 按照安装向导完成安装,保持默认设置即可

##### 方法二: 使用包管理器

如果安装了 Chocolatey 或 Scoop,可以使用命令行安装:

**使用 Chocolatey**:
```powershell
choco install nodejs
```

**使用 Scoop**:
```powershell
scoop install nodejs
```

##### 验证 Node.js 安装

安装完成后,打开 PowerShell 或 CMD,输入以下命令:

```bash
node --version
npm --version
```

如果显示版本号,说明安装成功。

#### 步骤 2: 安装 Claude Code

打开 PowerShell 或 CMD,运行以下命令:

**全局安装 Claude Code**:
```bash
npm install -g @anthropic-ai/claude-code
```

**如果遇到权限问题**,以管理员身份运行 PowerShell:
```powershell
# 右键点击 PowerShell 图标,选择"以管理员身份运行"
npm install -g @anthropic-ai/claude-code
```

#### 步骤 3: 验证 Claude Code 安装

安装完成后,输入以下命令检查是否安装成功:

```bash
claude --version
```

如果显示版本号,说明 Claude Code 已成功安装。

#### Node.js 安装注意事项

- **建议使用 PowerShell** 而不是 CMD
- **npm 版本可在 PowerShell/CMD 运行**: 通过 npm 安装的版本可以直接在 PowerShell 或 CMD 中使用,不强制要求 Git Bash
- **原生版本需要 Git Bash**: 使用原生安装脚本安装的版本必须在 Git Bash 中运行
- **杀毒软件**: 某些杀毒软件可能会误报,需要添加白名单
- **权限问题**: 如果遇到权限错误,尝试以管理员身份运行
- **更新 Claude Code**: 使用 `npm update -g @anthropic-ai/claude-code`
- **卸载 Claude Code**: 使用 `npm uninstall -g @anthropic-ai/claude-code`

---

## 环境配置

安装完成后,需要配置环境变量让系统能够找到 `claude` 命令。

### 配置 PATH 环境变量

#### 方法一: 使用 PowerShell 一键配置（推荐）

打开 PowerShell,运行以下命令:

```powershell
# 将 Claude Code 添加到用户 PATH 环境变量（永久有效）
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.local\bin", "User")

# 在当前会话立即生效
$env:Path += ";$env:USERPROFILE\.local\bin"
```

> **重要提示**:
> - `$env:USERPROFILE` 会自动替换为你的用户目录
> - 如果你的用户名包含中文或特殊字符,路径会自动正确处理

#### 方法二: 通过系统设置手动配置

如果你希望通过图形界面配置,请按照以下步骤:

1. **打开系统属性**:
   - 按 `Win + R` 键
   - 输入 `sysdm.cpl` 并按回车

2. **进入环境变量设置**:
   - 点击 "高级" 标签
   - 点击 "环境变量" 按钮

3. **编辑用户 PATH**:
   - 在 "用户变量" 区域,找到 `Path` 变量
   - 选中它,点击 "编辑"

4. **添加 Claude Code 路径**:
   - 点击 "新建" 按钮
   - 输入: `C:\Users\<你的用户名>\.local\bin`
   - 例如: `C:\Users\Administrator\.local\bin`

5. **保存设置**:
   - 点击 "确定" 保存所有对话框
   - **重要**: 重启所有已打开的终端窗口使配置生效

#### 验证 PATH 配置

配置完成后,打开**新的** PowerShell 或 Git Bash 窗口,运行:

```bash
echo $env:Path
```

检查输出中是否包含 `.local\bin` 路径。

---

## API 配置

Claude Code 需要 Anthropic API Key 才能正常工作。根据你的网络环境,可以选择直连官方 API 或使用中转服务。

### 获取 API Key

#### 官方 API (需要国际网络)
1. 访问 [https://console.anthropic.com/](https://console.anthropic.com/)
2. 登录或注册账号
3. 进入 "API Keys" 页面
4. 点击 "Create Key" 创建新的 API 密钥
5. 复制生成的密钥（格式: `sk-ant-api03-...`）

#### 中转 API (国内推荐)
如果你在中国大陆无法直接访问 Anthropic API,可以使用中转服务:
- 访问中转服务商网站(如 https://api.nekoapi.com/)
- 注册账号并充值
- 获取中转 API Key 和 Base URL

### 配置方式

Windows 系统推荐使用 PowerShell 配置环境变量。

#### 方法一: PowerShell 环境变量配置（推荐）

##### 临时配置（当前会话有效）

```powershell
# 设置 API Base URL（使用中转服务时需要）
$env:ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"

# 设置 API Key
$env:ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"

# 设置 Auth Token（与 API Key 保持一致）
$env:ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的密钥"
```

##### 永久配置（系统级）

```powershell
# 永久设置到用户环境变量
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.claudecode.net.cn/api/claudecode", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-api03-你的密钥", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "sk-ant-api03-你的密钥", "User")
```

执行后,重启终端窗口使配置生效。

#### 方法二: 配置文件方式

创建或编辑配置文件 `C:\Users\<你的用户名>\.claude\settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.claudecode.net.cn/api/claudecode",
    "ANTHROPIC_API_KEY": "sk-ant-api03-你的密钥",
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-api03-你的密钥"
  }
}
```

**创建配置文件的步骤**:

1. 打开 PowerShell 或 Git Bash
2. 创建 `.claude` 目录（如果不存在）:
   ```powershell
   New-Item -Path "$env:USERPROFILE\.claude" -ItemType Directory -Force
   ```
3. 使用文本编辑器创建 `settings.json`:
   ```powershell
   notepad "$env:USERPROFILE\.claude\settings.json"
   ```
4. 粘贴上面的 JSON 内容并保存

#### 方法三: 系统环境变量界面配置

1. 按 `Win + R`,输入 `sysdm.cpl` 打开系统属性
2. 点击 "高级" → "环境变量"
3. 在 "用户变量" 区域点击 "新建",依次添加:

| 变量名 | 变量值 |
|--------|--------|
| `ANTHROPIC_BASE_URL` | `https://api.claudecode.net.cn/api/claudecode` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-你的密钥` |
| `ANTHROPIC_AUTH_TOKEN` | `sk-ant-api03-你的密钥` |

4. 点击 "确定" 保存所有更改
5. **重启所有终端窗口**使配置生效

### 配置说明

- **ANTHROPIC_BASE_URL**: API 服务器地址
  - 官方 API: `https://api.anthropic.com` 或不设置此项
  - 中转服务: 使用中转商提供的 URL

- **ANTHROPIC_API_KEY**: 你的 API 密钥
  - 格式通常为 `sk-ant-api03-` 开头

- **ANTHROPIC_AUTH_TOKEN**: 认证令牌
  - 通常与 API KEY 相同

---

### 配置 Gemini CLI 环境变量（可选）

如果你需要使用 Google Gemini CLI 功能,需要额外配置相关环境变量。

#### PowerShell 临时设置

```powershell
$env:CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"
$env:GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
$env:GOOGLE_GENAI_USE_GCA="true"
```

#### PowerShell 永久设置（用户级）

```powershell
[Environment]::SetEnvironmentVariable("CODE_ASSIST_ENDPOINT", "https://claude-code.pseudoyu.com/gemini", "User")
[Environment]::SetEnvironmentVariable("GOOGLE_CLOUD_ACCESS_TOKEN", "你的API密钥", "User")
[Environment]::SetEnvironmentVariable("GOOGLE_GENAI_USE_GCA", "true", "User")
```

**设置后需要重新打开 PowerShell 窗口**才能生效。

#### 验证 Gemini CLI 环境变量

在 PowerShell 中验证:

```powershell
echo $env:CODE_ASSIST_ENDPOINT
echo $env:GOOGLE_CLOUD_ACCESS_TOKEN
echo $env:GOOGLE_GENAI_USE_GCA
```

在 CMD 中验证:

```cmd
echo %CODE_ASSIST_ENDPOINT%
echo %GOOGLE_CLOUD_ACCESS_TOKEN%
echo %GOOGLE_GENAI_USE_GCA%
```

**预期输出示例**:
```
https://claude-code.pseudoyu.com/gemini
cr_xxxxxxxxxxxxxxxxxx
true
```

---

### 配置 Codex 环境变量（可选）

如果你需要使用 OpenAI Codex 功能,需要创建 Codex 配置文件。

#### 创建 Codex 配置文件

在 `~/.codex/config.toml` 文件中添加以下配置:

**步骤 1**: 创建 `.codex` 目录

```powershell
New-Item -Path "$env:USERPROFILE\.codex" -ItemType Directory -Force
```

**步骤 2**: 创建 `config.toml` 文件

```powershell
notepad "$env:USERPROFILE\.codex\config.toml"
```

**步骤 3**: 在 Notepad 中添加以下内容:

```toml
model_provider = "crs"
model = "gpt-5"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.crs]
name = "crs"
base_url = "https://claude-code.pseudoyu.com/openai"
wire_api = "responses"
```

保存并关闭文件。

#### 配置 Codex API 密钥

在 `~/.codex/auth.json` 文件中配置 API 密钥:

**步骤 1**: 创建 `auth.json` 文件

```powershell
notepad "$env:USERPROFILE\.codex\auth.json"
```

**步骤 2**: 添加以下内容:

```json
{
    "OPENAI_API_KEY": "你的API密钥"
}
```

> **注意**: 使用与 Claude Code 相同的 API 密钥。

**步骤 3**: 保存文件

确保文件保存为 UTF-8 编码格式。

#### 验证 Codex 配置

检查配置文件是否创建成功:

```powershell
# 查看配置文件内容
cat "$env:USERPROFILE\.codex\config.toml"
cat "$env:USERPROFILE\.codex\auth.json"
```

---

## 验证安装

配置完成后,需要验证 Claude Code 是否正确安装并可以正常使用。

### 步骤 1: 打开终端

**如果使用原生安装**:
- 在开始菜单搜索并打开 "Git Bash"
- **重要**: 原生安装版本必须在 Git Bash 中运行,不能直接在 PowerShell 或 CMD 中使用

**如果使用 npm 安装**:
- 可以使用 PowerShell、CMD 或 Git Bash
- 推荐使用 PowerShell

### 步骤 2: 检查版本

```bash
claude --version
```

**预期输出**:
```
Claude Code v1.0.58
```

如果看到版本号,说明 Claude Code 已成功安装。

### 步骤 3: 查看帮助信息

```bash
claude --help
```

**预期输出**:
```
Usage: claude [options] [prompt]

Options:
  -v, --version        Output the version number
  -h, --help           Display help for command
  ...
```

### 步骤 4: 系统诊断

```bash
claude doctor
```

此命令会检查:
- Claude Code 版本
- 安装类型（原生 vs npm）
- API 配置状态
- 网络连接
- 依赖环境

**预期输出示例**:
```
✓ Claude Code version: 1.0.58
✓ Installation type: Native
✓ API configured: Yes
✓ Base URL: https://api.claudecode.net.cn/api/claudecode
✓ Git Bash: Available
✓ Network: Connected
```

### 步骤 5: 测试运行

```bash
claude "Hello, Claude!"
```

如果一切正常,Claude 会回复你的问候,说明 API 配置正确且可以正常调用。

---

## 常见问题

### Q1: 提示 "claude: command not found"

**原因**: PATH 环境变量未正确配置或终端未重启。

**解决方法**:
1. 检查 PATH 是否包含 `.local\bin` 目录:
   ```bash
   echo $PATH
   ```
2. 如果不包含,重新按照 [配置 PATH 环境变量](#配置-path-环境变量) 步骤操作
3. **必须重启终端窗口**才能生效
4. 确保在 Git Bash 中运行,不是在 PowerShell 或 CMD

### Q2: 提示 "bash: claude: command not found"（在 Git Bash 中）

**原因**: Claude Code 安装路径不在 Git Bash 的 PATH 中。

**解决方法**:
1. 在 Git Bash 中手动添加路径:
   ```bash
   export PATH="$PATH:/c/Users/<你的用户名>/.local/bin"
   ```
2. 永久添加,编辑 `~/.bashrc`:
   ```bash
   echo 'export PATH="$PATH:/c/Users/$USER/.local/bin"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Q3: API Key 无效或无法连接

**症状**: 运行 `claude "test"` 时提示认证失败或网络错误。

**解决方法**:
1. 检查 API Key 格式是否正确（应以 `sk-ant-api03-` 开头）
2. 验证环境变量是否设置:
   ```bash
   echo $ANTHROPIC_API_KEY
   echo $ANTHROPIC_BASE_URL
   ```
3. 如果为空,重新按照 [API 配置](#api-配置) 步骤操作
4. 如果使用中转服务,确认 Base URL 是否正确
5. 运行 `claude doctor` 检查配置状态

### Q4: Git Bash 中文乱码

**解决方法**:
1. 在 Git Bash 中右键点击标题栏 → Options
2. 进入 "Text" 设置
3. 将 "Character set" 改为 "UTF-8"
4. 保存并重启 Git Bash

### Q5: 安装过程中网络超时

**症状**: 下载安装脚本或二进制文件时超时。

**解决方法**:
1. 检查网络连接
2. 如果在国内,可能需要使用代理:
   ```powershell
   # 设置代理（替换为你的代理地址）
   $env:HTTP_PROXY="http://127.0.0.1:7890"
   $env:HTTPS_PROXY="http://127.0.0.1:7890"
   ```
3. 重新运行安装命令

### Q6: 权限不足错误

**症状**: 安装时提示 "Access Denied" 或权限错误。

**解决方法**:
1. 确保安装目录 `C:\Users\<你的用户名>\.local\bin` 存在且有写入权限
2. 如果不存在,手动创建:
   ```powershell
   New-Item -Path "$env:USERPROFILE\.local\bin" -ItemType Directory -Force
   ```
3. 不要安装到 `C:\Program Files` 等系统目录

### Q7: 杀毒软件误报

**症状**: 安装或运行时被杀毒软件拦截。

**解决方法**:
1. 将 `.local\bin\claude.exe` 添加到杀毒软件白名单
2. 或暂时关闭实时保护,完成安装后再开启

---

## 进阶配置

### 配置 Shell 环境

#### 在 Git Bash 中使用 Bash 配置

编辑 `~/.bashrc` 添加个性化配置:

```bash
# Claude Code 别名
alias cc='claude'
alias ccd='claude doctor'

# 自动补全（如果支持）
eval "$(claude --bash-completion)"
```

使配置生效:
```bash
source ~/.bashrc
```

### 配置代理

如果需要通过代理访问 API:

```powershell
# PowerShell 中设置代理
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"

# 或者在配置文件中设置
```

在 `settings.json` 中:
```json
{
  "env": {
    "HTTP_PROXY": "http://127.0.0.1:7890",
    "HTTPS_PROXY": "http://127.0.0.1:7890"
  }
}
```

### 禁用自动更新

如果你想完全控制更新时机:

```powershell
# PowerShell
[Environment]::SetEnvironmentVariable("DISABLE_AUTOUPDATER", "1", "User")
```

或在 `settings.json` 中:
```json
{
  "DISABLE_AUTOUPDATER": "1"
}
```

### 手动更新 Claude Code

```bash
claude update
```

### 卸载 Claude Code

1. 删除二进制文件:
   ```powershell
   Remove-Item "$env:USERPROFILE\.local\bin\claude.exe" -Force
   ```

2. 删除配置文件（可选）:
   ```powershell
   Remove-Item "$env:USERPROFILE\.claude" -Recurse -Force
   ```

3. 清理 PATH 环境变量:
   - 打开系统环境变量设置
   - 从 PATH 中移除 `.local\bin` 路径

---

## 总结

完成上述步骤后,你已经在 Windows 系统上成功安装并配置了 Claude Code。现在你可以:

1. 在任意项目目录打开 Git Bash
2. 运行 `claude` 启动交互式会话
3. 或直接运行 `claude "你的问题"` 获取即时回答

**快速命令参考**:
```bash
claude                    # 启动交互式会话
claude "帮我写一个 Python 脚本"  # 直接提问
claude --version          # 查看版本
claude doctor             # 系统诊断
claude update             # 更新 Claude Code
claude --help             # 查看帮助
```

**下一步建议**:
- 阅读[官方文档](https://code.claude.com/docs)了解更多功能
- 尝试在实际项目中使用 Claude Code
- 探索自定义配置和工作流

如遇到其他问题,请参考[常见问题](#常见问题)章节或查阅官方文档。

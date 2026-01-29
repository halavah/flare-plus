# Claude Code macOS 系统完整安装指南

## 📋 目录
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [环境配置](#环境配置)
- [API 配置](#api-配置)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [进阶配置](#进阶配置)

---

## 系统要求

### 最低配置
- **操作系统**: macOS 10.15 (Catalina) 或更高版本
- **内存**: 至少 4GB RAM(推荐 8GB+)
- **存储空间**: 至少 500MB 可用空间
- **网络**: 需要互联网连接(用于 API 调用和更新)
- **处理器**: Intel 或 Apple Silicon (M1/M2/M3) 芯片

### 推荐配置
- **操作系统**: macOS 13 (Ventura) 或更高版本
- **内存**: 8GB+ RAM
- **处理器**: Apple Silicon (M1 及以上)可获得最佳性能

### 必需软件
- **Terminal**: macOS 内置,无需额外安装
- **Shell**: Bash、Zsh(macOS 默认)或 Fish
- **Homebrew**: 可选,但推荐安装以便于软件管理

---

## 安装步骤

macOS 系统提供多种安装方式,你可以根据自己的喜好选择。

### 方式一: 一键安装脚本(推荐)

这是最简单快速的安装方式,适合大多数用户。

#### 步骤 1: 打开终端

1. 按 `Command + 空格` 打开 Spotlight 搜索
2. 输入 "Terminal" 或"终端"
3. 按回车打开终端应用

#### 步骤 2: 执行安装命令

在终端中运行以下命令:

**安装最新稳定版本**:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**安装指定版本**:
```bash
curl -fsSL https://claude.ai/install.sh | bash -s 1.0.58
```

**安装最新开发版**:
```bash
curl -fsSL https://claude.ai/install.sh | bash -s latest
```

#### 步骤 3: 等待安装完成

- 安装脚本会自动下载 Claude Code 二进制文件
- 文件将被安装到 `~/.local/bin/` 目录
- 整个过程通常需要 30 秒到 2 分钟,取决于网络速度

**安装过程示例输出**:
```
Downloading Claude Code...
Installing to /Users/yourname/.local/bin/
Claude Code installed successfully!
```

---

### 方式二: 使用 Homebrew 安装

如果你已经安装了 Homebrew,可以使用这种方式进行安装和管理。

#### 步骤 1: 安装 Homebrew(如果尚未安装)

如果你还没有安装 Homebrew,先运行以下命令安装:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 步骤 2: 使用 Homebrew 安装 Claude Code

```bash
brew install --cask claude-code
```

#### 步骤 3: 更新 Claude Code(使用 Homebrew)

使用 Homebrew 安装的好处是可以统一管理所有软件的更新:

```bash
# 更新 Homebrew 软件列表
brew update

# 升级 Claude Code
brew upgrade --cask claude-code

# 或一次性升级所有软件
brew upgrade
```

---

### 方式三: 手动下载安装

如果你需要离线安装或想要更多控制权,可以手动下载安装。

#### 步骤 1: 下载二进制文件

1. 访问 Claude Code 的 GitHub Releases 页面
2. 下载适合你系统的版本:
   - **Intel Mac**: 下载 `claude-darwin-x64` 文件
   - **Apple Silicon (M1/M2/M3)**: 下载 `claude-darwin-arm64` 文件

#### 步骤 2: 安装到本地目录

```bash
# 创建安装目录(如果不存在)
mkdir -p ~/.local/bin

# 移动下载的文件并重命名
mv ~/Downloads/claude-darwin-* ~/.local/bin/claude

# 添加执行权限
chmod +x ~/.local/bin/claude
```

---

### 方式四: 使用 Node.js/npm 安装

如果你是开发者或需要使用 npm 包管理器,可以通过 Node.js 环境安装 Claude Code。

#### 步骤 1: 安装 Node.js 环境

##### 方法一: 使用 Homebrew（推荐）

如果已安装 Homebrew:

```bash
# 更新 Homebrew
brew update

# 安装 Node.js
brew install node
```

##### 方法二: 官网下载

1. 访问 [https://nodejs.org/](https://nodejs.org/)
2. 下载适合 macOS 的 LTS 版本
3. 打开下载的 `.pkg` 文件
4. 按照安装程序指引完成安装

##### 验证 Node.js 安装

```bash
node --version
npm --version
```

如果显示版本号,说明安装成功。

#### 步骤 2: 安装 Claude Code

在终端中运行以下命令:

```bash
# 全局安装 Claude Code
npm install -g @anthropic-ai/claude-code
```

**如果遇到权限问题**,可以使用 sudo:

```bash
sudo npm install -g @anthropic-ai/claude-code
```

#### 步骤 3: 验证 Claude Code 安装

```bash
claude --version
```

如果显示版本号,说明 Claude Code 已成功安装。

#### macOS 注意事项

- **权限问题**: 如果遇到权限错误,尝试使用 `sudo` 安装
- **首次运行**: 可能需要在"系统偏好设置"中允许运行
- **推荐终端**: 建议使用 Terminal 或 iTerm2
- **更新 Claude Code**: 使用 `npm update -g @anthropic-ai/claude-code`
- **卸载 Claude Code**: 使用 `npm uninstall -g @anthropic-ai/claude-code`

---

## 环境配置

安装完成后,需要配置环境变量让系统能够找到 `claude` 命令。

### 配置 PATH 环境变量

#### 确认当前使用的 Shell

macOS 系统默认使用 Zsh(从 macOS Catalina 开始),但你可以确认一下:

```bash
echo $SHELL
```

输出示例:
- `/bin/zsh` - 使用 Zsh
- `/bin/bash` - 使用 Bash

#### 方法一: 配置 Zsh(macOS 默认)

如果你使用 Zsh,编辑 `~/.zshrc` 文件:

```bash
# 使用 nano 编辑器打开配置文件
nano ~/.zshrc
```

在文件末尾添加以下内容:

```bash
# 添加 Claude Code 到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

保存并退出(在 nano 中按 `Ctrl + O` 保存,`Ctrl + X` 退出)。

使配置立即生效:

```bash
source ~/.zshrc
```

#### 方法二: 配置 Bash

如果你使用 Bash,编辑 `~/.bash_profile` 或 `~/.bashrc`:

```bash
# 编辑配置文件
nano ~/.bash_profile
```

添加以下内容:

```bash
# 添加 Claude Code 到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

保存并使配置生效:

```bash
source ~/.bash_profile
```

#### 方法三: 一键配置(自动检测 Shell)

运行以下命令会自动检测你的 Shell 并配置:

```bash
# 自动添加到 PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.$(basename $SHELL)rc
source ~/.$(basename $SHELL)rc
```

#### 验证 PATH 配置

配置完成后,运行以下命令验证:

```bash
echo $PATH
```

检查输出中是否包含 `.local/bin` 路径。

---

## API 配置

Claude Code 需要 Anthropic API Key 才能正常工作。根据你的网络环境,可以选择直连官方 API 或使用中转服务。

### 获取 API Key

#### 官方 API

1. 访问 [https://console.anthropic.com/](https://console.anthropic.com/)
2. 登录或注册账号
3. 进入 "API Keys" 页面
4. 点击 "Create Key" 创建新的 API 密钥
5. 复制生成的密钥(格式: `sk-ant-api03-...`)

#### 中转 API(国内推荐)

如果你在中国大陆无法直接访问 Anthropic API,可以使用中转服务:
- 访问中转服务商网站(如 https://api.nekoapi.com/)
- 注册账号并充值
- 获取中转 API Key 和 Base URL

### 配置方式

macOS 系统推荐使用 Shell 配置文件进行环境变量配置。

#### 方法一: Shell 配置文件(推荐)

##### 使用 Zsh(macOS 默认)

编辑 `~/.zshrc` 文件:

```bash
nano ~/.zshrc
```

在文件末尾添加:

```bash
# Claude Code API 配置
export ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"

# 如果使用中转服务,还需要设置 Base URL
export ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"

# Auth Token(与 API Key 保持一致)
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的密钥"
```

保存并使配置生效:

```bash
source ~/.zshrc
```

##### 使用 Bash

编辑 `~/.bash_profile`:

```bash
nano ~/.bash_profile
```

添加相同的环境变量配置,保存后运行:

```bash
source ~/.bash_profile
```

#### 方法二: 配置文件方式

创建或编辑配置文件 `~/.claude/settings.json`:

```bash
# 创建 .claude 目录(如果不存在)
mkdir -p ~/.claude

# 创建配置文件
nano ~/.claude/settings.json
```

添加以下内容:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.claudecode.net.cn/api/claudecode",
    "ANTHROPIC_API_KEY": "sk-ant-api03-你的密钥",
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-api03-你的密钥"
  }
}
```

#### 方法三: 临时配置(当前终端会话)

如果只想临时测试,可以在当前终端会话中设置:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"
export ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的密钥"
```

> **注意**: 这种方式只在当前终端窗口有效,关闭后失效。

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

#### Terminal 设置方法（临时）

```bash
export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

#### 永久设置方法

##### 对于 Zsh (默认)

```bash
echo 'export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"' >> ~/.zshrc
echo 'export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"' >> ~/.zshrc
echo 'export GOOGLE_GENAI_USE_GCA="true"' >> ~/.zshrc
source ~/.zshrc
```

##### 对于 Bash

```bash
echo 'export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"' >> ~/.bash_profile
echo 'export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"' >> ~/.bash_profile
echo 'export GOOGLE_GENAI_USE_GCA="true"' >> ~/.bash_profile
source ~/.bash_profile
```

#### 验证 Gemini CLI 环境变量

```bash
echo $CODE_ASSIST_ENDPOINT
echo $GOOGLE_CLOUD_ACCESS_TOKEN
echo $GOOGLE_GENAI_USE_GCA
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

#### Codex 配置文件

在 `~/.codex/config.toml` 文件中添加以下配置:

```bash
# 创建 .codex 目录
mkdir -p ~/.codex

# 创建并编辑配置文件
nano ~/.codex/config.toml
```

添加以下内容:

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

保存文件(在 nano 中按 `Ctrl + O` 保存,`Ctrl + X` 退出)。

#### 配置 Codex API 密钥

在 `~/.codex/auth.json` 文件中配置 API 密钥:

```bash
# 创建并编辑 auth.json
nano ~/.codex/auth.json
```

添加以下内容:

```json
{
    "OPENAI_API_KEY": "你的API密钥"
}
```

> **注意**: 使用与 Claude Code 相同的 API 密钥。

保存文件。

#### 验证 Codex 配置

```bash
# 查看配置文件内容
cat ~/.codex/config.toml
cat ~/.codex/auth.json
```

---

## 验证安装

配置完成后,需要验证 Claude Code 是否正确安装并可以正常使用。

### 步骤 1: 打开新的终端窗口

**重要**: 必须打开新的终端窗口,让环境变量配置生效。

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
- 安装类型(原生 vs npm)
- API 配置状态
- 网络连接
- 依赖环境

**预期输出示例**:
```
✓ Claude Code version: 1.0.58
✓ Installation type: Native
✓ API configured: Yes
✓ Base URL: https://api.claudecode.net.cn/api/claudecode
✓ Shell: Zsh
✓ Network: Connected
```

### 步骤 5: 测试运行

```bash
claude "你好,Claude!"
```

如果一切正常,Claude 会回复你的问候,说明 API 配置正确且可以正常调用。

---

## 常见问题

### Q1: 提示 "command not found: claude"

**原因**: PATH 环境变量未正确配置或终端未重启。

**解决方法**:
1. 检查 PATH 是否包含 `.local/bin` 目录:
   ```bash
   echo $PATH | grep ".local/bin"
   ```
2. 如果不包含,重新按照 [配置 PATH 环境变量](#配置-path-环境变量) 步骤操作
3. **必须打开新的终端窗口**才能生效
4. 验证配置文件是否正确:
   ```bash
   cat ~/.zshrc | grep "\.local/bin"
   ```

### Q2: macOS 阻止运行提示 "无法验证开发者"

**原因**: macOS Gatekeeper 安全机制阻止未签名的应用。

**解决方法**:

**方法一: 允许运行此应用**
1. 打开 "系统设置" → "隐私与安全性"
2. 在 "安全性" 部分找到被阻止的应用提示
3. 点击 "仍要打开"

**方法二: 移除隔离属性**
```bash
xattr -d com.apple.quarantine ~/.local/bin/claude
```

**方法三: 允许来自任何来源的应用(不推荐)**
```bash
sudo spctl --master-disable
```

### Q3: API Key 无效或无法连接

**症状**: 运行 `claude "test"` 时提示认证失败或网络错误。

**解决方法**:
1. 检查 API Key 格式是否正确(应以 `sk-ant-api03-` 开头)
2. 验证环境变量是否设置:
   ```bash
   echo $ANTHROPIC_API_KEY
   echo $ANTHROPIC_BASE_URL
   ```
3. 如果为空,重新按照 [API 配置](#api-配置) 步骤操作
4. 确保在新的终端窗口中运行
5. 运行 `claude doctor` 检查配置状态

### Q4: Homebrew 安装失败

**症状**: 运行 `brew install --cask claude-code` 时报错。

**解决方法**:
1. 更新 Homebrew:
   ```bash
   brew update
   ```
2. 清理缓存:
   ```bash
   brew cleanup
   ```
3. 重试安装:
   ```bash
   brew install --cask claude-code
   ```
4. 如果仍然失败,使用一键安装脚本代替

### Q5: 权限被拒绝错误

**症状**: 安装或运行时提示 "Permission denied"。

**解决方法**:
1. 确保安装目录有写入权限:
   ```bash
   ls -la ~/.local/bin
   ```
2. 如果目录不存在,创建它:
   ```bash
   mkdir -p ~/.local/bin
   ```
3. 确保 claude 文件有执行权限:
   ```bash
   chmod +x ~/.local/bin/claude
   ```

### Q6: Intel Mac 和 Apple Silicon 架构问题

**症状**: 下载的文件无法运行或提示架构不匹配。

**解决方法**:
1. 确认你的 Mac 架构:
   ```bash
   uname -m
   ```
   - `x86_64` = Intel Mac
   - `arm64` = Apple Silicon (M1/M2/M3)
2. 确保下载了正确的版本
3. 使用一键安装脚本会自动检测架构

### Q7: 更新后版本未变化

**症状**: 运行 `claude update` 后版本号没有更新。

**解决方法**:
1. 完全退出所有终端窗口
2. 重新打开终端
3. 检查版本:
   ```bash
   claude --version
   ```
4. 如果使用 Homebrew 安装,使用 Homebrew 更新:
   ```bash
   brew upgrade --cask claude-code
   ```

---

## 进阶配置

### 配置 Shell 别名

为了更方便地使用 Claude Code,可以配置一些别名。

编辑 `~/.zshrc` 或 `~/.bash_profile`:

```bash
# Claude Code 别名
alias cc='claude'
alias ccd='claude doctor'
alias ccu='claude update'

# 快速启动 Claude Code 并询问问题
ask() {
  claude "$@"
}
```

使配置生效:

```bash
source ~/.zshrc  # 或 source ~/.bash_profile
```

现在你可以使用:
```bash
cc "帮我写一个函数"    # 代替 claude
ccd                    # 代替 claude doctor
ask "什么是递归?"      # 快速提问
```

### 配置代理

如果需要通过代理访问 API,在 Shell 配置文件中添加:

```bash
# 代理配置
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"
```

或在 `~/.claude/settings.json` 中配置:

```json
{
  "env": {
    "HTTP_PROXY": "http://127.0.0.1:7890",
    "HTTPS_PROXY": "http://127.0.0.1:7890"
  }
}
```

### 自定义模型配置

在 `~/.claude/settings.json` 中可以配置默认模型:

```json
{
  "defaultModel": "claude-sonnet-4.5",
  "maxTokens": 8192,
  "temperature": 0.7
}
```

### 禁用自动更新

如果你想完全控制更新时机:

```bash
# 在 Shell 配置文件中添加
export DISABLE_AUTOUPDATER=1
```

或在 `~/.claude/settings.json` 中:

```json
{
  "DISABLE_AUTOUPDATER": "1"
}
```

### 自定义工作目录

设置 Claude Code 的默认工作目录:

```bash
# 在 Shell 配置文件中添加
export CLAUDE_WORKSPACE="$HOME/Projects"
```

### 日志配置

启用详细日志以便调试:

```bash
# 在 Shell 配置文件中添加
export CLAUDE_LOG_LEVEL="debug"
export CLAUDE_LOG_FILE="$HOME/.claude/logs/claude.log"
```

### 手动更新 Claude Code

```bash
# 检查更新
claude update

# 使用 Homebrew 更新(如果通过 Homebrew 安装)
brew upgrade --cask claude-code
```

### 卸载 Claude Code

#### 如果使用一键安装脚本安装:

```bash
# 删除二进制文件
rm ~/.local/bin/claude

# 删除配置文件(可选)
rm -rf ~/.claude

# 清理 Shell 配置
# 编辑 ~/.zshrc 或 ~/.bash_profile,移除相关配置行
```

#### 如果使用 Homebrew 安装:

```bash
# 卸载应用
brew uninstall --cask claude-code

# 删除配置文件(可选)
rm -rf ~/.claude
```

### 性能优化

#### 减少启动时间

在 `~/.claude/settings.json` 中:

```json
{
  "skipUpdateCheck": true,
  "disableTelemetry": true
}
```

#### 限制内存使用

```bash
# 在 Shell 配置文件中添加
export CLAUDE_MAX_MEMORY="2048"  # 限制为 2GB
```

---

## 总结

完成上述步骤后,你已经在 macOS 系统上成功安装并配置了 Claude Code。现在你可以:

1. 在任意项目目录打开终端
2. 运行 `claude` 启动交互式会话
3. 或直接运行 `claude "你的问题"` 获取即时回答

**快速命令参考**:
```bash
claude                    # 启动交互式会话
claude "帮我写一个函数"   # 直接提问
claude --version          # 查看版本
claude doctor             # 系统诊断
claude update             # 更新 Claude Code
claude --help             # 查看帮助
```

**macOS 特有优势**:
- **Apple Silicon 优化**: M1/M2/M3 芯片上运行速度更快
- **原生集成**: 与 macOS 系统完美集成
- **Homebrew 支持**: 可以统一管理所有开发工具
- **稳定性高**: macOS 系统稳定性好,很少出现环境问题

**下一步建议**:
- 阅读[官方文档](https://code.claude.com/docs)了解更多功能
- 尝试在实际项目中使用 Claude Code
- 探索自定义配置和工作流
- 配置 Shell 别名提高使用效率

如遇到其他问题,请参考[常见问题](#常见问题)章节或查阅官方文档。

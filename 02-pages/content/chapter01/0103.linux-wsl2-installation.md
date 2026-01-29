# Claude Code Linux/WSL2 系统完整安装指南

## 📋 目录
- [系统要求](#系统要求)
- [Linux 发行版支持](#linux-发行版支持)
- [WSL2 安装指南](#wsl2-安装指南)
- [Linux 原生安装](#linux-原生安装)
- [环境配置](#环境配置)
- [API 配置](#api-配置)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [进阶配置](#进阶配置)

---

## 系统要求

### 最低配置
- **操作系统**:
  - Ubuntu 20.04+ / Debian 10+
  - Fedora 33+ / CentOS 8+
  - Arch Linux / Manjaro
  - Alpine Linux 3.14+
  - WSL 1 或 WSL 2
- **内存**: 至少 4GB RAM(推荐 8GB+)
- **存储空间**: 至少 500MB 可用空间
- **网络**: 需要互联网连接(用于 API 调用和更新)

### 推荐配置
- **操作系统**: Ubuntu 22.04 LTS 或更新版本
- **内存**: 8GB+ RAM
- **WSL**: 推荐使用 WSL 2(性能更好)

### 必需软件
- **Shell**: Bash、Zsh 或 Fish
- **curl**: 用于下载安装脚本
- **基础工具**: glibc、libstdc++

---

## Linux 发行版支持

Claude Code 支持所有主流 Linux 发行版,但不同发行版可能有特殊要求。

### Ubuntu / Debian 系列

**完全支持的版本**:
- Ubuntu 20.04 LTS, 22.04 LTS, 23.04+
- Debian 10 (Buster), 11 (Bullseye), 12 (Bookworm)
- Linux Mint 20+
- Pop!_OS 20.04+

**特点**:
- 无需额外依赖
- apt 包管理器
- 安装最简单

### Fedora / RHEL / CentOS 系列

**完全支持的版本**:
- Fedora 33+
- RHEL 8+
- CentOS Stream 8+
- Rocky Linux 8+
- AlmaLinux 8+

**特点**:
- dnf/yum 包管理器
- 可能需要启用 EPEL 仓库

### Arch Linux 系列

**完全支持的版本**:
- Arch Linux
- Manjaro
- EndeavourOS

**特点**:
- 滚动更新
- pacman 包管理器
- 通常已包含所需依赖

### Alpine Linux

**支持版本**: Alpine Linux 3.14+

**特别注意**:
- 使用 musl libc 而非 glibc
- 需要额外安装依赖包
- 需要禁用内置 ripgrep

### 其他发行版

- **openSUSE**: Leap 15.3+, Tumbleweed
- **Gentoo**: 完全支持
- **NixOS**: 需要特殊配置
- **Void Linux**: 完全支持

---

## WSL2 安装指南

Windows Subsystem for Linux (WSL) 允许在 Windows 上运行 Linux 环境。推荐使用 WSL 2,性能更好。

### 安装前准备

在安装 WSL2 之前,需要确保系统满足要求并完成必要的配置。

#### 系统要求与基础配置

1. **操作系统**: Windows 11 或 Windows 10 21H2 以上版本
2. **系统版本**: 专业版/工作站版/企业版（家庭版不支持 Hyper-V,但可以使用 WSL2）
3. **硬件要求**: CPU 需支持虚拟化技术并在 BIOS 中已启用

#### 判断电脑是否开启虚拟化

1. 按 `Ctrl + Shift + Esc` 打开任务管理器
2. 切换到"性能" → "CPU"
3. 在右下角可以看到"虚拟化：已启用/已禁用"

#### 开启虚拟化功能（关键步骤！）

如果虚拟化显示为"已禁用",需要在 BIOS 中启用:

1. 重启电脑,开机时按 `F2` 或 `Del` 键进入 BIOS/UEFI 设置
   - 不同品牌电脑按键可能不同:
   - Dell: F2
   - HP: F10 或 Esc
   - Lenovo: F1 或 F2
   - ASUS: F2 或 Del
2. 找到 `Intel (VMX) Virtualization Technology` 或 `AMD-V` 选项
   - 通常在 "Advanced" → "CPU Configuration" 菜单中
3. 设置为 `Enabled`（启用）
4. 保存设置并退出重启（通常按 F10 保存）

#### 启用 Windows 功能

在安装 WSL2 之前,需要启用相关 Windows 功能:

**方法一: 通过图形界面（推荐新手）**

1. 按 `Win + R`,输入 `optionalfeatures` 并回车
2. 或打开"控制面板" → "程序与功能" → "启用或关闭 Windows 功能"
3. 勾选以下两项:
   - ☑ **虚拟机平台** (Virtual Machine Platform)
   - ☑ **适用于 Linux 的 Windows 子系统** (Windows Subsystem for Linux)
4. 点击"确定"并重启电脑

**方法二: 通过 PowerShell（推荐高级用户）**

以管理员身份打开 PowerShell,运行:

```powershell
# 启用 WSL 功能
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 启用虚拟机平台
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 重启电脑
Restart-Computer
```

### 步骤 1: 在 Windows 上安装 WSL 2

#### 检查 WSL 版本

打开 PowerShell 或命令提示符,运行:

```powershell
wsl --version
```

如果显示版本信息,说明已安装 WSL 2。

#### 全新安装 WSL 2(Windows 10 2004+ 或 Windows 11)

以管理员身份打开 PowerShell,运行:

```powershell
# 一键安装 WSL 2 和 Ubuntu
wsl --install
```

这会自动:
- 启用 WSL 功能
- 安装 WSL 2 Linux 内核
- 设置 WSL 2 为默认版本
- 安装 Ubuntu 发行版

#### 从 WSL 1 升级到 WSL 2

```powershell
# 设置 WSL 2 为默认版本
wsl --set-default-version 2

# 将已安装的发行版转换为 WSL 2
wsl --set-version Ubuntu 2

# 验证版本
wsl -l -v
```

**预期输出**:
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

### 步骤 2: 选择并安装 Linux 发行版

#### 查看可用发行版

```powershell
wsl --list --online
```

#### 安装特定发行版

```powershell
# 安装 Ubuntu 22.04
wsl --install -d Ubuntu-22.04

# 安装 Debian
wsl --install -d Debian

# 安装 Arch Linux
wsl --install -d Arch
```

#### 手动安装方法（离线或网络受限环境）

如果一键安装失败或需要离线安装,可以使用手动方法。

**方法一: 下载 WSL 更新包**

1. 下载 WSL 2 Linux 内核更新包:
   - 64位系统: https://github.com/microsoft/WSL/releases
   - 下载最新的 `.msi` 文件
2. 双击安装下载的 `.msi` 文件
3. 在 PowerShell 中安装 Ubuntu:
   ```powershell
   wsl --install -d Ubuntu-20.04
   ```

**方法二: 通过应用商店手动下载**

1. 访问 Microsoft Store 搜索 "Ubuntu"
2. 选择 "Ubuntu 20.04 LTS" 或 "Ubuntu 22.04 LTS"
3. 点击"获取"或"安装"
4. 安装完成后在开始菜单找到并启动

**方法三: 下载 AppxBundle 安装包**

1. 访问 https://learn.microsoft.com/en-us/windows/wsl/install-manual#downloading-distributions
2. 找到并下载 "Ubuntu 20.04 LTS" 的 `.appx` 或 `.msix` 包
3. 以管理员身份打开 PowerShell,运行:
   ```powershell
   Add-AppxPackage -Path "C:\Users\你的用户名\Desktop\CanonicalGroupLimited.UbuntuonWindows_2004.2021.825.0.AppxBundle"
   ```
   - 将路径替换为你实际的下载路径
4. 等待安装完成

### 步骤 3: 首次设置 Ubuntu

安装完成后需要进行初始化配置。

#### 启动 Ubuntu

1. 在开始菜单中搜索 "Ubuntu 20.04 LTS" 或 "Ubuntu 22.04 LTS"
2. 首次运行会自动初始化,需要等待 1-2 分钟

#### 创建用户名和密码

首次运行会提示创建 Linux 用户:

```
Installing, this may take a few minutes...
Please create a default UNIX user account. The username does not need to match your Windows username.
For more information visit: https://aka.ms/wslusers
Enter new UNIX username:
```

**重要提示**:
- **用户名**: 建议使用英文小写,不要使用中文或特殊字符
- **密码**: 输入时不会显示任何字符(包括 `*`),这是正常的安全机制
- **记住密码**: 这个密码在使用 `sudo` 时会用到,务必记住

#### 更新系统软件包

首次设置完成后,建议立即更新系统:

```bash
# 更新软件包列表
sudo apt update

# 升级已安装的软件包
sudo apt upgrade -y
```

### 步骤 4: 在 WSL 中安装 Node.js 和 Claude Code

在 Ubuntu 终端中进行以下操作。

#### 方法一: 安装 Node.js（npm 方式）

##### 1. 安装 Node.js 环境

**推荐: 使用 NodeSource 官方仓库**

```bash
# 添加 NodeSource 仓库（Node.js 22.x LTS）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装（应显示 v22.x 和 10.x）
node --version
npm --version
```

**备选: 使用系统仓库（版本可能较旧）**

```bash
sudo apt update
sudo apt install nodejs npm -y
```

##### 2. 配置 npm 镜像（可选,国内推荐）

```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或设置清华镜像
npm config set registry https://mirrors.tuna.tsinghua.edu.cn/npm/
```

**网络问题解决**:

如果使用 VPN/代理时出现丢包或卡死问题:

```bash
# 调整 MTU 值
sudo ip link set dev eth0 mtu 1400
```

> **注意**: 此设置在重启 WSL 后会失效,如需永久生效需要添加到启动脚本。

##### 3. 安装 Claude Code

**官方账号用户**:

```bash
sudo npm install -g @anthropic-ai/claude-code
```

**中转站用户（推荐国内用户）**:

```bash
sudo npm install -g https://gaccode.com/claudecode/install --registry=https://registry.npmmirror.com
```

> **注意**: 两种方式只能选一个。如果装错了可以卸载重装:
> ```bash
> sudo npm uninstall -g @anthropic-ai/claude-code
> ```

##### 4. 验证 Claude Code 安装

```bash
claude --version  # 显示版本号即成功
```

#### 方法二: 原生二进制安装（推荐）

如果不想安装 Node.js,可以直接安装原生版本:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### 步骤 5: 配置 API 环境变量

#### 设置中转站环境变量

```bash
# 设置环境变量（将 your_actual_api_key 替换为真实密钥）
echo 'export ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="your_actual_api_key"' >> ~/.bashrc

# 立即生效
source ~/.bashrc

# 验证设置
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN
```

**预期输出示例**:
```
https://api.claudecode.net.cn/api/claudecode
cr_xxxxxxxxxxxxxxxxxx
```

### 相关管理命令

```bash
# 查看已安装的 WSL 系统
wsl --list --verbose

# 更新 Claude Code（npm 方式）
sudo npm update -g @anthropic-ai/claude-code

# 完全卸载重装（npm 方式）
sudo npm uninstall -g @anthropic-ai/claude-code
sudo npm install -g @anthropic-ai/claude-code

# 更新 Claude Code（原生方式）
claude update
```

### 步骤 6: 在 WSL 中启动 Claude Code

#### 启动 WSL

方式一: 在开始菜单搜索 "Ubuntu" 或你安装的发行版名称

方式二: 在 PowerShell 或命令提示符中运行:
```powershell
wsl
```

#### 运行一键安装脚本

在 WSL 终端中运行:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### WSL 特别配置

#### 配置 WSL 2 内存限制

创建或编辑 `C:\Users\你的用户名\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
```

保存后重启 WSL:

```powershell
wsl --shutdown
wsl
```

#### WSL 与 Windows 文件系统互操作

WSL 可以访问 Windows 文件系统:

```bash
# Windows C 盘映射到 /mnt/c
cd /mnt/c/Users/你的用户名/Documents

# 在 Windows 项目中使用 Claude Code
cd /mnt/c/Projects/my-app
claude
```

从 Windows 访问 WSL 文件系统:
- 在文件资源管理器地址栏输入: `\\wsl$\Ubuntu\home\你的用户名`

---

## Linux 原生安装

### 方式一: 一键安装脚本(推荐)

这是最简单的安装方式,适合所有主流发行版。

#### 步骤 1: 确保已安装 curl

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install curl -y
```

**Fedora/RHEL/CentOS**:
```bash
sudo dnf install curl -y
```

**Arch Linux**:
```bash
sudo pacman -S curl
```

**Alpine Linux**:
```bash
sudo apk add curl
```

#### 步骤 2: 执行安装脚本

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

安装脚本会:
- 检测你的系统架构(x64 或 ARM64)
- 下载对应的二进制文件
- 安装到 `~/.local/bin/` 目录
- 自动配置权限

**安装过程示例输出**:
```
Detecting platform...
Platform: linux-x64
Downloading Claude Code v1.0.58...
Installing to /home/username/.local/bin/
Claude Code installed successfully!
```

---

### 方式二: Alpine Linux 专用安装

Alpine Linux 使用 musl libc,需要额外配置。

#### 步骤 1: 安装必需依赖

```bash
# 安装基础依赖
sudo apk add libgcc libstdc++

# 安装 ripgrep(代替内置版本)
sudo apk add ripgrep
```

#### 步骤 2: 设置环境变量

```bash
# 禁用内置 ripgrep
export USE_BUILTIN_RIPGREP=0
```

将此环境变量添加到 `~/.profile`:

```bash
echo 'export USE_BUILTIN_RIPGREP=0' >> ~/.profile
```

#### 步骤 3: 运行安装脚本

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

---

### 方式三: 手动下载安装

如果需要离线安装或更多控制权。

#### 步骤 1: 下载二进制文件

访问 GitHub Releases 页面,下载对应架构的文件:

- **x86_64 (Intel/AMD)**: `claude-linux-x64`
- **ARM64 (树莓派等)**: `claude-linux-arm64`

或使用 wget 下载:

```bash
# 下载 x64 版本
wget https://github.com/anthropics/claude-code/releases/latest/download/claude-linux-x64

# 下载 ARM64 版本
wget https://github.com/anthropics/claude-code/releases/latest/download/claude-linux-arm64
```

#### 步骤 2: 安装到本地目录

```bash
# 创建安装目录
mkdir -p ~/.local/bin

# 移动文件并重命名
mv claude-linux-x64 ~/.local/bin/claude

# 添加执行权限
chmod +x ~/.local/bin/claude
```

---

### 方式四: 使用 Node.js/npm 安装

如果你是开发者或需要使用 npm 包管理器,可以通过 Node.js 环境安装 Claude Code。

#### 步骤 1: 安装 Node.js 环境

##### Ubuntu/Debian系统

**方法一: 使用官方仓库（推荐）**

```bash
# 添加 NodeSource 仓库（Node.js LTS）
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs
```

**方法二: 使用系统包管理器**

```bash
sudo apt update
sudo apt install nodejs npm -y
```

##### Fedora/RHEL/CentOS系统

```bash
sudo dnf install nodejs npm -y
```

##### Arch Linux系统

```bash
sudo pacman -S nodejs npm
```

##### 验证 Node.js 安装

安装完成后,打开终端,输入以下命令:

```bash
node --version
npm --version
```

如果显示版本号,说明安装成功。

#### 步骤 2: 安装 Claude Code

打开终端,运行以下命令:

**全局安装 Claude Code**:
```bash
npm install -g @anthropic-ai/claude-code
```

**如果遇到权限问题**,可以使用 sudo:
```bash
sudo npm install -g @anthropic-ai/claude-code
```

#### 步骤 3: 验证 Claude Code 安装

安装完成后,输入以下命令检查是否安装成功:

```bash
claude --version
```

如果显示版本号,说明 Claude Code 已成功安装。

#### Linux 安装注意事项

- **某些发行版需要安装额外依赖**:
  - Ubuntu/Debian: `sudo apt install build-essential`
  - CentOS/RHEL: `sudo dnf groupinstall "Development Tools"`
- **权限问题**: 如果遇到权限错误,使用 `sudo` 安装
- **npm 用户目录配置**: 或配置 npm 使用用户目录:
  ```bash
  npm config set prefix ~/.npm-global
  export PATH=~/.npm-global/bin:$PATH
  ```
- **更新 Claude Code**: `npm update -g @anthropic-ai/claude-code`
- **卸载 Claude Code**: `npm uninstall -g @anthropic-ai/claude-code`

---

## 环境配置

安装完成后,需要配置 PATH 环境变量。

### 配置 PATH 环境变量

#### 自动配置(推荐)

大多数情况下,安装脚本已自动配置。验证一下:

```bash
echo $PATH | grep ".local/bin"
```

如果有输出,说明已配置成功。

#### 手动配置

##### 使用 Bash

编辑 `~/.bashrc`:

```bash
nano ~/.bashrc
```

在文件末尾添加:

```bash
# 添加 Claude Code 到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

保存并使配置生效:

```bash
source ~/.bashrc
```

##### 使用 Zsh

编辑 `~/.zshrc`:

```bash
nano ~/.zshrc
```

添加相同的配置:

```bash
# 添加 Claude Code 到 PATH
export PATH="$HOME/.local/bin:$PATH"
```

保存并生效:

```bash
source ~/.zshrc
```

##### 使用 Fish

编辑 `~/.config/fish/config.fish`:

```bash
nano ~/.config/fish/config.fish
```

添加:

```fish
# 添加 Claude Code 到 PATH
set -gx PATH $HOME/.local/bin $PATH
```

保存并生效:

```bash
source ~/.config/fish/config.fish
```

#### 系统级配置(所有用户)

如果希望所有用户都能使用 Claude Code:

```bash
# 需要 sudo 权限
sudo cp ~/.local/bin/claude /usr/local/bin/
sudo chmod +x /usr/local/bin/claude
```

---

## API 配置

Claude Code 需要 Anthropic API Key 才能正常工作。

### 获取 API Key

#### 官方 API

1. 访问 [https://console.anthropic.com/](https://console.anthropic.com/)
2. 登录或注册账号
3. 进入 "API Keys" 页面
4. 点击 "Create Key" 创建新的 API 密钥
5. 复制生成的密钥(格式: `sk-ant-api03-...`)

#### 中转 API(国内推荐)

如果你在中国大陆,可以使用中转服务:
- 访问中转服务商网站(如 https://api.nekoapi.com/)
- 注册账号并充值
- 获取中转 API Key 和 Base URL

### 配置方式

#### 方法一: Shell 配置文件(推荐)

##### Bash 用户

编辑 `~/.bashrc`:

```bash
nano ~/.bashrc
```

在文件末尾添加:

```bash
# Claude Code API 配置
export ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"

# 如果使用中转服务
export ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"

# Auth Token(与 API Key 相同)
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的密钥"
```

保存并生效:

```bash
source ~/.bashrc
```

##### Zsh 用户

编辑 `~/.zshrc`:

```bash
nano ~/.zshrc
```

添加相同的环境变量,保存后运行:

```bash
source ~/.zshrc
```

##### Fish 用户

编辑 `~/.config/fish/config.fish`:

```bash
nano ~/.config/fish/config.fish
```

添加:

```fish
# Claude Code API 配置
set -gx ANTHROPIC_API_KEY "sk-ant-api03-你的密钥"
set -gx ANTHROPIC_BASE_URL "https://api.claudecode.net.cn/api/claudecode"
set -gx ANTHROPIC_AUTH_TOKEN "sk-ant-api03-你的密钥"
```

保存并生效:

```bash
source ~/.config/fish/config.fish
```

#### 方法二: 配置文件方式

创建或编辑 `~/.claude/settings.json`:

```bash
# 创建目录
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

#### 方法三: 系统级配置

如果希望配置对所有用户生效,编辑 `/etc/environment`:

```bash
sudo nano /etc/environment
```

添加:

```
ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"
ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"
ANTHROPIC_AUTH_TOKEN="sk-ant-api03-你的密钥"
```

**注意**: 修改后需要重新登录系统才能生效。

### 配置说明

- **ANTHROPIC_BASE_URL**: API 服务器地址
  - 官方: `https://api.anthropic.com` 或不设置
  - 中转: 使用中转商提供的 URL

- **ANTHROPIC_API_KEY**: 你的 API 密钥
  - 格式通常为 `sk-ant-api03-` 开头

- **ANTHROPIC_AUTH_TOKEN**: 认证令牌
  - 通常与 API KEY 相同

---

### 配置 Gemini CLI 环境变量（可选）

如果你需要使用 Google Gemini CLI 功能,需要额外配置相关环境变量。

#### 终端设置方法（临时）

```bash
export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"
export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"
export GOOGLE_GENAI_USE_GCA="true"
```

#### 永久设置方法

##### 对于 Bash (默认)

```bash
echo 'export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"' >> ~/.bashrc
echo 'export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"' >> ~/.bashrc
echo 'export GOOGLE_GENAI_USE_GCA="true"' >> ~/.bashrc
source ~/.bashrc
```

##### 对于 Zsh

```bash
echo 'export CODE_ASSIST_ENDPOINT="https://claude-code.pseudoyu.com/gemini"' >> ~/.zshrc
echo 'export GOOGLE_CLOUD_ACCESS_TOKEN="你的API密钥"' >> ~/.zshrc
echo 'export GOOGLE_GENAI_USE_GCA="true"' >> ~/.zshrc
source ~/.zshrc
```

##### 对于 Fish

```fish
echo 'set -gx CODE_ASSIST_ENDPOINT "https://claude-code.pseudoyu.com/gemini"' >> ~/.config/fish/config.fish
echo 'set -gx GOOGLE_CLOUD_ACCESS_TOKEN "你的API密钥"' >> ~/.config/fish/config.fish
echo 'set -gx GOOGLE_GENAI_USE_GCA "true"' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

#### 验证 Gemini CLI 环境变量

在终端中验证:

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

配置完成后,验证 Claude Code 是否正常工作。

### 步骤 1: 打开新的终端

**重要**: 必须打开新的终端窗口或重新加载配置,让环境变量生效。

如果不想打开新终端,可以重新加载配置:

```bash
# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc

# Fish
source ~/.config/fish/config.fish
```

### 步骤 2: 检查版本

```bash
claude --version
```

**预期输出**:
```
Claude Code v1.0.58
```

### 步骤 3: 检查安装位置

```bash
which claude
```

**预期输出**:
```
/home/username/.local/bin/claude
```

### 步骤 4: 查看帮助信息

```bash
claude --help
```

应该显示所有可用的命令和选项。

### 步骤 5: 系统诊断

```bash
claude doctor
```

此命令会检查:
- Claude Code 版本
- 安装类型(原生 vs npm)
- API 配置状态
- 网络连接
- Shell 环境
- 系统依赖

**预期输出示例**:
```
✓ Claude Code version: 1.0.58
✓ Installation type: Native
✓ API configured: Yes
✓ Base URL: https://api.claudecode.net.cn/api/claudecode
✓ Shell: Bash
✓ Network: Connected
✓ Platform: Linux x64
```

### 步骤 6: 测试运行

```bash
claude "你好,Claude!"
```

如果一切正常,Claude 会回复你的问候,说明安装和配置都成功了。

---

## 常见问题

### Q1: 提示 "command not found: claude"

**原因**: PATH 环境变量未正确配置。

**解决方法**:

1. 检查 PATH:
   ```bash
   echo $PATH | grep ".local/bin"
   ```

2. 如果没有输出,重新配置 PATH:
   ```bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. 验证安装位置:
   ```bash
   ls -la ~/.local/bin/claude
   ```

4. 确保有执行权限:
   ```bash
   chmod +x ~/.local/bin/claude
   ```

### Q2: WSL 中找不到 claude 命令

**原因**: WSL 环境变量未正确加载。

**解决方法**:

1. 确保在 WSL 终端而非 Windows 终端:
   ```bash
   uname -a
   ```
   应该显示 Linux 内核信息。

2. 重新加载配置:
   ```bash
   source ~/.bashrc
   ```

3. 检查文件是否存在:
   ```bash
   ls -la ~/.local/bin/claude
   ```

4. 如果不存在,重新安装:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```

### Q3: Alpine Linux 安装失败

**症状**: 提示缺少共享库或 ripgrep 错误。

**解决方法**:

1. 安装所需依赖:
   ```bash
   sudo apk add libgcc libstdc++ ripgrep
   ```

2. 设置环境变量:
   ```bash
   export USE_BUILTIN_RIPGREP=0
   echo 'export USE_BUILTIN_RIPGREP=0' >> ~/.profile
   ```

3. 重新安装 Claude Code:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```

### Q4: 权限被拒绝错误

**症状**: 安装或运行时提示 "Permission denied"。

**解决方法**:

1. 确保目录权限正确:
   ```bash
   mkdir -p ~/.local/bin
   chmod 755 ~/.local/bin
   ```

2. 确保文件有执行权限:
   ```bash
   chmod +x ~/.local/bin/claude
   ```

3. 检查目录所有权:
   ```bash
   ls -la ~/.local/bin
   ```

4. 如果是系统级安装,使用 sudo:
   ```bash
   sudo cp ~/.local/bin/claude /usr/local/bin/
   sudo chmod +x /usr/local/bin/claude
   ```

### Q5: API Key 无效或无法连接

**症状**: 运行时提示认证失败或网络错误。

**解决方法**:

1. 验证环境变量:
   ```bash
   echo $ANTHROPIC_API_KEY
   echo $ANTHROPIC_BASE_URL
   ```

2. 如果为空,重新配置:
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-api03-你的密钥"
   export ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"
   ```

3. 测试网络连接:
   ```bash
   curl -I https://api.anthropic.com
   ```

4. 运行诊断:
   ```bash
   claude doctor
   ```

### Q6: WSL 性能问题

**症状**: Claude Code 运行缓慢。

**解决方法**:

1. 确保使用 WSL 2:
   ```powershell
   wsl -l -v
   ```
   VERSION 应该是 2。

2. 优化 WSL 2 内存配置:
   编辑 `C:\Users\你的用户名\.wslconfig`:
   ```ini
   [wsl2]
   memory=4GB
   processors=4
   ```

3. 重启 WSL:
   ```powershell
   wsl --shutdown
   ```

4. 在 Linux 文件系统中工作:
   ```bash
   # 不要在 /mnt/c 下工作
   cd ~
   # 而是在 Linux 原生文件系统
   ```

### Q7: ARM64 架构问题

**症状**: 在树莓派或 ARM 服务器上安装失败。

**解决方法**:

1. 确认架构:
   ```bash
   uname -m
   ```
   应显示 `aarch64` 或 `arm64`。

2. 手动下载 ARM64 版本:
   ```bash
   wget https://github.com/anthropics/claude-code/releases/latest/download/claude-linux-arm64
   mv claude-linux-arm64 ~/.local/bin/claude
   chmod +x ~/.local/bin/claude
   ```

3. 验证安装:
   ```bash
   file ~/.local/bin/claude
   ```

### Q8: 防火墙或代理问题

**症状**: 无法连接到 API 服务器。

**解决方法**:

1. 配置代理:
   ```bash
   export HTTP_PROXY="http://proxy-server:port"
   export HTTPS_PROXY="http://proxy-server:port"
   ```

2. 或在配置文件中设置:
   ```json
   {
     "env": {
       "HTTP_PROXY": "http://proxy-server:port",
       "HTTPS_PROXY": "http://proxy-server:port"
     }
   }
   ```

3. 测试连接:
   ```bash
   curl -x http://proxy-server:port https://api.anthropic.com
   ```

---

## 进阶配置

### Docker 容器中使用

#### Dockerfile 示例

```dockerfile
FROM ubuntu:22.04

# 安装基础工具
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装 Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash

# 配置环境变量
ENV PATH="/root/.local/bin:${PATH}"
ENV ANTHROPIC_API_KEY="your-api-key"
ENV ANTHROPIC_BASE_URL="https://api.claudecode.net.cn/api/claudecode"

WORKDIR /workspace

CMD ["bash"]
```

#### 构建和运行

```bash
# 构建镜像
docker build -t claude-code .

# 运行容器
docker run -it --rm \
  -v $(pwd):/workspace \
  -e ANTHROPIC_API_KEY="your-key" \
  claude-code
```

### systemd 服务配置

创建 Claude Code 作为系统服务(用于后台任务)。

#### 创建服务文件

```bash
sudo nano /etc/systemd/system/claude-code.service
```

添加:

```ini
[Unit]
Description=Claude Code Service
After=network.target

[Service]
Type=simple
User=your-username
Environment="ANTHROPIC_API_KEY=your-key"
Environment="ANTHROPIC_BASE_URL=https://api.claudecode.net.cn/api/claudecode"
ExecStart=/home/your-username/.local/bin/claude
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### 启用服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable claude-code
sudo systemctl start claude-code
sudo systemctl status claude-code
```

### Shell 别名和函数

#### Bash/Zsh 别名

编辑 `~/.bashrc` 或 `~/.zshrc`:

```bash
# Claude Code 别名
alias cc='claude'
alias ccd='claude doctor'
alias ccu='claude update'

# 快速提问函数
ask() {
  claude "$@"
}

# 在特定目录运行 Claude Code
claude-project() {
  cd ~/Projects/$1 && claude
}
```

#### Fish 别名

编辑 `~/.config/fish/config.fish`:

```fish
# Claude Code 别名
alias cc='claude'
alias ccd='claude doctor'
alias ccu='claude update'

# 快速提问函数
function ask
    claude $argv
end
```

### 自动补全

#### Bash 自动补全

```bash
# 生成补全脚本
claude --bash-completion > ~/.claude-completion.bash

# 加载补全
echo 'source ~/.claude-completion.bash' >> ~/.bashrc
source ~/.bashrc
```

#### Zsh 自动补全

```bash
# 生成补全脚本
claude --zsh-completion > ~/.claude-completion.zsh

# 加载补全
echo 'source ~/.claude-completion.zsh' >> ~/.zshrc
source ~/.zshrc
```

### 性能优化

#### 限制资源使用

在 `~/.claude/settings.json` 中:

```json
{
  "maxMemory": "2048",
  "maxCPU": "2",
  "cacheSize": "512"
}
```

#### 启用缓存

```json
{
  "enableCache": true,
  "cacheDir": "~/.cache/claude",
  "cacheTTL": 3600
}
```

### 日志配置

#### 启用详细日志

```bash
# 在 Shell 配置文件中添加
export CLAUDE_LOG_LEVEL="debug"
export CLAUDE_LOG_FILE="$HOME/.claude/logs/claude.log"
```

#### 查看日志

```bash
# 创建日志目录
mkdir -p ~/.claude/logs

# 实时查看日志
tail -f ~/.claude/logs/claude.log
```

### 卸载 Claude Code

#### 完全卸载

```bash
# 删除二进制文件
rm ~/.local/bin/claude

# 删除配置文件
rm -rf ~/.claude

# 清理 Shell 配置
# 编辑 ~/.bashrc 或 ~/.zshrc,移除相关配置

# 清理缓存
rm -rf ~/.cache/claude
```

#### 保留配置的卸载

```bash
# 只删除二进制文件,保留配置
rm ~/.local/bin/claude
```

### 多版本管理

#### 安装多个版本

```bash
# 安装到不同目录
mkdir -p ~/.local/claude-versions

# 下载不同版本
curl -L https://github.com/anthropics/claude-code/releases/download/v1.0.58/claude-linux-x64 \
  -o ~/.local/claude-versions/claude-1.0.58
chmod +x ~/.local/claude-versions/claude-1.0.58

# 创建符号链接切换版本
ln -sf ~/.local/claude-versions/claude-1.0.58 ~/.local/bin/claude
```

---

## 总结

完成上述步骤后,你已经在 Linux/WSL2 系统上成功安装并配置了 Claude Code。现在你可以:

1. 在任意项目目录运行 `claude` 启动交互式会话
2. 使用 `claude "你的问题"` 直接提问
3. 在 WSL 中无缝结合 Windows 和 Linux 环境

**快速命令参考**:
```bash
claude                    # 启动交互式会话
claude "帮我写一个脚本"   # 直接提问
claude --version          # 查看版本
claude doctor             # 系统诊断
claude update             # 更新 Claude Code
claude --help             # 查看帮助
which claude              # 查看安装位置
```

**Linux/WSL 特有优势**:
- **轻量高效**: Linux 系统资源占用少
- **完美的开发环境**: 原生支持各种开发工具
- **WSL 互操作**: 可同时访问 Windows 和 Linux 文件系统
- **服务器部署**: 可在生产服务器上使用
- **Docker 友好**: 可轻松容器化

**WSL 2 特别优势**:
- 完整的 Linux 内核
- 更快的文件系统性能
- 完全的系统调用兼容性
- 与 Windows 无缝集成

**下一步建议**:
- 阅读[官方文档](https://code.claude.com/docs)了解更多功能
- 在实际项目中使用 Claude Code
- 配置 Shell 别名提高效率
- 探索 Docker 和 CI/CD 集成
- 加入社区讨论最佳实践

如遇到其他问题,请参考[常见问题](#常见问题)章节或查阅官方文档。

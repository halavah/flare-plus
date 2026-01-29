#!/bin/bash

# 部署前检查脚本
# 验证项目是否准备好部署到 Cloudflare Workers

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果
PASSED=0
FAILED=0
WARNINGS=0

# 打印函数
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 检查函数
check_required_files() {
    print_header "Required Files"

    local required_files=(
        "src/index.js"
        "wrangler.toml"
        "package.json"
    )

    local missing_files=()

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_pass "Found: $file"
        else
            print_fail "Missing: $file"
            missing_files+=("$file")
        fi
    done

    if [ ${#missing_files[@]} -gt 0 ]; then
        print_info "Missing files: ${missing_files[*]}"
    fi
}

check_package_json() {
    print_header "Package.json Configuration"

    if [ ! -f "package.json" ]; then
        print_fail "package.json not found"
        return
    fi

    # 检查必要的字段
    if command -v jq &> /dev/null; then
        local has_name=$(jq -e '.name' package.json &> /dev/null && echo "true" || echo "false")
        local has_version=$(jq -e '.version' package.json &> /dev/null && echo "true" || echo "false")
        local has_main=$(jq -e '.main' package.json &> /dev/null && echo "true" || echo "false")
        local has_type=$(jq -e '.type // "commonjs"' package.json &> /dev/null && echo "true" || echo "false")

        if [ "$has_name" = "true" ]; then
            print_pass "Package has name"
        else
            print_fail "Package missing name"
        fi

        if [ "$has_version" = "true" ]; then
            print_pass "Package has version"
        else
            print_warn "Package missing version"
        fi

        if [ "$has_main" = "true" ]; then
            print_pass "Package has main entry"
        else
            print_warn "Package missing main entry"
        fi

        # 检查 scripts
        local has_dev_script=$(jq -e '.scripts.dev' package.json &> /dev/null && echo "true" || echo "false")
        local has_deploy_script=$(jq -e '.scripts.deploy' package.json &> /dev/null && echo "true" || echo "false")

        if [ "$has_dev_script" = "true" ]; then
            print_pass "Has dev script"
        else
            print_warn "Missing dev script"
        fi

        if [ "$has_deploy_script" = "true" ]; then
            print_pass "Has deploy script"
        else
            print_warn "Missing deploy script"
        fi
    else
        print_warn "jq not installed, cannot validate package.json"
    fi
}

check_wrangler_config() {
    print_header "Wrangler Configuration"

    if [ ! -f "wrangler.toml" ]; then
        print_fail "wrangler.toml not found"
        return
    fi

    # 检查 wrangler 是否安装
    if command -v wrangler &> /dev/null; then
        print_pass "Wrangler CLI installed"

        # 检查版本
        local wrangler_version=$(wrangler --version 2>/dev/null || echo "unknown")
        print_info "Wrangler version: $wrangler_version"
    else
        print_fail "Wrangler CLI not installed"
        print_info "Install with: npm install -g wrangler"
    fi

    # 检查配置内容
    if grep -q "name" wrangler.toml; then
        print_pass "Worker name defined"
    else
        print_fail "Worker name not defined"
    fi

    if grep -q "main" wrangler.toml; then
        print_pass "Main entry defined"
    else
        print_fail "Main entry not defined"
    fi

    if grep -q "compatibility_date" wrangler.toml; then
        print_pass "Compatibility date defined"
    else
        print_warn "Compatibility date not defined"
    fi

    # 检查环境变量绑定
    if grep -q "\[vars\]" wrangler.toml; then
        print_pass "Environment variables section found"
    else
        print_warn "No environment variables section"
    fi

    # 检查 D1 数据库绑定
    if grep -q "\[\[d1_databases\]\]" wrangler.toml; then
        print_pass "D1 database bindings found"
    else
        print_warn "No D1 database bindings"
    fi

    # 检查 KV 绑定
    if grep -q "\[\[kv_namespaces\]\]" wrangler.toml; then
        print_pass "KV namespace bindings found"
    else
        print_warn "No KV namespace bindings"
    fi
}

check_source_code() {
    print_header "Source Code"

    # 检查主入口文件
    if [ -f "src/index.js" ]; then
        print_pass "Main entry file exists"

        # 检查 export default
        if grep -q "export default" src/index.js; then
            print_pass "Worker exports default fetch handler"
        else
            print_fail "Worker missing default export"
        fi

        # 检查是否有 fetch 方法
        if grep -q "fetch" src/index.js; then
            print_pass "Fetch handler found"
        else
            print_fail "No fetch handler found"
        fi

        # 检查是否有错误处理
        if grep -q "try.*catch\|error" src/index.js; then
            print_pass "Error handling found"
        else
            print_warn "No error handling found"
        fi
    else
        print_fail "src/index.js not found"
    fi

    # 检查 API 目录
    if [ -d "src/api" ]; then
        local api_files=$(find src/api -name "*.js" 2>/dev/null | wc -l)
        print_info "Found $api_files API files"

        if [ "$api_files" -gt 0 ]; then
            print_pass "API modules exist"
        fi
    else
        print_warn "No API directory found"
    fi

    # 检查中间件目录
    if [ -d "src/middleware" ]; then
        local middleware_files=$(find src/middleware -name "*.js" 2>/dev/null | wc -l)
        print_info "Found $middleware_files middleware files"

        if [ "$middleware_files" -gt 0 ]; then
            print_pass "Middleware modules exist"
        fi
    else
        print_warn "No middleware directory found"
    fi

    # 检查是否有语法错误
    if command -v node &> /dev/null; then
        if node -c src/index.js 2>/dev/null; then
            print_pass "No syntax errors in main file"
        else
            print_fail "Syntax errors found"
            print_info "Run 'node -c src/index.js' for details"
        fi
    fi
}

check_dependencies() {
    print_header "Dependencies"

    if [ ! -d "node_modules" ]; then
        print_fail "Dependencies not installed"
        print_info "Run: npm install"
    else
        print_pass "Dependencies installed"

        # 检查 package-lock.json
        if [ -f "package-lock.json" ]; then
            print_pass "package-lock.json exists"
        else
            print_warn "package-lock.json not found"
        fi
    fi
}

check_environment() {
    print_header "Environment Setup"

    # 检查 Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_pass "Node.js installed: $node_version"

        # 检查版本是否符合要求 (>=18)
        local node_major=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
        if [ "$node_major" -ge 18 ]; then
            print_pass "Node.js version meets requirements (>=18)"
        else
            print_warn "Node.js version might be too old (<18)"
        fi
    else
        print_fail "Node.js not installed"
    fi

    # 检查 npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_pass "npm installed: $npm_version"
    else
        print_fail "npm not installed"
    fi

    # 检查 Git
    if command -v git &> /dev/null; then
        local git_version=$(git --version)
        print_pass "Git installed: $git_version"

        # 检查是否在 Git 仓库中
        if [ -d ".git" ]; then
            print_pass "In Git repository"

            # 检查是否有未提交的更改
            if [ -n "$(git status --porcelain)" ]; then
                print_warn "Uncommitted changes detected"
            else
                print_pass "No uncommitted changes"
            fi
        else
            print_warn "Not in a Git repository"
        fi
    else
        print_warn "Git not installed"
    fi
}

check_security() {
    print_header "Security Checks"

    # 检查是否有硬编码的密钥
    if grep -r -i "secret\|password\|key\|token" src/ --include="*.js" | grep -v "//.*secret\|//.*password\|//.*key\|//.*token" | grep -E "(secret|password|key|token)\s*=\s*['\"]" &>/dev/null; then
        print_fail "Potential hardcoded secrets found in source code"
        print_info "Review source code and move secrets to environment variables"
    else
        print_pass "No obvious hardcoded secrets found"
    fi

    # 检查 .gitignore
    if [ -f ".gitignore" ]; then
        local ignored_items=(".env" "node_modules" ".wrangler" ".DS_Store")

        for item in "${ignored_items[@]}"; do
            if grep -q "^$item$" .gitignore; then
                print_pass "$item is in .gitignore"
            else
                print_warn "$item not in .gitignore"
            fi
        done
    else
        print_warn ".gitignore not found"
    fi

    # 检查环境变量示例文件
    if [ -f ".env.example" ]; then
        print_pass ".env.example exists"
    else
        print_warn "Consider adding .env.example file"
    fi
}

check_tests() {
    print_header "Tests"

    if [ -d "test" ]; then
        print_pass "Test directory exists"

        local test_files=$(find test -name "*.test.js" -o -name "*.spec.js" 2>/dev/null | wc -l)
        print_info "Found $test_files test files"

        if [ "$test_files" -gt 0 ]; then
            print_pass "Test files found"
        fi

        # 检查是否有测试脚本
        if grep -q "test" package.json 2>/dev/null; then
            print_pass "Test scripts found in package.json"
        else
            print_warn "No test scripts in package.json"
        fi
    else
        print_warn "No test directory found"
    fi
}

run_tests_if_possible() {
    print_header "Run Tests"

    # 检查是否有测试并尝试运行
    if [ -d "test" ] && [ -f "package.json" ]; then
        if command -v npm &> /dev/null; then
            if npm run test --if-present; then
                print_pass "Tests passed"
            else
                print_fail "Tests failed or not configured"
            fi
        else
            print_warn "Cannot run tests without npm"
        fi
    else
        print_info "No tests to run"
    fi
}

check_wrangler_auth() {
    print_header "Wrangler Authentication"

    if command -v wrangler &> /dev/null; then
        if wrangler whoami &>/dev/null; then
            print_pass "Logged in to Cloudflare"
            local user_info=$(wrangler whoami 2>/dev/null || echo "Unknown")
            print_info "User: $user_info"
        else
            print_fail "Not logged in to Cloudflare"
            print_info "Run: wrangler auth login"
        fi
    else
        print_info "Cannot check authentication without wrangler"
    fi
}

generate_summary() {
    print_header "Summary"

    echo -e "\nResults:"
    echo -e "  ${GREEN}Passed: $PASSED${NC}"
    echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "  ${RED}Failed: $FAILED${NC}"

    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ Ready for deployment!${NC}"

        if [ $WARNINGS -gt 0 ]; then
            echo -e "\n${YELLOW}Note: You have $WARNINGS warning(s). Review them before deploying.${NC}"
        fi

        exit 0
    else
        echo -e "\n${RED}✗ Not ready for deployment. Fix the $FAILED failed check(s) above.${NC}"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "Deployment Check Script for Cloudflare Workers"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --skip-tests   Skip running tests"
    echo "  --skip-auth    Skip Wrangler authentication check"
    echo ""
    echo "This script checks if your project is ready for deployment."
    echo ""
    echo "It verifies:"
    echo "  - Required files exist"
    echo "  - Package.json configuration"
    echo "  - Wrangler configuration"
    echo "  - Source code quality"
    echo "  - Dependencies are installed"
    echo "  - Environment is set up"
    echo "  - Security best practices"
    echo "  - Tests are present"
    echo "  - Wrangler authentication"
}

# 主函数
main() {
    local skip_tests=false
    local skip_auth=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-auth)
                skip_auth=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    print_header "Cloudflare Workers Deployment Check"
    echo "Checking project readiness for deployment..."

    # 运行所有检查
    check_required_files
    check_package_json
    check_wrangler_config
    check_source_code
    check_dependencies
    check_environment
    check_security
    check_tests

    # 可选检查
    if [ "$skip_tests" = false ]; then
        run_tests_if_possible
    fi

    if [ "$skip_auth" = false ]; then
        check_wrangler_auth
    fi

    # 生成总结
    generate_summary
}

# 运行主函数
main "$@"
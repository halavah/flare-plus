#!/bin/bash

# API 测试脚本
# 用于测试 Cloudflare Workers API 的各种端点

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BASE_URL="${API_BASE_URL:-http://localhost:8787}"
TOKEN_FILE=".token.json"

# 打印函数
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# API 测试函数
test_health() {
    print_header "Health Check"

    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/api/health")
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Health check passed"
        cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
    else
        print_error "Health check failed (HTTP $http_code)"
    fi
}

test_api_docs() {
    print_header "API Documentation"

    response=$(curl -s -w "%{http_code}" -o /tmp/docs_response.json "$BASE_URL/api/docs")
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "API docs accessible"
        endpoints=$(cat /tmp/docs_response.json | jq -r '.endpoints | keys | length' 2>/dev/null || echo "N/A")
        print_info "Available endpoints: $endpoints"
    else
        print_error "Failed to get API docs (HTTP $http_code)"
    fi
}

test_auth() {
    print_header "Authentication"

    # 测试登录
    print_info "Testing login with demo credentials..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"demo@example.com","password":"demo123"}' \
        -o /tmp/login_response.json \
        "$BASE_URL/api/auth/login")
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Login successful"

        # 提取 token
        if command -v jq &> /dev/null; then
            TOKEN=$(cat /tmp/login_response.json | jq -r '.data.token')
            USER_ID=$(cat /tmp/login_response.json | jq -r '.data.user.id')

            # 保存 token
            echo "{\"token\":\"$TOKEN\",\"user_id\":\"$USER_ID\"}" > "$TOKEN_FILE"
            print_info "Token saved to $TOKEN_FILE"
        else
            print_info "jq not found, cannot extract token automatically"
            cat /tmp/login_response.json
        fi
    else
        print_error "Login failed (HTTP $http_code)"
        cat /tmp/login_response.json
    fi

    # 测试注册
    print_info "Testing user registration..."
    test_email="test$(date +%s)@example.com"
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test User\",\"email\":\"$test_email\",\"password\":\"password123\"}" \
        -o /tmp/register_response.json \
        "$BASE_URL/api/auth/register")
    http_code="${response: -3}"

    if [ "$http_code" = "201" ]; then
        print_success "Registration successful"
    else
        print_error "Registration failed (HTTP $http_code)"
        cat /tmp/register_response.json
    fi
}

test_utils() {
    print_header "Utility APIs"

    # 测试时间 API
    print_info "Testing time API..."
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/utils/time" -o /tmp/time_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Time API working"
    else
        print_error "Time API failed (HTTP $http_code)"
    fi

    # 测试哈希 API
    print_info "Testing hash API..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"data":"test message","algorithm":"SHA-256","output":"hex"}' \
        -o /tmp/hash_response.json \
        "$BASE_URL/api/utils/hash")
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Hash API working"
    else
        print_error "Hash API failed (HTTP $http_code)"
    fi

    # 测试 IP API
    print_info "Testing IP API..."
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/utils/ip" -o /tmp/ip_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "IP API working"
        if command -v jq &> /dev/null; then
            ip=$(cat /tmp/ip_response.json | jq -r '.data.ip // "Unknown"')
            print_info "Client IP: $ip"
        fi
    else
        print_error "IP API failed (HTTP $http_code)"
    fi

    # 测试 Base64 API
    print_info "Testing Base64 encode..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"data":"Hello World","operation":"encode"}' \
        -o /tmp/base64_response.json \
        "$BASE_URL/api/utils/base64")
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Base64 API working"
    else
        print_error "Base64 API failed (HTTP $http_code)"
    fi

    # 测试 UUID API
    print_info "Testing UUID generation..."
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/utils/uuid?count=3" -o /tmp/uuid_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "UUID API working"
        if command -v jq &> /dev/null; then
            uuid_count=$(cat /tmp/uuid_response.json | jq -r '.data.count // 0')
            print_info "Generated $uuid_count UUIDs"
        fi
    else
        print_error "UUID API failed (HTTP $http_code)"
    fi
}

test_users() {
    print_header "User Management"

    # 检查是否有 token
    if [ ! -f "$TOKEN_FILE" ]; then
        print_error "No auth token found. Run auth tests first."
        return
    fi

    if command -v jq &> /dev/null; then
        TOKEN=$(cat "$TOKEN_FILE" | jq -r '.token // empty')
    else
        print_error "jq required for token extraction"
        return
    fi

    if [ -z "$TOKEN" ]; then
        print_error "Invalid token in $TOKEN_FILE"
        return
    fi

    # 测试获取用户列表
    print_info "Testing get users list..."
    response=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/users" -o /tmp/users_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "Get users API working"
    elif [ "$http_code" = "401" ]; then
        print_info "Get users API requires authentication (expected)"
    else
        print_error "Get users API failed (HTTP $http_code)"
    fi
}

test_errors() {
    print_header "Error Handling"

    # 测试 404
    print_info "Testing 404 error..."
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/nonexistent" -o /tmp/404_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "404" ]; then
        print_success "404 error handling correct"
    else
        print_error "404 error handling failed (HTTP $http_code)"
    fi

    # 测试无效方法
    print_info "Testing invalid method..."
    response=$(curl -s -w "%{http_code}" -X PATCH "$BASE_URL/api/health" -o /tmp/405_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "405" ]; then
        print_success "Method not allowed handling correct"
    else
        print_info "Method not allowed response (HTTP $http_code)"
    fi

    # 测试无效 JSON
    print_info "Testing invalid JSON..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d 'invalid json' \
        "$BASE_URL/api/utils/hash" -o /tmp/invalid_json_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "500" ]; then
        print_success "Invalid JSON error handling correct"
    else
        print_info "Invalid JSON response (HTTP $http_code)"
    fi
}

test_cors() {
    print_header "CORS Testing"

    # 测试 OPTIONS 请求
    print_info "Testing OPTIONS preflight..."
    response=$(curl -s -w "%{http_code}" -X OPTIONS \
        -H "Origin: https://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "$BASE_URL/api/test" -o /tmp/cors_response.json)
    http_code="${response: -3}"

    if [ "$http_code" = "200" ]; then
        print_success "CORS preflight working"
    else
        print_error "CORS preflight failed (HTTP $http_code)"
    fi
}

cleanup() {
    print_header "Cleanup"

    # 清理临时文件
    rm -f /tmp/*_response.json

    print_info "Cleaned up temporary files"

    # 询问是否删除 token
    if [ -f "$TOKEN_FILE" ]; then
        read -p "Delete saved token? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$TOKEN_FILE"
            print_success "Token deleted"
        fi
    fi
}

# 显示帮助信息
show_help() {
    echo "API Test Script for Cloudflare Workers"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_NAME]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -u, --url URL       Set base URL (default: $BASE_URL)"
    echo "  -v, --verbose       Verbose output"
    echo "  -c, --cleanup       Cleanup only"
    echo ""
    echo "Test Names:"
    echo "  health              Health check tests"
    echo "  docs                API documentation test"
    echo "  auth                Authentication tests"
    echo "  utils               Utility API tests"
    echo "  users               User management tests (requires auth)"
    echo "  errors              Error handling tests"
    echo "  cors                CORS tests"
    echo "  all                 Run all tests (default)"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL        Base URL for the API"
    echo ""
    echo "Examples:"
    echo "  $0                  Run all tests"
    echo "  $0 health           Run health check only"
    echo "  $0 -u https://api.example.com auth"
    echo "  API_BASE_URL=https://api.example.com $0 utils"
}

# 主函数
main() {
    local test_name="all"
    local verbose=false
    local cleanup_only=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -c|--cleanup)
                cleanup_only=true
                shift
                ;;
            -*)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                test_name="$1"
                shift
                ;;
        esac
    done

    # 显示配置信息
    print_header "API Test Configuration"
    echo "Base URL: $BASE_URL"
    echo "Test: $test_name"
    echo "Token file: $TOKEN_FILE"

    # 仅清理
    if [ "$cleanup_only" = true ]; then
        cleanup
        exit 0
    fi

    # 运行测试
    case $test_name in
        all)
            test_health
            test_api_docs
            test_auth
            test_utils
            test_users
            test_errors
            test_cors
            ;;
        health)
            test_health
            ;;
        docs)
            test_api_docs
            ;;
        auth)
            test_auth
            ;;
        utils)
            test_utils
            ;;
        users)
            test_users
            ;;
        errors)
            test_errors
            ;;
        cors)
            test_cors
            ;;
        *)
            echo "Unknown test: $test_name"
            show_help
            exit 1
            ;;
    esac

    # 清理
    cleanup

    print_header "Test Complete"
    print_success "All tests finished!"
}

# 检查依赖
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed"
    exit 1
fi

# 运行主函数
main "$@"
// 数据库操作辅助函数
export function getDB(env) {
  if (!env.DB) {
    throw new Error('Database binding not found. Please check wrangler.toml');
  }
  return env.DB;
}

// 格式化日期时间
export function formatDateTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toISOString();
}

// 构建分页查询
export function buildPaginationQuery(baseQuery, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return {
    query: `${baseQuery} LIMIT ? OFFSET ?`,
    params: [limit, offset]
  };
}

// 构建搜索条件
export function buildSearchCondition(fields, keyword) {
  const conditions = fields.map(field => `${field} LIKE ?`);
  const params = fields.map(() => `%${keyword}%`);
  return {
    condition: conditions.join(' OR '),
    params
  };
}

// 批量执行语句
export async function executeBatch(db, statements) {
  try {
    const results = await db.batch(statements);
    return {
      success: true,
      results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 检查表是否存在
export async function tableExists(db, tableName) {
  const result = await db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).bind(tableName).first();
  return !!result;
}

// 获取表结构
export async function getTableSchema(db, tableName) {
  const result = await db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).bind(tableName).first();
  return result?.sql || null;
}

// 构建 WHERE 子句
export function buildWhereClause(conditions) {
  if (!conditions || Object.keys(conditions).length === 0) {
    return { clause: '', params: [] };
  }

  const clauses = [];
  const params = [];

  for (const [key, value] of Object.entries(conditions)) {
    clauses.push(`${key} = ?`);
    params.push(value);
  }

  return {
    clause: `WHERE ${clauses.join(' AND ')}`,
    params
  };
}


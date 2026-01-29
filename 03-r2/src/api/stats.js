// 统计信息 API
import { getR2Bucket, r2Utils } from '../utils/r2-client.js';

export const handleStats = {
  // 获取存储桶统计信息
  async getBucketStats(request, env) {
    try {
      const bucket = getR2Bucket(env);

      // 获取所有对象（限制数量以避免超时）
      const listed = await bucket.list({ limit: 1000 });

      // 计算统计信息
      let totalSize = 0;
      let fileTypes = {};

      for (const obj of listed.objects) {
        totalSize += obj.size;

        // 统计文件类型
        const ext = obj.key.split('.').pop().toLowerCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }

      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalObjects: listed.objects.length,
          totalSize,
          totalSizeFormatted: r2Utils.formatSize(totalSize),
          truncated: listed.truncated,
          fileTypes,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 获取使用情况统计
  async getUsageStats(request, env) {
    try {
      const bucket = getR2Bucket(env);

      // 获取所有对象进行分析
      const listed = await bucket.list({ limit: 1000 });

      // 按日期分组
      const uploadsByDate = {};
      const sizesByDate = {};

      for (const obj of listed.objects) {
        const date = obj.uploaded.toISOString().split('T')[0];
        uploadsByDate[date] = (uploadsByDate[date] || 0) + 1;
        sizesByDate[date] = (sizesByDate[date] || 0) + obj.size;
      }

      // 计算最大/最小/平均大小
      const sizes = listed.objects.map(obj => obj.size);
      const avgSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
      const maxSize = sizes.length > 0 ? Math.max(...sizes) : 0;
      const minSize = sizes.length > 0 ? Math.min(...sizes) : 0;

      return new Response(JSON.stringify({
        success: true,
        usage: {
          totalObjects: listed.objects.length,
          uploadsByDate,
          sizesByDate,
          statistics: {
            averageSize: avgSize,
            averageSizeFormatted: r2Utils.formatSize(avgSize),
            maxSize,
            maxSizeFormatted: r2Utils.formatSize(maxSize),
            minSize,
            minSizeFormatted: r2Utils.formatSize(minSize)
          },
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};


// 多部分上传 API
import { getR2Bucket } from '../utils/r2-client.js';
import { validateKey } from '../utils/validation.js';
import { ValidationError } from '../middleware/error.js';

export const handleMultipart = {
  // 初始化多部分上传
  async init(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/objects\/(.+)\/multipart\/init/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      const body = await request.json();
      const bucket = getR2Bucket(env);

      // R2 支持多部分上传
      const multipartUpload = await bucket.createMultipartUpload(key, {
        httpMetadata: {
          contentType: body.contentType || 'application/octet-stream'
        },
        customMetadata: body.metadata || {}
      });

      return new Response(JSON.stringify({
        success: true,
        uploadId: multipartUpload.uploadId,
        key,
        message: 'Multipart upload initiated'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 上传分片
  async upload(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/objects\/(.+)\/multipart\/upload/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      const body = await request.json();
      const { uploadId, partNumber, data } = body;

      if (!uploadId || !partNumber) {
        throw new ValidationError('uploadId and partNumber are required');
      }

      const bucket = getR2Bucket(env);

      // 解码 base64 数据
      const binaryData = Uint8Array.from(atob(data), c => c.charCodeAt(0));

      const uploadedPart = await bucket.uploadPart(key, uploadId, partNumber, binaryData);

      return new Response(JSON.stringify({
        success: true,
        partNumber,
        etag: uploadedPart.etag
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 完成多部分上传
  async complete(request, env) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.match(/\/api\/objects\/(.+)\/multipart\/complete/)?.[1];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      const body = await request.json();
      const { uploadId, parts } = body;

      if (!uploadId || !Array.isArray(parts)) {
        throw new ValidationError('uploadId and parts array are required');
      }

      const bucket = getR2Bucket(env);

      const object = await bucket.completeMultipartUpload(key, uploadId, parts);

      return new Response(JSON.stringify({
        success: true,
        message: 'Multipart upload completed',
        key,
        etag: object.httpEtag,
        size: object.size
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // 中止多部分上传
  async abort(request, env) {
    try {
      const url = new URL(request.url);
      const matches = url.pathname.match(/\/api\/objects\/(.+)\/multipart\/(.+)/);
      const key = matches?.[1];
      const uploadId = matches?.[2];

      if (!validateKey(key)) {
        throw new ValidationError('Invalid object key');
      }

      if (!uploadId) {
        throw new ValidationError('uploadId is required');
      }

      const bucket = getR2Bucket(env);
      await bucket.abortMultipartUpload(key, uploadId);

      return new Response(JSON.stringify({
        success: true,
        message: 'Multipart upload aborted',
        key,
        uploadId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
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


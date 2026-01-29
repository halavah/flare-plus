// Webhook 签名验证工具
import { SignatureError } from '../middleware/error.js';

// GitHub 签名验证
export async function verifyGitHubSignature(payload, signature, secret) {
  if (!signature) {
    throw new SignatureError('Missing signature');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (signature !== expectedSignature) {
    throw new SignatureError('Invalid GitHub signature');
  }

  return true;
}

// Stripe 签名验证
export async function verifyStripeSignature(payload, signature, secret) {
  if (!signature) {
    throw new SignatureError('Missing signature');
  }

  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.substring(2);
  const sig = parts.find(p => p.startsWith('v1='))?.substring(3);

  if (!timestamp || !sig) {
    throw new SignatureError('Invalid Stripe signature format');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (sig !== expectedSignature) {
    throw new SignatureError('Invalid Stripe signature');
  }

  // 验证时间戳（防止重放攻击）
  const currentTime = Math.floor(Date.now() / 1000);
  const tolerance = 300; // 5分钟容差

  if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
    throw new SignatureError('Signature timestamp too old');
  }

  return true;
}

// Slack 签名验证
export async function verifySlackSignature(payload, signature, timestamp, secret) {
  if (!signature || !timestamp) {
    throw new SignatureError('Missing signature or timestamp');
  }

  // 验证时间戳
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    throw new SignatureError('Request timestamp too old');
  }

  const signedPayload = `v0:${timestamp}:${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = 'v0=' + Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (signature !== expectedSignature) {
    throw new SignatureError('Invalid Slack signature');
  }

  return true;
}

// 通用 HMAC 签名验证
export async function verifyHmacSignature(payload, signature, secret, algorithm = 'SHA-256') {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}


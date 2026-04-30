import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validatePassword,
  checkRateLimit,
  validateUploadFile,
  generateSafeFileName,
  sanitizeInput,
  validateEmail,
} from './security';

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('8');
  });

  it('rejects passwords without lowercase', () => {
    const result = validatePassword('ABC123!!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('小写字母');
  });

  it('rejects passwords without uppercase', () => {
    const result = validatePassword('abc123!!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('大写字母');
  });

  it('rejects passwords without digits', () => {
    const result = validatePassword('Abcdef!!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('数字');
  });

  it('rejects passwords without special chars', () => {
    const result = validatePassword('Abcdef12');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('特殊字符');
  });

  it('rejects common weak passwords', () => {
    const result = validatePassword('Password123!');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('常见');
  });

  it('accepts strong passwords', () => {
    const result = validatePassword('MyStr0ng!Pass');
    expect(result.valid).toBe(true);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    const key = 'test-ip';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBe(0);
    }
  });

  it('blocks requests over the limit', () => {
    const key = 'test-ip-2';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets after window expires', () => {
    const key = 'test-ip-3';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    vi.advanceTimersByTime(61000);
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
  });
});

describe('validateUploadFile', () => {
  it('rejects oversized files', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('大小');
  });

  it('rejects disallowed file types', () => {
    const file = new File([''], 'test.exe', { type: 'application/x-msdownload' });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不支持');
  });

  it('accepts valid image files', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects filenames with illegal characters', () => {
    const file = new File([''], 'test<>.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('非法字符');
  });
});

describe('generateSafeFileName', () => {
  it('sanitizes special characters', () => {
    const name = generateSafeFileName('my file<name>.png');
    expect(name).not.toContain('<');
    expect(name).not.toContain('>');
    expect(name.endsWith('.png')).toBe(true);
  });

  it('preserves valid names', () => {
    const name = generateSafeFileName('photo.jpg');
    expect(name.endsWith('photo.jpg')).toBe(true);
  });

  it('truncates long names', () => {
    const longName = 'a'.repeat(100) + '.txt';
    const name = generateSafeFileName(longName);
    expect(name.length).toBeLessThan(longName.length + 30);
  });
});

describe('sanitizeInput', () => {
  it('escapes HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('escapes quotes', () => {
    expect(sanitizeInput('"onclick="evil()')).not.toContain('"');
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@sub.domain.co')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

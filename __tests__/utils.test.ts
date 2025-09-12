import { describe, it, expect, vi } from 'vitest';
import { normalizePlate, onlyDigits, logError } from '@/lib/utils';

describe('normalizePlate', () => {
  it('removes non-alphanumeric characters and uppercases', () => {
    expect(normalizePlate('abc-1234')).toBe('ABC1234');
  });
});

describe('onlyDigits', () => {
  it('filters out non-digit characters', () => {
    expect(onlyDigits('a1b2c3')).toBe('123');
  });
});

describe('logError', () => {
  it('logs error with context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('context', 'err');
    expect(spy).toHaveBeenCalledWith('[context]', 'err');
    spy.mockRestore();
  });
});

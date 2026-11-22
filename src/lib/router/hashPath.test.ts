import { describe, expect, it } from 'vitest';
import { readHashPath } from './hashPath';

describe('readHashPath', () => {
  it.each<[string, string]>([
    ['', '/'],
    ['#', '/'],
    ['#/', '/'],
    ['#/schmid', '/schmid'],
    ['#/schmid/', '/schmid'],
    ['#schmid', '/schmid'],
    ['#/miller?modo=plano', '/miller'],
  ])('%s → %s', (hash, expected) => {
    expect(readHashPath(hash)).toBe(expected);
  });
});

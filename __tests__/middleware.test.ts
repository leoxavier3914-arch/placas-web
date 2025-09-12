import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

const url = 'http://localhost/api/test';

describe('middleware auth', () => {
  it('blocks requests without valid token', () => {
    process.env.API_TOKEN = 'secret';
    const req = new NextRequest(url);
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it('allows requests with valid bearer token', () => {
    process.env.API_TOKEN = 'secret';
    const req = new NextRequest(url, { headers: { Authorization: 'Bearer secret' } });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});

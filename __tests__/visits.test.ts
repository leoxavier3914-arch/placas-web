import { describe, it, expect, vi, beforeEach } from 'vitest';

const supabaseMock: any = {
  from: vi.fn(),
};

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => supabaseMock,
}));

vi.mock('@/lib/env', () => ({
  getCompanyId: () => 'company-1',
  default: {
    COMPANY_ID: 'company-1',
    DEFAULT_BRANCH_ID: 'branch-1',
    NEXT_PUBLIC_SUPABASE_URL: 'url',
    SUPABASE_SERVICE_ROLE_KEY: 'key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
    NODE_ENV: 'test',
  },
  getCompanyId: () => 'company-1',
}));

process.env.DEFAULT_BRANCH_ID = 'branch-1';

import { GET as openGET } from '@/app/api/visits/open/route';
import { POST as checkinPOST } from '@/app/api/visits/checkin/route';
import { GET as historyGET } from '@/app/api/visits/history/route';
import { POST as checkoutPOST } from '@/app/api/visits/[id]/checkout/route';

beforeEach(() => {
  supabaseMock.from.mockReset();
});

describe('GET /api/visits/open', () => {
  it('returns open visits', async () => {
    supabaseMock.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            is: () => ({
              order: async () => ({ data: [{ id: 1 }], error: null }),
            }),
          }),
        }),
      }),
    });
    const res = await openGET();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(1);
  });
});

describe('POST /api/visits/checkin', () => {
  it('creates a visit', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'visits') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    limit: async () => ({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 1 }, error: null }),
            }),
          }),
        };
      }
      if (table === 'visit_events') {
        return {
          insert: async () => ({ error: null }),
        };
      }
    });
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ personId: 'p1' }),
    });
    const res = await checkinPOST(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.visit.id).toBe(1);
  });
});

describe('POST /api/visits/[id]/checkout', () => {
  it('closes a visit', async () => {
    let call = 0;
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'visits') {
        call++;
        if (call === 1) {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { company_id: 'company-1', branch_id: 'branch-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: { id: '1' }, error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'visit_events') {
        return { insert: async () => ({ error: null }) };
      }
    });
    const res = await checkoutPOST(new Request('http://test', { method: 'POST' }), {
      params: { id: '1' },
    });
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.visit.id).toBe('1');
  });
});

describe('GET /api/visits/history', () => {
  it('returns paginated visit history', async () => {
    supabaseMock.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            or: () => ({
              order: () => ({
                range: async () => ({
                  data: [{ id: 1 }],
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      }),
    });
    const req = new Request('http://test?start=2024-01-01&end=2024-01-31&page=1&pageSize=10');
    const res = await historyGET(req);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.total).toBe(1);
    expect(json.data).toHaveLength(1);
  });
});

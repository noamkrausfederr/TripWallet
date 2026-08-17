import { describe, it, expect, vi, beforeEach } from 'vitest';
import deleteHandler from '../src/pages/api/docs/delete';
import cleanupHandler from '../src/pages/api/docs/cleanup-by-booking';

function mockReq(body = {}, headers = {}) {
  return {
    method: 'POST',
    body,
    headers,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: any) => { res._json = payload; return res; };
  res.end = () => {}; 
  return res;
}

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: { getUser: vi.fn(() => ({ data: { user: { id: 'user-a' } } })) },
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn(() => ({ data: null })) })),
    })),
  } as any;
});

vi.mock('../src/lib/supabaseClient', async () => {
  return {
    getServiceRoleClient: () => ({
      from: (table: string) => ({
        select: (cols: string) => ({
          eq: (k: string, v: any) => ({ single: async () => ({ data: { id: 'doc-1', storage_path: 'path.pdf', user_id: 'user-a' } }) })
        })
      }),
      storage: { from: (b: string) => ({ remove: async (paths: string[]) => ({ error: null }) }) },
      // delete stub
      fromDelete: () => ({ delete: async () => ({ error: null }) })
    })
  } as any;
});

describe('docs API handlers basic smoke', () => {
  it('delete handler returns 401 without token', async () => {
    const req = mockReq({ documentId: 'doc-1' });
    const res = mockRes();
    await deleteHandler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('cleanup handler returns 401 without token', async () => {
    const req = mockReq({ bookingId: 'b-1' });
    const res = mockRes();
    await cleanupHandler(req, res);
    expect(res.statusCode).toBe(401);
  });
});

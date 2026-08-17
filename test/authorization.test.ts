import { describe, it, expect, vi } from 'vitest';
import signedUrlHandler from '../src/pages/api/docs/signed-url';
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

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-b' } } })) },
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn(async () => ({ data: null })) })),
  }))
}));

// Mock server secret client to return a document owned by user-a
vi.mock('../src/lib/supabaseClient', () => ({
  getServiceRoleClient: () => ({
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (k: string, v: any) => ({ single: async () => ({ data: { id: 'doc-1', storage_path: 'p.pdf', user_id: 'user-a' } }) })
      })
    }),
    storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://signed' } }) , remove: async () => ({ error: null }) }) }
  })
}));

describe('Authorization tests for doc endpoints', () => {
  it('signed-url returns 403 when user does not own document', async () => {
    const req = mockReq({ documentId: 'doc-1' }, { authorization: 'Bearer token-for-user-b' });
    const res = mockRes();
    await signedUrlHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('delete returns 403 when user does not own document', async () => {
    const req = mockReq({ documentId: 'doc-1' }, { authorization: 'Bearer token-for-user-b' });
    const res = mockRes();
    await deleteHandler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('cleanup-by-booking returns 403 when booking not owned by user', async () => {
    // For this test, mock createClient getUser to return user-b and the userClient bookings query to return no booking
    const req = mockReq({ bookingId: 'booking-1' }, { authorization: 'Bearer token-for-user-b' });
    const res = mockRes();
    await cleanupHandler(req, res);
    expect(res.statusCode).toBe(403);
  });
});

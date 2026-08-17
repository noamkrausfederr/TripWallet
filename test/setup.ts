import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// API-handler tests mock Supabase, but still exercise the configuration guard.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= 'test-publishable-key';
process.env.SUPABASE_SECRET_KEY ||= 'test-service-role-key';

afterEach(() => {
  cleanup();
});

vi.stubGlobal('confirm', vi.fn(() => true));

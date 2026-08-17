import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

vi.mock('next/router', () => ({ useRouter: () => ({ query: { id: 'trip-1' }, push: vi.fn() }) }));
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-a' } } })) },
    from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'booking-1' } } ) }) }) }),
    storage: { from: () => ({ upload: vi.fn(async () => ({ error: null })) }) }
  }
}));

import NewBooking from '../src/pages/trips/[id]/bookings/new';
import { MAX_FILE_SIZE } from '../src/lib/fileHelpers';

describe('booking upload invalid file', () => {
  it('shows error when file too large', async () => {
    render(<NewBooking />);
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-10-04' } });
    fireEvent.change(screen.getByLabelText(/^Address$/i), { target: { value: '1 Main Street, Rome' } });

    const big = new File([new ArrayBuffer(MAX_FILE_SIZE + 100)], 'big.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Upload ticket/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [big] });
    fireEvent.change(input);

    fireEvent.click(screen.getByText(/Create booking/i));

    await waitFor(() => screen.getByText(/Invalid file type or too large/));
  });
});

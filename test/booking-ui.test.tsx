import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMock = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { id: 'trip-1', bid: 'booking-1' }, push: routerMock.push }),
}));

vi.mock('../src/lib/supabaseClient', () => {
  const mockAuth = { getUser: vi.fn(async () => ({ data: { user: { id: 'user-a' } } })) };
  const mockStorage = { from: () => ({ upload: vi.fn(async () => ({ error: null })) }) };
  const mockFrom = () => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: async () => ({ data: { id: 'booking-1', trip_id: 'trip-1' } }) })) })),
  });
  return { supabase: { auth: mockAuth, storage: mockStorage, from: mockFrom } };
});

vi.mock('../src/lib/docsApi', () => ({
  getSignedUrl: vi.fn(async () => 'https://signed.url/file.pdf'),
  deleteDocument: vi.fn(async () => true),
  cleanupBookingDocuments: vi.fn(async () => true),
}));

import NewBooking from '../src/pages/trips/[id]/bookings/new';
import BookingDetails from '../src/pages/trips/[id]/bookings/[bid]';
import { deleteDocument, getSignedUrl } from '../src/lib/docsApi';

const booking = {
  id: 'booking-1',
  title: 'Flight to Rome',
  type: 'Flight',
  booking_date: '2026-10-04',
  booking_time: '08:00',
  confirmation_number: 'CONF-1',
  notes: 'Window seat',
};

function mockBookingDetails(documentRows = [{ id: 'doc-1', file_name: 'ticket.pdf', file_type: 'application/pdf' }]) {
  return (table: string) => {
    if (table === 'bookings') {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: booking, error: null }) }) }) };
    }
    if (table === 'booking_documents') {
      return { select: () => ({ eq: () => ({ order: async () => ({ data: documentRows }) }) }) };
    }
    return {};
  };
}

describe('Booking UI flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a booking and uploads a file', async () => {
    render(<NewBooking />);
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Flight to Rome' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2026-10-04' } });

    const file = new File(['dummy'], 'ticket.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/Upload ticket/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    fireEvent.click(screen.getByText(/Create booking/i));
    await waitFor(() => expect(screen.queryByText(/Creating/)).not.toBeInTheDocument());
  });

  it('shows reservation details and opens its document with a signed URL', async () => {
    const { supabase } = await import('../src/lib/supabaseClient');
    supabase.from = mockBookingDetails() as any;
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null as any);

    render(<BookingDetails />);
    await screen.findByText('Flight to Rome');
    expect(screen.getByText('CONF-1')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/View document/i));

    await waitFor(() => expect(getSignedUrl).toHaveBeenCalledWith('doc-1'));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('deletes an attached document from the booking details page', async () => {
    const { supabase } = await import('../src/lib/supabaseClient');
    supabase.from = mockBookingDetails() as any;

    render(<BookingDetails />);
    await screen.findByText('ticket.pdf');
    fireEvent.click(screen.getByRole('button', { name: /delete document/i }));

    await waitFor(() => expect(deleteDocument).toHaveBeenCalledWith('doc-1'));
    expect(screen.queryByText('ticket.pdf')).not.toBeInTheDocument();
    expect(screen.getByText(/No documents attached/i)).toBeInTheDocument();
  });

  it('shows an empty state when a reservation has no documents', async () => {
    const { supabase } = await import('../src/lib/supabaseClient');
    supabase.from = mockBookingDetails([]) as any;

    render(<BookingDetails />);
    expect(await screen.findByText(/No documents attached/i)).toBeInTheDocument();
  });
});

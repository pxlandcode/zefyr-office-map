type FetchLike = typeof fetch;

function jsonOrText(res: Response) {
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}

// (If you later require Supabase auth on the API, pass access_token to add Authorization)
function authHeaders(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/rooms/status
export async function getRoomStatus(fetcher: FetchLike = fetch) {
    const res = await fetcher('/api/rooms/status');
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<{
        rooms: any[];
        ongoingMeetings: any[];
        upcomingMeetings: any[];
        errors?: { room: string; error: string }[];
    }>;
}

// POST /api/rooms/book
export async function bookRoom(
    roomEmail: string,
    bookingOption: number,
    pin: string,
    opts?: { access_token?: string; fetcher?: FetchLike }
) {
    const f = opts?.fetcher ?? fetch;
    const res = await f('/api/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(opts?.access_token) },
        body: JSON.stringify({ roomEmail, bookingOption, pin }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await jsonOrText(res)) as { message: string } | string;
}

// POST /api/rooms/cancel
export async function cancelRoomBooking(
    roomEmail: string,
    pin: string,
    opts?: { access_token?: string; fetcher?: FetchLike }
) {
    const f = opts?.fetcher ?? fetch;
    const res = await f('/api/rooms/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(opts?.access_token) },
        body: JSON.stringify({ roomEmail, pin }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await jsonOrText(res)) as { message: string } | string;
}

// POST /api/rooms/extend
export async function extendRoomBooking(
    roomEmail: string,
    extensionOption: number,
    pin: string,
    opts?: { access_token?: string; fetcher?: FetchLike }
) {
    const f = opts?.fetcher ?? fetch;
    const res = await f('/api/rooms/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(opts?.access_token) },
        body: JSON.stringify({ roomEmail, extensionOption, pin }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await jsonOrText(res)) as { message: string } | string;
}

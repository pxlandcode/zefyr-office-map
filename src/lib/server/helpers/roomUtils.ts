export function getRoomDisplayName(email: string) {
    const map: Record<string, string> = {
        'avatar@zefyr.se': 'Avatar',
        'matrix@zefyr.se': 'Matrix',
        'billyelliot@zefyr.se': 'Billy Elliot',
        'nyckelntillfrihet@zefyr.se': 'Nyckeln till frihet',
        'phonebooth@zefyr.se': 'Phone Booth',
        'teamsrum@zefyr.se': 'Teamsrum',
    };
    return map[email] ?? email;
}

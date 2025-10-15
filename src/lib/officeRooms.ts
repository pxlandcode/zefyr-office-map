import type { OfficeRoom } from '$lib/types/officeRoomTypes';

export const officeRooms: Record<string, OfficeRoom> = {
    'Pixel-Room': {
        id: 'Pixel-Room',
        name: 'Pixel & Code',
        company: 'Pixel & Code',
        tagline: 'Creative digital experiences built with care.',
        description:
            'Pixel & Code is a digital studio crafting immersive brand experiences and thoughtful web products with a focus on detail-rich design.',
        image: '/offices/pixel-room.svg',
    },
    'Friday-Room': {
        id: 'Friday-Room',
        name: 'Friday Networking',
        company: 'Friday Networking',
        tagline: 'Connecting people over ideas, coffee, and good energy.',
        description:
            'Friday Networking is a community-driven consultancy helping teams grow through meaningful partnerships and inspiring events every week.',
        image: '/offices/friday-room.svg',
    },
    'Mavrix-Room': {
        id: 'Mavrix-Room',
        name: 'Mavrix',
        company: 'Mavrix',
        tagline: 'Strategy-led storytellers for bold brands.',
        description:
            'Mavrix is a brand and communications collective amplifying Nordic ventures with strategy, storytelling, and a dash of rebellious spirit.',
        image: '/offices/mavrix-room.svg',
    },
};

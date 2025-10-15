import pixelcodePopupImage from '$lib/assets/company-images/pixelcodepopupimage.jpg';
import pixelcodeLogo from '$lib/assets/company-logos/pixelcodelogo.svg';
import type { OfficeRoom } from '$lib/types/officeRoomTypes';

export const officeRooms: Record<string, OfficeRoom> = {
    'Pixel-Room': {
        id: 'Pixel-Room',
        name: 'Pixel&Code_',
        company: 'Pixel&Code_',
        tagline: 'A truly inspiring workplace',
        description:
            'På Pixel&Code_ tror vi att bra teknik skapas av människor som trivs och bryr sig om det de gör. Vi bygger digitala produkter med hjärta, nyfikenhet och en gedigen erfarenhet som gör skillnad.',
        extra: 'Fyll upp en kopp kaffe och slå dig ned i vår soffa, vi pratar gärna teknik, design och idéer.',
        image: pixelcodePopupImage,
        icon: 'PixelCode',
        logo: pixelcodeLogo,
        brandColor: '#E76F51',
    },
    'Friday-Room': {
        id: 'Friday-Room',
        name: 'Friday Vibes',
        company: 'Friday Vibes',
        tagline: 'Where brilliant ideas and good times collide.',
        description:
            'Fredagar hos oss handlar om att samla smarta människor kring spännande samtal. Vi matchar entreprenörer, kreatörer och tekniknördar för att lösa riktiga problem – alltid med en avslappnad stämning och mycket skratt.',
        image: pixelcodePopupImage,
    },
    'Mavrix-Room': {
        id: 'Mavrix-Room',
        name: 'Mavrix',
        company: 'Mavrix',
        tagline: 'Strategy-led storytellers for bold brands.',
        description:
            'Mavrix väver samman strategi, berättelser och design för att göra varumärken oförglömliga. Vi hjälper team ta nästa steg med tydliga narrativ, modiga koncept och kreativt genomförande som märks.',
        image: pixelcodePopupImage,
    },
};

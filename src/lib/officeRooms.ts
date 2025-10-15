import pixelcodePopupImage from '$lib/assets/company-images/pixelcodepopupimage.webp';
import fridayVibesPopupImage from '$lib/assets/company-images/fridayvibespopupimage.webp';
import mavrixPopupImage from '$lib/assets/company-images/mavrixpopupimage.webp';
import pixelcodeLogo from '$lib/assets/company-logos/pixelcodelogo.svg';
import fridayVibesLogo from '$lib/assets/company-logos/fridayvibeslogo.svg';
import mavrixLogo from '$lib/assets/company-logos/mavrixlogo.svg';
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
        tagline: 'We make your brand feel like Friday',
        description:
            'Friday Vibes lyfter tech-företags employer branding och talangstrategi. Vi skapar engagerande berättelser, rekryteringsresor och kulturinitiativ som attraherar, behåller och stärker era mest värdefulla människor.',
        image: fridayVibesPopupImage,
        icon: 'FridayVibes',
        logo: fridayVibesLogo,
        logoHeight: 40,
        brandColor: '#ED95B7',
    },
    'Mavrix-Room': {
        id: 'Mavrix-Room',
        name: 'Mavrix',
        company: 'Mavrix',
        tagline: 'Teknik med mening',
        description:
            'Mavrix kombinerar strategi, teknik och mänsklig insikt för att omvandla möjligheter till verkligt värde. Vi guidar organisationer i digital transformation, från AI och Microsoft-ekosystem till helhetslösningar som stärker affär, kultur och kundrelation.',
        image: mavrixPopupImage,
        icon: 'Mavrix',
        logo: mavrixLogo,
        logoHeight: 40,
        brandColor: '#034EA1',
    },
};

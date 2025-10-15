export type OfficeRoom = {
    id: string;
    name: string;
    company: string;
    description: string;
    extra?: string;
    tagline?: string;
    image: string;
    website?: string;
    icon?: string;
    logo?: string;
    logoHeight?: number;
    brandColor?: string;
};

export type OfficeRoomPopupOptions = {
    width?: string;
    height?: string;
};

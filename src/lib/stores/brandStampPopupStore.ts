import { writable } from 'svelte/store';

type Options = {
    title?: string;
    message?: string;
    icon?: string;
};

type State = {
    open: boolean;
    options: Options;
};

const defaults: Options = {
    title: 'Pixel&Code_',
    icon: 'PixelCode',
};

const initial: State = { open: false, options: { ...defaults } };

export const brandStampPopup = writable<State>(initial);

export function openBrandStampPopup(options?: Options) {
    brandStampPopup.update((s) => ({
        open: true,
        options: { ...defaults, ...(options ?? {}) },
    }));
}

export function closeBrandStampPopup() {
    brandStampPopup.update((s) => ({ ...s, open: false }));
}

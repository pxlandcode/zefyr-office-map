import { writable } from 'svelte/store';

export const loadingStore = writable(false);

export function loading(isLoading: boolean) {
    loadingStore.set(isLoading);
}

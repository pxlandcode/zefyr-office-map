import { writable } from 'svelte/store';

export const CLICK_INDICATOR_TOTAL = 5;
export const CLICK_INDICATOR_MIN_VISIBLE = 1;

export type ClickIndicatorState = {
    show: boolean;
    count: number;
    total: number;
};

const initialState: ClickIndicatorState = {
    show: false,
    count: 0,
    total: CLICK_INDICATOR_TOTAL,
};

function createClickIndicatorStore() {
    const { subscribe, set } = writable<ClickIndicatorState>(initialState);

    return {
        subscribe,
        setProgress(count: number) {
            const clampedCount = Math.max(0, Math.min(count, CLICK_INDICATOR_TOTAL));
            set({
                show: clampedCount > 0,
                count: clampedCount,
                total: CLICK_INDICATOR_TOTAL,
            });
        },
        reset() {
            set(initialState);
        },
    };
}

export const clickIndicatorStore = createClickIndicatorStore();

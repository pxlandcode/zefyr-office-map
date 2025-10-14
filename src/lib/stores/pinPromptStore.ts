import { writable } from 'svelte/store';

export type PinPromptOptions = {
    title?: string;
    message?: string;
    min?: number;
    max?: number;
    confirmIcon?: string;
    validate?: (pin: string) => boolean | string | Promise<boolean | string>;
    successDelay?: number;
};

export type PinRunOptions = PinPromptOptions & {
    actionLabel?: string;
    successLabel?: string;
    run: (pin: string) => Promise<void>;
    runSuccessDelay?: number;
};

type State = {
    open: boolean;
    options: Required<Pick<PinPromptOptions, 'min' | 'max' | 'confirmIcon'>> &
        Omit<PinPromptOptions, 'min' | 'max' | 'confirmIcon'>;
    _resolvePin?: (pin: string | null) => void;
    _run?: PinRunOptions['run'] | null;
    _resolveRun?: (ok: boolean) => void;
    _actionLabel?: string;
    _successLabel?: string;
    _runSuccessDelay?: number;
};

const defaults = { min: 4, max: 8, confirmIcon: 'Check', successDelay: 600 } as const;

export const pinPrompt = writable<State>({
    open: false,
    options: { ...defaults },
    _run: null,
});

export function askForPin(opts?: PinPromptOptions) {
    return new Promise<string | null>((resolve) => {
        pinPrompt.set({
            open: true,
            options: { ...defaults, ...opts },
            _resolvePin: resolve,
            _run: null,
        });
    });
}

export function runWithPin(opts: PinRunOptions) {
    return new Promise<boolean>((resolve) => {
        pinPrompt.set({
            open: true,
            options: { ...defaults, ...opts },
            _run: opts.run,
            _resolveRun: resolve,
            _resolvePin: undefined,
            _actionLabel: opts.actionLabel ?? 'Utför…',
            _successLabel: opts.successLabel ?? 'Klart',
            _runSuccessDelay: opts.runSuccessDelay ?? 350,
        });
    });
}

export function closePinPrompt() {
    pinPrompt.update((s) => ({ ...s, open: false }));
}

export function _fulfillPin(pin: string | null) {
    let resolvePin: State['_resolvePin'];
    pinPrompt.update((s) => {
        resolvePin = s._resolvePin;
        return {
            open: false,
            options: { ...defaults },
            _run: null,
            _resolveRun: undefined,
            _resolvePin: undefined,
        };
    });
    resolvePin?.(pin ?? null);
}

export function _finishRun(ok: boolean) {
    let resolveRun: State['_resolveRun'];
    pinPrompt.update((s) => {
        resolveRun = s._resolveRun;
        return {
            open: false,
            options: { ...defaults },
            _run: null,
            _resolvePin: undefined,
            _resolveRun: undefined,
        };
    });
    resolveRun?.(ok);
}

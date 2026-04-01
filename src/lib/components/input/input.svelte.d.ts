import type { HTMLInputAttributes } from 'svelte/elements';
import type { Component } from 'svelte';

type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Props = {
    icon?: Component<{ class?: string }>;
    value?: HTMLInputAttributes['value'];
    size?: InputSize;
    class?: string;
    type?: Extract<HTMLInputAttributes['type'], 'email' | 'hidden' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'>;
    node?: HTMLInputElement;
};

type $$ComponentProps = Props & Omit<HTMLInputAttributes, 'size'>;

declare const Input: import("svelte").Component<$$ComponentProps, {}, "value" | "node">;
type Input = ReturnType<typeof Input>;
export default Input;
export type { InputSize };

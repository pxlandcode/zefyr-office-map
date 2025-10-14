<script lang="ts">
    import Icon from '$lib/components/ui/icon-component/Icon.svelte';
    import { ripple } from '$lib/actions/ripple';
    import { createEventDispatcher } from 'svelte';

    export let value = '';
    export let min = 4;
    export let max = 8;
    export let confirmIcon: string = 'Check';
    export let confirmAria = 'Bekräfta';
    export let backAria = 'Radera senaste';
    export let disabled = false;
    export let noConfirm = false;
    export let state: 'idle' | 'error' | 'success' = 'idle';
    export let pending = false;

    export let showLetters = true;
    const lettersMap: Record<string, string> = {
        '1': '',
        '2': 'ABC',
        '3': 'DEF',
        '4': 'GHI',
        '5': 'JKL',
        '6': 'MNO',
        '7': 'PQRS',
        '8': 'TUV',
        '9': 'WXYZ',
        '0': '+',
    };

    const dispatch = createEventDispatcher<{ input: string; confirm: string; cancel: void }>();

    let clearOnNextDigit = false;
    let prevState: typeof state = 'idle';
    $: if (state !== prevState) {
        if (state === 'error') clearOnNextDigit = true;
        prevState = state;
    }

    function emitInput(next: string) {
        value = next;
        dispatch('input', value);
    }

    const pushDigit = (d: string) => {
        if (disabled || pending) return;
        if (clearOnNextDigit) {
            clearOnNextDigit = false;
            emitInput('');
        }
        if (value.length >= max) return;
        emitInput(value + d);
    };

    const backspace = () => {
        if (disabled || pending) return;
        if (clearOnNextDigit) {
            clearOnNextDigit = false;
            emitInput('');
            return;
        }
        if (!value) return;
        emitInput(value.slice(0, -1));
    };

    const confirm = () => {
        if (disabled || pending) return;
        if (value.length < min) return;
        dispatch('confirm', value);
    };

    const handleKey = (e: KeyboardEvent) => {
        if (disabled || pending) return;
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            pushDigit(e.key);
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            backspace();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            confirm();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            dispatch('cancel');
        }
    };

    $: dotFilledClass =
        state === 'error' ? 'bg-red-500' : state === 'success' ? 'bg-green-500' : 'bg-black';
    $: dotEmptyClass = 'bg-gray-300';
</script>

<div
    class="w-[320px] select-none"
    on:keydown={handleKey}
    tabindex="0"
    aria-label="PIN inmatning"
    aria-busy={pending}
>
    <div class="flex justify-center gap-2 mb-4">
        {#each Array(max) as _, i}
            <div
                class={`w-3 h-3 rounded-full ${i < value.length ? dotFilledClass : dotEmptyClass} transition-colors duration-200`}
            />
        {/each}
    </div>

    <div class="relative">
        <div aria-hidden="true">
            <!-- verticals -->
            <span class="line v" style="left: calc(100%/3);"></span>
            <span class="line v" style="left: calc(100%*2/3);"></span>
            <!-- horizontals -->
            <span class="line h" style="top: calc(100%/4);"></span>
            <span class="line h" style="top: calc(100%*2/4);"></span>
            <span class="line h" style="top: calc(100%*3/4);"></span>
        </div>

        <div class="grid grid-cols-3 grid-rows-4">
            <!-- Row 1 -->
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('1')}
                aria-label="1"
            >
                <div class="keycap">
                    <span class="num">1</span>
                    {#if showLetters}<span class="letters">{lettersMap['1']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('2')}
                aria-label="2"
            >
                <div class="keycap">
                    <span class="num">2</span>
                    {#if showLetters}<span class="letters">{lettersMap['2']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('3')}
                aria-label="3"
            >
                <div class="keycap">
                    <span class="num">3</span>
                    {#if showLetters}<span class="letters">{lettersMap['3']}</span>{/if}
                </div>
            </button>

            <!-- Row 2 -->
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('4')}
                aria-label="4"
            >
                <div class="keycap">
                    <span class="num">4</span>
                    {#if showLetters}<span class="letters">{lettersMap['4']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('5')}
                aria-label="5"
            >
                <div class="keycap">
                    <span class="num">5</span>
                    {#if showLetters}<span class="letters">{lettersMap['5']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('6')}
                aria-label="6"
            >
                <div class="keycap">
                    <span class="num">6</span>
                    {#if showLetters}<span class="letters">{lettersMap['6']}</span>{/if}
                </div>
            </button>

            <!-- Row 3 -->
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('7')}
                aria-label="7"
            >
                <div class="keycap">
                    <span class="num">7</span>
                    {#if showLetters}<span class="letters">{lettersMap['7']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('8')}
                aria-label="8"
            >
                <div class="keycap">
                    <span class="num">8</span>
                    {#if showLetters}<span class="letters">{lettersMap['8']}</span>{/if}
                </div>
            </button>
            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('9')}
                aria-label="9"
            >
                <div class="keycap">
                    <span class="num">9</span>
                    {#if showLetters}<span class="letters">{lettersMap['9']}</span>{/if}
                </div>
            </button>

            <!-- Row 4 -->
            <button
                type="button"
                class="key relative overflow-hidden flex items-center justify-center text-red"
                use:ripple={{ color: 'rgba(180,83,9,0.25)' }}
                on:click={backspace}
                aria-label={backAria}
                title={backAria}
            >
                <Icon icon="Backspace" size="24px" color="red" />
            </button>

            <button
                type="button"
                class="key relative overflow-hidden"
                use:ripple
                on:click={() => pushDigit('0')}
                aria-label="0"
            >
                <div class="keycap">
                    <span class="num">0</span>
                    {#if showLetters}<span class="letters">{lettersMap['0']}</span>{/if}
                </div>
            </button>

            {#if !noConfirm}
                <button
                    type="button"
                    class="key relative overflow-hidden flex items-center justify-center disabled:opacity-40 text-green-bright"
                    use:ripple={{ color: 'rgba(0,0,0,0.2)' }}
                    on:click={confirm}
                    aria-label={confirmAria}
                    title={confirmAria}
                    disabled={value.length < min}
                >
                    <div class={`rounded-full p-1 ${value.length < min ? 'opacity-40' : ''}`}>
                        <Icon icon={confirmIcon} size="24px" color="green-bright" />
                    </div>
                </button>
            {/if}
        </div>

        {#if pending}
            <div
                class="absolute inset-0 z-10 flex items-center justify-center bg-white/40 pointer-events-auto"
                aria-hidden="true"
            ></div>
        {/if}
    </div>
</div>

<style>
    .key {
        @apply w-[106px] h-[80px] text-3xl font-serif bg-transparent;
    }

    /* Number + letters inside the key */
    .keycap {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
        width: 100%;
    }
    .keycap .num {
        /* keep your big number look */
        /* text-3xl already from .key; ensure tight leading */
        line-height: 1;
    }
    .keycap .letters {
        margin-top: 2px; /* a little breathing room */
        font-size: 10px; /* small sublabel */
        letter-spacing: 0.08em; /* mimic old key legends */
        text-transform: uppercase;
        opacity: 0.6;
        pointer-events: none;
        user-select: none;
    }

    .line {
        position: absolute;
        background: #cfd2d6;
        pointer-events: none;
    }
    .line.v {
        top: 10px;
        bottom: 10px;
        width: 1px;
        transform: translateX(-0.5px);
    }
    .line.h {
        left: 10px;
        right: 10px;
        height: 1px;
        transform: translateY(-0.5px);
    }
</style>

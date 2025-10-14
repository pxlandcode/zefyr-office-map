<script lang="ts">
    import { pinPrompt, _fulfillPin, closePinPrompt, _finishRun } from '$lib/stores/pinPromptStore';
    import PinPad from '../ui/pin-pad/PinPad.svelte';
    import PopupWrapper from '../ui/popup-wrapper/PopupWrapper.svelte';
    import { onDestroy } from 'svelte';

    let open = false;
    let title = 'Ange PIN';
    let message: string | undefined;
    let min = 4,
        max = 8,
        confirmIcon = 'Check';
    let validate: ((pin: string) => boolean | string | Promise<boolean | string>) | undefined;

    // run mode extras
    let run: ((pin: string) => Promise<void>) | null = null;
    let actionLabel = 'Utför…';
    let successLabel = 'Klart';
    let runSuccessDelay = 350;

    let pin = '';
    let stage: 'idle' | 'validating' | 'performing' | 'success' | 'error' = 'idle';
    let errorText: string | null = null;
    let pending = false;
    let shake = false;

    const unsub = pinPrompt.subscribe((s) => {
        open = s.open;
        title = s.options.title ?? 'Ange PIN';
        message = s.options.message;
        min = s.options.min;
        max = s.options.max;
        confirmIcon = s.options.confirmIcon;
        validate = s.options.validate;
        run = s._run ?? null;
        actionLabel = s._actionLabel ?? 'Utför…';
        successLabel = s._successLabel ?? 'Klart';
        runSuccessDelay = s._runSuccessDelay ?? 350;

        if (open) {
            pin = '';
            stage = 'idle';
            errorText = null;
            pending = false;
            shake = false;
        }
    });

    function handleClose() {
        if (pending) return;
        closePinPrompt();
        // if we were in askForPin mode, resolve null
        _fulfillPin(null);
        // if run mode was open and got closed manually, resolve false
        _finishRun(false);
    }

    function onInput(v: string) {
        pin = v.replace(/\D/g, '').slice(0, max);
        if (stage === 'error') {
            stage = 'idle';
            errorText = null;
        }
    }

    async function onConfirm() {
        if (pending) return;
        if (pin.length < min) return;

        // 1) VALIDATE
        if (validate) {
            try {
                stage = 'validating';
                pending = true;
                const result = await validate(pin);
                const ok = typeof result === 'string' ? false : !!result;
                if (!ok) {
                    stage = 'error';
                    pending = false;
                    errorText = typeof result === 'string' ? result : 'Fel PIN';
                    shake = true;
                    setTimeout(() => (shake = false), 400);
                    return; // keep sheet open
                }
            } catch {
                stage = 'error';
                pending = false;
                errorText = 'Fel PIN';
                shake = true;
                setTimeout(() => (shake = false), 400);
                return;
            }
        }

        // 2) EITHER close (askForPin mode) or perform action (run mode)
        if (!run) {
            stage = 'success';
            pending = true;
            setTimeout(
                () => {
                    _fulfillPin(pin);
                    pin = '';
                    stage = 'idle';
                    pending = false;
                },
                (pinPrompt as any).successDelay ?? 600
            );
            return;
        }

        // run mode
        try {
            stage = 'performing';
            pending = true;
            await run(pin); // keep modal open while booking/cancel/extend happens
            stage = 'success'; // brief success cue
            setTimeout(() => {
                _finishRun(true);
                pin = '';
                stage = 'idle';
                pending = false;
            }, runSuccessDelay);
        } catch (e: any) {
            // Map common server errors to inline text
            const msg = String(e?.message ?? '');
            if (/401|Fel PIN|invalid pin/i.test(msg)) {
                stage = 'error';
                errorText = 'Fel PIN';
            } else if (/409|conflict|occupied/i.test(msg)) {
                stage = 'error';
                errorText = 'Rummet är upptaget.';
            } else {
                stage = 'error';
                errorText = 'Kunde inte genomföra åtgärden.';
            }
            pending = false;
            shake = true;
            setTimeout(() => (shake = false), 400);
        }
    }

    onDestroy(unsub);
</script>

<PopupWrapper bind:open on:close={handleClose} width="380px" z={100} header={title} icon="Password">
    <div class="p-4">
        {#if message}<p class="text-sm text-gray-600 mt-1">{message}</p>{/if}

        <!-- status line -->
        <div class="mt-2 h-5 text-sm w-full flex justify-center">
            {#if stage === 'validating'}
                <span class="inline-flex items-center gap-2 text-gray-600"
                    ><span class="spinner"></span> Kontrollerar…</span
                >
            {:else if stage === 'performing'}
                <span class="inline-flex items-center gap-2 text-gray-600"
                    ><span class="spinner"></span> {actionLabel}</span
                >
            {:else if stage === 'success'}
                <span class="inline-flex items-center gap-1 text-green-600">{successLabel}</span>
            {:else if stage === 'error' && errorText}
                <span class="inline-flex items-center gap-1 text-red-600">{errorText}</span>
            {/if}
        </div>

        <div class="mt-3 flex justify-center">
            <div class:shake>
                <PinPad
                    {min}
                    {max}
                    {confirmIcon}
                    bind:value={pin}
                    state={stage === 'success' ? 'success' : stage === 'error' ? 'error' : 'idle'}
                    {pending}
                    on:input={(e) => onInput(e.detail)}
                    on:confirm={onConfirm}
                    on:cancel={handleClose}
                />
            </div>
        </div>
    </div>
</PopupWrapper>

<style>
    .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-top-color: currentColor;
        border-radius: 50%;
        display: inline-block;
        animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes k-shake {
        10%,
        90% {
            transform: translateX(-1px);
        }
        20%,
        80% {
            transform: translateX(2px);
        }
        30%,
        50%,
        70% {
            transform: translateX(-4px);
        }
        40%,
        60% {
            transform: translateX(4px);
        }
    }
    .shake {
        animation: k-shake 420ms ease;
    }
</style>

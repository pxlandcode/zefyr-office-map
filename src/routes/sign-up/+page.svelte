<script lang="ts">
    import PinPad from '$lib/components/ui/pin-pad/PinPad.svelte';

    export let form: {
        success?: boolean;
        message?: string;
        errors?: Record<string, string>;
        values?: Record<string, string>;
    } = {};

    const min = 4;
    const max = 8;

    let pin = '';

    let formEl: HTMLFormElement | null = null;

    $: pinpadState = form?.success ? 'success' : form?.errors?.pin ? 'error' : 'idle';
</script>

<main class="relative min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
    <a
        href="/"
        class="absolute top-6 right-6 text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
        Tillbaka till kartan
    </a>

    <div class="w-full max-w-md bg-white p-6 border rounded-lg shadow-sm space-y-4">
        <h1 class="text-xl font-semibold">Skapa användare</h1>

        {#if form?.message}
            <div
                class="p-3 rounded {form?.success
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'}"
            >
                {form.message}
            </div>
        {/if}

        <form method="POST" bind:this={formEl} class="space-y-4">
            <div class="space-y-2">
                <label class="block text-sm font-medium">Namn</label>
                <input
                    class="w-full border rounded px-3 py-2"
                    name="full_name"
                    value={form?.values?.full_name ?? ''}
                    required
                />
                {#if form?.errors?.full_name}
                    <p class="text-sm text-red-600">{form.errors.full_name}</p>
                {/if}
            </div>

            <!-- E-post -->
            <div class="space-y-2">
                <label class="block text-sm font-medium">E-post</label>
                <input
                    class="w-full border rounded px-3 py-2"
                    type="email"
                    name="email"
                    value={form?.values?.email ?? ''}
                    required
                />
                {#if form?.errors?.email}
                    <p class="text-sm text-red-600">{form.errors.email}</p>
                {/if}
            </div>

            <!-- PIN via PinPad (no popup) -->
            <div class="space-y-2">
                <label class="block text-sm font-medium">PIN (4–8 siffror)</label>

                <!-- Hidden field that the server action reads -->
                <input type="hidden" name="pin" value={pin} />

                <!-- Inline PinPad -->
                <div class="mt-1 flex justify-center">
                    <PinPad
                        bind:value={pin}
                        {min}
                        {max}
                        pending={false}
                        state={pinpadState as 'idle' | 'error' | 'success'}
                        noConfirm={true}
                        on:confirm={() => {
                            if (pin.length >= min && formEl) formEl.requestSubmit();
                        }}
                    />
                </div>

                {#if form?.errors?.pin}
                    <p class="text-sm text-red-600">{form.errors.pin}</p>
                {/if}
            </div>

            <!-- Fallback submit button (keyboard/desktop) -->
            <button
                class="mt-2 w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
                disabled={pin.length < min}
            >
                Skapa användare
            </button>
        </form>
    </div>
</main>

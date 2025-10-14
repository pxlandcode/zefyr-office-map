<!-- src/routes/login/+page.svelte -->
<script lang="ts">
    export let form: any;
</script>

<div class="max-w-sm mx-auto mt-16 space-y-4">
    <h1 class="text-xl font-semibold">Logga in</h1>

    <form method="POST">
        <input
            class="w-full border p-2 rounded"
            type="email"
            name="email"
            placeholder="E-post"
            required
        />
        <input
            class="w-full border p-2 rounded mt-2"
            type="password"
            name="password"
            placeholder="Lösenord"
            required
        />
        <button class="px-3 py-2 rounded bg-black text-white mt-3">Logga in</button>
    </form>

    {#if form?.message}
        <p class="text-sm mt-2 {form?.status >= 400 ? 'text-red-600' : 'text-green-700'}">
            {form.message}
        </p>
    {/if}
</div>

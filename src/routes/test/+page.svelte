<script lang="ts">
    import { page } from '$app/stores';

    $: user = $page.data?.user; // set in hooks.server.ts via getUser()
    $: session = $page.data?.session; // optional
</script>

<div class="p-4 rounded-lg border max-w-lg">
    <h2 class="font-semibold mb-2">Auth status</h2>
    {#if user}
        <p class="text-green-700">✅ Signed in</p>
        <ul class="text-sm mt-2 space-y-1">
            <li><strong>User ID:</strong> {user.id}</li>
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>Confirmed:</strong> {String(user.email_confirmed_at != null)}</li>
        </ul>
    {:else}
        <p class="text-orange-700">⚠️ Not signed in</p>
    {/if}
</div>

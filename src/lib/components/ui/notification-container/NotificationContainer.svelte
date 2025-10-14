<script lang="ts">
    import { notifications, removeNotification } from '../../../../stores/notificationStore';

    import Notification from '../notification/Notification.svelte';
</script>

<div class="fixed top-4 right-4 flex flex-col-reverse gap-2 items-end z-[9999] space-y-2">
    {#each $notifications as { id, type, message, description } (id)}
        <Notification {id} {type} {message} {description} on:close={() => removeNotification(id)} />
    {/each}
</div>

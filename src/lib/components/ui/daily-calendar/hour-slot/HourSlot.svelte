<script lang="ts">
    export let hour: number;
    export let index: number;
    export let hourHeight: number;
</script>

<div class="relative pl-[10px] flex items-center" style="top: {index * hourHeight}px; height: 0px;">
    <div class="w-12 text-sm text-gray-500">
        {hour === 0 ? '00:00' : `${hour}:00`}
    </div>
    <div class="flex-1 border-t border-dashed border-gray-300"></div>
</div>

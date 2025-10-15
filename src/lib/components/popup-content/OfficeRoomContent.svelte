<script lang="ts">
    export let room: {
        name: string;
        image?: string;
        company?: string;
        headline?: string;
        tagline?: string;
        description?: string;
        extra?: string;
        logo?: string;
        website?: string;
        brandColor?: string;
    };
    const title = room.headline ?? room.tagline ?? room.name;
</script>

<div class="grid md:grid-cols-2 gap-5 h-[400px]">
    <div class="relative flex flex-col justify-between gap-2">
        <div class="space-y-6">
            <h1
                class="font-serif text-5xl leading-tight sm:text-5xl md:text-[56px] md:leading-[1.05] tracking-[-0.01em] text-slate-900"
            >
                {title}
                <span class="ml-[-0.8rem]" style="color: {room.brandColor || '#111827'}">.</span>
            </h1>

            {#if room.description}
                <p class="text-base font-light">
                    {room.description}
                </p>
            {/if}

            {#if room.extra}
                <p class="text-base font-light">
                    {room.extra}
                </p>
            {/if}
        </div>

        <div class="flex items-end justify-end gap-4">
            {#if room.logo}
                <img src={room.logo} alt="Logotyp" class="h-5 w-auto" loading="lazy" />
            {/if}
        </div>
    </div>

    <div
        class="relative border-4 overflow-hidden"
        style="border-color: {room.brandColor || '#e5e7eb'}"
    >
        {#if room.image}
            <img
                src={room.image}
                alt={`Bild för ${room.company ?? room.name}`}
                class="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
            />
        {:else}
            <div class="absolute inset-0 grid place-items-center bg-slate-100 text-slate-400">
                Ingen bild
            </div>
        {/if}
    </div>
</div>

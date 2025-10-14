<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  export let showWeek = true;
  export let timeZone: string | null = 'Europe/Stockholm';

  let now = new Date();
  let t: ReturnType<typeof setInterval> | undefined;

  function week(d: Date) {
    const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (dt.getUTCDay() + 6) % 7;
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
    const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const diff = (dt.getTime() - firstThu.getTime()) / 86400000;
    return 1 + Math.floor(diff / 7);
  }

  const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone || undefined,
    }).format(d);

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('sv-SE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timeZone || undefined,
    }).format(d);

  onMount(() => {
    t = setInterval(() => (now = new Date()), 1000);
  });

  onDestroy(() => {
    if (t) clearInterval(t);
  });
</script>

<div class="rounded-xl px-4 py-3 bg-white/80 dark:bg-zinc-900/70 backdrop-blur shadow border border-black/5 select-none">
  <div class="text-4xl font-semibold leading-none">{fmtTime(now)}</div>
  <div class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
    {fmtDate(now)}{showWeek ? ` • v.${week(now)}` : ''}
  </div>
</div>

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

<div class="clock-widget select-none">
  <p class="clock-date">
    {fmtDate(now)}{showWeek ? ` · v.${week(now)}` : ''}
  </p>
  <p class="clock-time">{fmtTime(now)}</p>
</div>

<style>
  .clock-widget {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    color: #1f2937;
    gap: 0.25rem;
  }

  .clock-date {
    font-size: 1.05rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-transform: capitalize;
  }

  .clock-time {
    font-size: clamp(3.25rem, 5vw, 5.5rem);
    font-weight: 600;
    line-height: 0.9;
  }

  :global(.dark) .clock-widget {
    color: #f4f4f5;
  }
</style>

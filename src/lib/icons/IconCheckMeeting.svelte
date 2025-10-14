<script>
    export let size = '40px';
    export let color = 'black';
    export let extraClasses = '';
    export let extraStyle = '';

    $: classString = `text-${color} ${extraClasses}`;
    $: styleString = `${extraStyle}`;
</script>

<svg
    width={size}
    height={size}
    class={classString}
    style={styleString}
    fill="currentColor"
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
>
    <g clip-path="url(#clip0_233_321)">
        <path
            d="M17.9 33.1395L10.8 26.0395L13.7 23.1395L17.9 27.3395L26.3 18.9395L29.2 21.8395L17.9 33.1395ZM6 40.4395C4.9 40.4395 3.95833 40.0478 3.175 39.2645C2.39167 38.4811 2 37.5395 2 36.4395V8.43945C2 7.33945 2.39167 6.39779 3.175 5.61445C3.95833 4.83112 4.9 4.43945 6 4.43945H8V0.439453H12V4.43945H28V0.439453H32V4.43945H34C35.1 4.43945 36.0417 4.83112 36.825 5.61445C37.6083 6.39779 38 7.33945 38 8.43945V36.4395C38 37.5395 37.6083 38.4811 36.825 39.2645C36.0417 40.0478 35.1 40.4395 34 40.4395H6ZM6 36.4395H34V16.4395H6V36.4395ZM6 12.4395H34V8.43945H6V12.4395Z"
            fill="currentColor"
        />
    </g>
    <defs>
        <clipPath id="clip0_233_321">
            <rect width="40" height="40" transform="translate(0 0.439453)" />
        </clipPath>
    </defs>
</svg>

<style>
    @import './_icons.scss';
</style>

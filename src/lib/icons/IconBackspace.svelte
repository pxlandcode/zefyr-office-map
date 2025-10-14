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
    viewBox="0 0 41 40"
    xmlns="http://www.w3.org/2000/svg"
>
    <g clip-path="url(#clip0_233_323)">
        <path
            d="M19.2902 28.4395L24.4902 23.2395L29.6902 28.4395L32.4902 25.6395L27.2902 20.4395L32.4902 15.2395L29.6902 12.4395L24.4902 17.6395L19.2902 12.4395L16.4902 15.2395L21.6902 20.4395L16.4902 25.6395L19.2902 28.4395ZM14.4902 36.4395C13.8569 36.4395 13.2569 36.2978 12.6902 36.0145C12.1236 35.7311 11.6569 35.3395 11.2902 34.8395L0.490234 20.4395L11.2902 6.03945C11.6569 5.53945 12.1236 5.14779 12.6902 4.86445C13.2569 4.58112 13.8569 4.43945 14.4902 4.43945H36.4902C37.5902 4.43945 38.5319 4.83112 39.3152 5.61445C40.0986 6.39779 40.4902 7.33945 40.4902 8.43945V32.4395C40.4902 33.5395 40.0986 34.4811 39.3152 35.2645C38.5319 36.0478 37.5902 36.4395 36.4902 36.4395H14.4902ZM5.49023 20.4395L14.4902 32.4395H36.4902V8.43945H14.4902L5.49023 20.4395Z"
            fill="currentColor"
        />
    </g>
    <defs>
        <clipPath id="clip0_233_323">
            <rect width="41" height="40" transform="translate(0.490234 0.439453)" />
        </clipPath>
    </defs>
</svg>

<style>
    @import './_icons.scss';
</style>

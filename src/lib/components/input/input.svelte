<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Component } from 'svelte';

	type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	type Props = {
		icon?: Component<{ class?: string }>;
		value?: HTMLInputAttributes['value'];
		size?: InputSize;
		class?: string;
		type?: Extract<
			HTMLInputAttributes['type'],
			'email' | 'hidden' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url'
		>;
		node?: HTMLInputElement;
	};

	let {
		icon,
		value = $bindable(),
		type = 'text',
		size = 'md',
		class: className = '',
		node = $bindable(),
		...rest
	}: Props & Omit<HTMLInputAttributes, 'size'> = $props();

	const sizeClasses: Record<InputSize, string> = {
		xs: 'h-8 px-2 text-xs',
		sm: 'h-9 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-4 text-base',
		xl: 'h-14 px-4 text-lg'
	};

	const iconSizeClasses: Record<InputSize, string> = {
		xs: 'size-3',
		sm: 'size-4',
		md: 'size-4',
		lg: 'size-5',
		xl: 'size-6'
	};

	const iconPaddingClasses: Record<InputSize, string> = {
		xs: 'pl-7',
		sm: 'pl-9',
		md: 'pl-10',
		lg: 'pl-11',
		xl: 'pl-12'
	};
</script>

<div class="relative">
	{#if icon}
		{@const Icon = icon}
		<Icon
			class={`absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none text-gray ${iconSizeClasses[size]}`}
		/>
	{/if}

	<input
		bind:this={node}
		{type}
		class={`
			w-full rounded-md border border-gray bg-white text-text
			placeholder:text-gray
			focus:outline-none focus:ring-2 focus:ring-green-bright focus:border-green-bright
			disabled:bg-gray-bright disabled:text-gray disabled:cursor-not-allowed
			transition-colors duration-200
			${sizeClasses[size]}
			${icon ? iconPaddingClasses[size] : ''}
			${rest.maxlength ? 'pr-16' : ''}
			${className}
		`}
		bind:value
		{...rest}
	/>

	{#if rest.maxlength}
		<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray">
			{String(value ?? '').length}/{rest.maxlength}
		</span>
	{/if}
</div>

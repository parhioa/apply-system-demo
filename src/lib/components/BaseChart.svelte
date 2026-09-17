<script lang="ts">
	import type { EChartsCoreOption } from 'echarts/core';

	interface ChartLike {
		setOption: (option: EChartsCoreOption) => void;
		resize: () => void;
		dispose: () => void;
	}

	let { option, height = '320px' }: { option: EChartsCoreOption; height?: string } = $props();

	let container: HTMLDivElement | undefined = $state();
	let chart: ChartLike | undefined = $state();

	$effect(() => {
		const el = container;
		if (!el) return;

		let disposed = false;
		let ro: ResizeObserver | undefined;

		(async () => {
			const core = await import('echarts/core');
			const charts = await import('echarts/charts');
			const components = await import('echarts/components');
			const renderers = await import('echarts/renderers');

			core.use([
				charts.BarChart,
				charts.LineChart,
				charts.PieChart,
				components.GridComponent,
				components.TooltipComponent,
				components.LegendComponent,
				components.TitleComponent,
				renderers.CanvasRenderer
			]);

			if (disposed) return;
			const inst = core.init(el);
			chart = inst;
			chart.setOption(option);
			ro = new ResizeObserver(() => inst.resize());
			ro.observe(el);
		})();

		return () => {
			disposed = true;
			ro?.disconnect();
			if (chart) {
				chart.dispose();
				chart = undefined;
			}
		};
	});

	$effect(() => {
		chart?.setOption(option);
	});
</script>

<div bind:this={container} class="w-full" style="height: {height}"></div>

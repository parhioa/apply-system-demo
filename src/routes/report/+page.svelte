<script lang="ts">
	import { onMount } from 'svelte';
	import type { EChartsCoreOption } from 'echarts/core';
	import BaseChart from '$lib/components/BaseChart.svelte';
	import { APPLICATION_TYPES, STATUS_META } from '$lib/config/schemas';
	import { aggregateStatistics } from '$lib/services/applicationApi';
	import { applications, loadApplications } from '$lib/stores/applications';

	let stats = $derived(aggregateStatistics($applications));

	const statusPieOption: EChartsCoreOption = $derived({
		tooltip: { trigger: 'item' },
		legend: {
			bottom: 0,
			icon: 'circle',
			itemWidth: 8,
			itemHeight: 8,
			textStyle: { color: '#737373', fontSize: 12 }
		},
		series: [
			{
				name: '申请状态',
				type: 'pie',
				radius: ['46%', '70%'],
				center: ['50%', '44%'],
				itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
				label: { show: false },
				emphasis: { label: { show: true, fontWeight: 600, formatter: '{b}: {c}' } },
				data: Object.entries(stats.statusCount).map(([status, count]) => ({
					name: STATUS_META[status as keyof typeof STATUS_META].label,
					value: count,
					itemStyle: {
						color: {
							draft: '#a3a3a3',
							pending: '#f59e0b',
							approved: '#22c55e',
							rejected: '#ef4444',
							withdrawn: '#d4d4d4'
						}[status]
					}
				}))
			}
		]
	});

	const typeBarOption: EChartsCoreOption = $derived({
		tooltip: { trigger: 'axis' },
		grid: { left: 36, right: 16, top: 16, bottom: 28 },
		xAxis: {
			type: 'category',
			data: APPLICATION_TYPES.map((t) => t.label),
			axisLine: { lineStyle: { color: '#e5e5e5' } },
			axisTick: { show: false },
			axisLabel: { color: '#737373', fontSize: 12 }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			splitLine: { lineStyle: { color: '#f0f0f0' } },
			axisLabel: { color: '#a3a3a3', fontSize: 11 }
		},
		series: [
			{
				type: 'bar',
				barWidth: 28,
				data: APPLICATION_TYPES.map((t) => stats.typeCount[t.key]),
				itemStyle: { borderRadius: [8, 8, 0, 0], color: '#0071e3' }
			}
		]
	});

	const departmentBarOption: EChartsCoreOption = $derived({
		tooltip: { trigger: 'axis' },
		grid: { left: 36, right: 16, top: 16, bottom: 28 },
		xAxis: {
			type: 'category',
			data: Object.keys(stats.departmentCount),
			axisLine: { lineStyle: { color: '#e5e5e5' } },
			axisTick: { show: false },
			axisLabel: { color: '#737373', fontSize: 12 }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			splitLine: { lineStyle: { color: '#f0f0f0' } },
			axisLabel: { color: '#a3a3a3', fontSize: 11 }
		},
		series: [
			{
				type: 'bar',
				barWidth: 28,
				data: Object.values(stats.departmentCount),
				itemStyle: { borderRadius: [8, 8, 0, 0], color: '#34c759' }
			}
		]
	});

	const monthlyLineOption: EChartsCoreOption = $derived({
		tooltip: { trigger: 'axis' },
		grid: { left: 36, right: 16, top: 16, bottom: 28 },
		xAxis: {
			type: 'category',
			data: stats.monthly.map(([m]) => `${m.slice(0, 4)}-${m.slice(5)}`),
			boundaryGap: false,
			axisLine: { lineStyle: { color: '#e5e5e5' } },
			axisTick: { show: false },
			axisLabel: { color: '#737373', fontSize: 12 }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			splitLine: { lineStyle: { color: '#f0f0f0' } },
			axisLabel: { color: '#a3a3a3', fontSize: 11 }
		},
		series: [
			{
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 7,
				lineStyle: { width: 3, color: '#5856d6' },
				itemStyle: { color: '#5856d6' },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(88,86,214,0.22)' },
							{ offset: 1, color: 'rgba(88,86,214,0.02)' }
						]
					}
				},
				data: stats.monthly.map(([, count]) => count)
			}
		]
	});

	onMount(() => {
		loadApplications();
	});
</script>

<div class="mb-6">
	<h1 class="text-2xl font-semibold tracking-tight text-neutral-900">统计报表</h1>
	<p class="mt-1 text-[13px] text-neutral-500">审批数据总览与趋势分析</p>
</div>

<div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
	<div class="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-card">
		<p class="text-xs text-neutral-400">申请总数</p>
		<p class="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
			{stats.total}
		</p>
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-card">
		<p class="flex items-center gap-1.5 text-xs text-neutral-400">
			<span class="h-1.5 w-1.5 rounded-full bg-orange-500"></span>待审批
		</p>
		<p class="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
			{stats.statusCount.pending}
		</p>
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-card">
		<p class="flex items-center gap-1.5 text-xs text-neutral-400">
			<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>已通过
		</p>
		<p class="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
			{stats.statusCount.approved}
		</p>
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-card">
		<p class="flex items-center gap-1.5 text-xs text-neutral-400">
			<span class="h-1.5 w-1.5 rounded-full bg-apple"></span>审批通过率
		</p>
		<p class="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
			{stats.approvalRate}<span class="text-base text-neutral-400">%</span>
		</p>
	</div>
</div>

<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
	<div class="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-card">
		<h3 class="px-2 pt-1 text-sm font-medium text-neutral-800">状态分布</h3>
		<BaseChart option={statusPieOption} height="300px" />
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-card">
		<h3 class="px-2 pt-1 text-sm font-medium text-neutral-800">各类型申请量</h3>
		<BaseChart option={typeBarOption} height="300px" />
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-card">
		<h3 class="px-2 pt-1 text-sm font-medium text-neutral-800">各部门申请量</h3>
		<BaseChart option={departmentBarOption} height="300px" />
	</div>
	<div class="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-card">
		<h3 class="px-2 pt-1 text-sm font-medium text-neutral-800">申请量趋势</h3>
		<BaseChart option={monthlyLineOption} height="300px" />
	</div>
</div>

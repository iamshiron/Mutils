import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { kakeraApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TrendUp, ChartBar, ChartPie, Calendar } from "@phosphor-icons/react";
import type { KakeraType } from "@/types";

export const Route = createFileRoute("/statistics")({
	component: StatisticsPage,
});

const KAKERA_COLORS: Record<KakeraType, string> = {
	purple: "#a855f7",
	blue: "#3b82f6",
	green: "#22c55e",
	yellow: "#eab308",
	orange: "#f97316",
	red: "#ef4444",
	rainbow: "#ec4899", // Using pink for rainbow
	light: "#f8fafc",
	chaos: "#6366f1",
	dark: "#1e293b",
};

function StatisticsPage() {
	const { isAuthenticated } = useAuth();

	const { data: claims, isLoading: claimsLoading } = useQuery({
		queryKey: ["kakera-claims"],
		queryFn: () => kakeraApi.getClaims(),
		enabled: isAuthenticated,
	});

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["kakera-stats"],
		queryFn: () => kakeraApi.getStats(),
		enabled: isAuthenticated,
	});

	if (claimsLoading || statsLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="animate-spin w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full" />
			</div>
		);
	}

	if (!claims || !stats) {
		return (
			<div className="text-center py-12">
				<p className="text-foreground-muted">No kakera data found.</p>
			</div>
		);
	}

	// Process data for charts
	const last30Days = Array.from({ length: 30 }, (_, i) => {
		const date = subDays(new Date(), i);
		return format(date, "yyyy-MM-dd");
	}).reverse();

	const dailyData = last30Days.map((date) => {
		const dayClaims = claims.filter(
			(c) => format(parseISO(c.claimedAt), "yyyy-MM-dd") === date,
		);
		return {
			date: format(parseISO(date), "MMM dd"),
			value: dayClaims.reduce((sum, c) => sum + c.value, 0),
			count: dayClaims.length,
		};
	});

	const getKakeraColor = (type: string | number) => {
		const typeStr = String(type).toLowerCase();
		return KAKERA_COLORS[typeStr as KakeraType] || "#ffffff";
	};

	const pieData = Object.entries(stats.byType).map(([type, data]) => ({
		name: String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase(),
		value: data.totalValue,
		type: String(type).toLowerCase() as KakeraType,
	}));

	const cumulativeData = dailyData.reduce((acc: any[], day, i) => {
		const prevValue = i > 0 ? acc[i - 1].cumulativeValue : 0;
		acc.push({
			...day,
			cumulativeValue: prevValue + day.value,
		});
		return acc;
	}, []);

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Kakera Statistics</h1>
					<p className="text-foreground-muted text-sm mt-1">
						Insights and trends for your kakera claims
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<TrendUp size={20} className="text-sakura-500" />
						<span className="text-foreground-muted text-sm">Total Kakera</span>
					</div>
					<p className="text-3xl font-bold text-sakura-500">
						{stats.totalValue.toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<ChartBar size={20} className="text-blue-400" />
						<span className="text-foreground-muted text-sm">Total Claims</span>
					</div>
					<p className="text-3xl font-bold text-blue-400">{stats.totalCount}</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<Calendar size={20} className="text-green-400" />
						<span className="text-foreground-muted text-sm">Avg. Daily</span>
					</div>
					<p className="text-3xl font-bold text-green-400">
						{Math.round(stats.totalValue / (claims.length || 1)).toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<TrendUp size={20} className="text-sakura-300" />
						<span className="text-foreground-muted text-sm">Best Claim</span>
					</div>
					<p className="text-3xl font-bold text-sakura-300">
						{Math.max(...claims.map((c) => c.value), 0).toLocaleString()}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="glass rounded-xl p-6">
					<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
						<ChartBar size={20} /> Daily Kakera Gain (Last 30 Days)
					</h2>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={dailyData}>
								<defs>
									<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f2b5d4" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#f2b5d4" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(255,255,255,0.05)"
								/>
								<XAxis
									dataKey="date"
									stroke="rgba(255,255,255,0.5)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.5)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `${value}`}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(26, 26, 46, 0.9)",
										border: "1px solid rgba(242, 181, 212, 0.2)",
										borderRadius: "8px",
									}}
								/>
								<Area
									type="monotone"
									dataKey="value"
									stroke="#f2b5d4"
									fillOpacity={1}
									fill="url(#colorValue)"
									name="Kakera"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="glass rounded-xl p-6">
					<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
						<ChartPie size={20} /> Value Distribution by Type
					</h2>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={100}
									paddingAngle={5}
									dataKey="value"
								>
									{pieData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={getKakeraColor(entry.type)}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(26, 26, 46, 0.9)",
										border: "1px solid rgba(242, 181, 212, 0.2)",
										borderRadius: "8px",
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
						{pieData.map((entry) => (
							<div key={entry.name} className="flex items-center gap-2 text-xs">
								<div
									className="w-3 h-3 rounded-full"
									style={{
										backgroundColor: getKakeraColor(entry.type),
									}}
								/>
								<span className="text-foreground-muted truncate">
									{entry.name}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="glass rounded-xl p-6 lg:col-span-2">
					<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
						<TrendUp size={20} /> Cumulative Growth
					</h2>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={cumulativeData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(255,255,255,0.05)"
								/>
								<XAxis
									dataKey="date"
									stroke="rgba(255,255,255,0.5)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.5)"
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(26, 26, 46, 0.9)",
										border: "1px solid rgba(242, 181, 212, 0.2)",
										borderRadius: "8px",
									}}
								/>
								<Line
									type="monotone"
									dataKey="cumulativeValue"
									stroke="#f2b5d4"
									strokeWidth={3}
									dot={false}
									name="Total Kakera"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			<div className="glass rounded-xl overflow-hidden">
				<div className="p-6 border-b border-border">
					<h2 className="text-lg font-semibold">Recent Claims</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-background-tertiary/50">
								<th className="px-6 py-3 text-sm font-semibold">Character</th>
								<th className="px-6 py-3 text-sm font-semibold">Type</th>
								<th className="px-6 py-3 text-sm font-semibold text-right">
									Value
								</th>
								<th className="px-6 py-3 text-sm font-semibold">Date</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{claims.slice(0, 10).map((claim) => (
								<tr key={claim.id} className="hover:bg-white/5 transition-colors">
									<td className="px-6 py-4">
										{claim.characterName || (
											<span className="text-foreground-subtle italic">
												Unknown
											</span>
										)}
									</td>
									<td className="px-6 py-4">
										<span
											className="px-2 py-0.5 rounded text-xs font-medium capitalize"
											style={{
												backgroundColor: `${getKakeraColor(claim.type)}20`,
												color: getKakeraColor(claim.type),
											}}
										>
											{String(claim.type).toLowerCase()}
										</span>
									</td>
									<td className="px-6 py-4 text-right font-mono text-sakura-400">
										{claim.value.toLocaleString()}
									</td>
									<td className="px-6 py-4 text-sm text-foreground-muted">
										{format(parseISO(claim.claimedAt), "MMM dd, HH:mm")}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

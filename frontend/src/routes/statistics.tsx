import {
	Calendar,
	ChartBar,
	ChartPie,
	Clock,
	Download,
	ListNumbers,
	PencilSimple,
	Plus,
	Target,
	Trash,
	TrendUp,
	Upload,
	Warning,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, isAfter, parseISO, startOfDay, subDays } from "date-fns";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { KakeraClaimModal } from "@/components/kakera/KakeraClaimModal";
import { useAuth } from "@/hooks/useAuth";
import { kakeraApi } from "@/lib/api";
import { KAKERA_COLORS } from "@/lib/constants";
import type {
	CreateKakeraClaimRequest,
	KakeraClaim,
	KakeraClaimExportItem,
	KakeraType,
	UpdateKakeraClaimRequest,
} from "@/types";

export const Route = createFileRoute("/statistics")({
	component: StatisticsPage,
});

function StatisticsPage() {
	const { isAuthenticated } = useAuth();
	const [pieChartMode, setPieChartMode] = useState<"value" | "count">("value");
	const [showAddModal, setShowAddModal] = useState(false);
	const [editClaim, setEditClaim] = useState<KakeraClaim | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [showImportConfirm, setShowImportConfirm] = useState(false);
	const [showWipeConfirm, setShowWipeConfirm] = useState(false);
	const [pendingImportData, setPendingImportData] = useState<
		KakeraClaimExportItem[] | null
	>(null);
	const queryClient = useQueryClient();

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

	const createClaimMutation = useMutation({
		mutationFn: (request: CreateKakeraClaimRequest) =>
			kakeraApi.createClaim(request),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
		},
	});

	const updateClaimMutation = useMutation({
		mutationFn: ({
			id,
			request,
		}: {
			id: string;
			request: UpdateKakeraClaimRequest;
		}) => kakeraApi.updateClaim(id, request),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
			setEditClaim(null);
		},
	});

	const deleteClaimMutation = useMutation({
		mutationFn: (id: string) => kakeraApi.deleteClaim(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
			setDeleteConfirmId(null);
		},
	});

	const importClaimsMutation = useMutation({
		mutationFn: (claims: KakeraClaimExportItem[]) =>
			kakeraApi.importClaims(claims),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
			setShowImportConfirm(false);
			setPendingImportData(null);
		},
	});

	const handleExport = async () => {
		const data = await kakeraApi.exportClaims();
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `kakera-claims-${format(new Date(), "yyyy-MM-dd")}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target?.result as string);
				setPendingImportData(data);
				setShowImportConfirm(true);
			} catch {
				alert("Invalid JSON file");
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	};

	const wipeClaimsMutation = useMutation({
		mutationFn: () => kakeraApi.wipeClaims(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
			setShowWipeConfirm(false);
		},
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
	const now = new Date();
	const last30Days = Array.from({ length: 30 }, (_, i) => {
		const date = subDays(now, i);
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

	const sevenDaysAgo = startOfDay(subDays(now, 7));
	const last7DaysClaims = claims.filter((c) =>
		isAfter(parseISO(c.claimedAt), sevenDaysAgo),
	);
	const last7DaysTotal = last7DaysClaims.reduce((sum, c) => sum + c.value, 0);

	const avgPerClaim =
		stats.totalCount > 0 ? stats.totalValue / stats.totalCount : 0;
	const dailyAvg = dailyData.reduce((sum, d) => sum + d.value, 0) / 30;

	const getKakeraColor = (type: string | number) => {
		const typeStr = String(type).toLowerCase();
		return KAKERA_COLORS[typeStr as KakeraType] || "#ffffff";
	};

	const pieData = Object.entries(stats.byType).map(([type, data]) => ({
		name:
			String(type).charAt(0).toUpperCase() +
			String(type).slice(1).toLowerCase(),
		value: data.totalValue,
		count: data.count,
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

	// Day of week activity
	const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const dowData = dowNames.map((name, i) => {
		const dayClaims = claims.filter(
			(c) => parseISO(c.claimedAt).getDay() === i,
		);
		return {
			name,
			count: dayClaims.length,
			value: dayClaims.reduce((sum, c) => sum + c.value, 0),
		};
	});

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Kakera Statistics</h1>
					<p className="text-foreground-muted text-sm mt-1">
						Insights and trends for your kakera claims
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors"
					>
						<Download size={18} />
						Export
					</button>
					<label className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors cursor-pointer">
						<Upload size={18} />
						Import
						<input
							type="file"
							accept=".json"
							onChange={handleImportFile}
							className="hidden"
						/>
					</label>
					<button
						type="button"
						onClick={() => setShowWipeConfirm(true)}
						className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-torii-400 font-semibold rounded-lg hover:bg-torii-500/20 transition-colors"
					>
						<Trash size={18} />
						Wipe
					</button>
					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors"
					>
						<Plus size={18} />
						Log Claim
					</button>
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
					<p className="text-3xl font-bold text-blue-400">
						{stats.totalCount.toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<ListNumbers size={20} className="text-green-400" />
						<span className="text-foreground-muted text-sm">
							Avg. per Claim
						</span>
					</div>
					<p className="text-3xl font-bold text-green-400">
						{Math.round(avgPerClaim).toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<Target size={20} className="text-sakura-300" />
						<span className="text-foreground-muted text-sm">Best Claim</span>
					</div>
					<p className="text-3xl font-bold text-sakura-300">
						{Math.max(...claims.map((c) => c.value), 0).toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<Calendar size={20} className="text-indigo-400" />
						<span className="text-foreground-muted text-sm">Last 7 Days</span>
					</div>
					<p className="text-3xl font-bold text-indigo-400">
						{last7DaysTotal.toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<TrendUp size={20} className="text-emerald-400" />
						<span className="text-foreground-muted text-sm">Daily Average</span>
					</div>
					<p className="text-3xl font-bold text-emerald-400">
						{Math.round(dailyAvg).toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<ChartBar size={20} className="text-amber-400" />
						<span className="text-foreground-muted text-sm">Monthly Est.</span>
					</div>
					<p className="text-3xl font-bold text-amber-400">
						{Math.round(dailyAvg * 30).toLocaleString()}
					</p>
				</div>
				<div className="glass rounded-xl p-6 lantern-top">
					<div className="flex items-center gap-3 mb-2">
						<Clock size={20} className="text-rose-400" />
						<span className="text-foreground-muted text-sm">Success Rate</span>
					</div>
					<p className="text-3xl font-bold text-rose-400">
						{claims.length > 0
							? `${Math.round((claims.filter((c) => c.isClaimed).length / claims.length) * 100)}%`
							: "0%"}
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
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<ChartPie size={20} /> Distribution by Type
						</h2>
						<div className="flex gap-1 bg-background-tertiary rounded-lg p-1">
							<button
								type="button"
								onClick={() => setPieChartMode("value")}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
									pieChartMode === "value"
										? "bg-sakura-500 text-white"
										: "text-foreground-muted hover:text-foreground"
								}`}
							>
								By Value
							</button>
							<button
								type="button"
								onClick={() => setPieChartMode("count")}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
									pieChartMode === "count"
										? "bg-sakura-500 text-white"
										: "text-foreground-muted hover:text-foreground"
								}`}
							>
								By Count
							</button>
						</div>
					</div>
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
									dataKey={pieChartMode === "value" ? "value" : "count"}
								>
									{pieData.map((entry) => (
										<Cell key={entry.type} fill={getKakeraColor(entry.type)} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(26, 26, 46, 0.9)",
										border: "1px solid rgba(242, 181, 212, 0.2)",
										borderRadius: "8px",
									}}
									formatter={(value, _name, props) => [
										pieChartMode === "value"
											? Number(value).toLocaleString()
											: value,
										props.payload.name,
									]}
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

				<div className="glass rounded-xl p-6">
					<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
						<ChartBar size={20} /> Claims per Day (Last 30 Days)
					</h2>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dailyData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(255,255,255,0.05)"
								/>
								<XAxis
									dataKey="date"
									stroke="rgba(255,255,255,0.5)"
									fontSize={10}
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
								<Bar
									dataKey="count"
									fill="#f2b5d4"
									radius={[4, 4, 0, 0]}
									name="Claims"
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="glass rounded-xl p-6">
					<h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
						<Calendar size={20} /> Claims by Day of Week
					</h2>
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dowData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(255,255,255,0.05)"
								/>
								<XAxis
									dataKey="name"
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
								<Bar
									dataKey="count"
									fill="#3b82f6"
									radius={[4, 4, 0, 0]}
									name="Claims"
								/>
							</BarChart>
						</ResponsiveContainer>
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
								<th className="px-6 py-3 text-sm font-semibold text-center">
									Status
								</th>
								<th className="px-6 py-3 text-sm font-semibold">Date</th>
								<th className="px-6 py-3 text-sm font-semibold w-24"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{claims.slice(0, 20).map((claim) => (
								<tr
									key={claim.id}
									className="hover:bg-white/5 transition-colors"
								>
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
									<td className="px-6 py-4 text-center">
										{claim.isClaimed ? (
											<span className="text-green-400 text-xs">Claimed</span>
										) : (
											<span className="text-foreground-muted text-xs">
												Not Claimed
											</span>
										)}
									</td>
									<td className="px-6 py-4 text-sm text-foreground-muted">
										{format(parseISO(claim.claimedAt), "MMM dd, HH:mm")}
									</td>
									<td className="px-6 py-4">
										{deleteConfirmId === claim.id ? (
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => deleteClaimMutation.mutate(claim.id)}
													className="text-torii-400 hover:text-torii-300 text-xs"
												>
													Confirm
												</button>
												<button
													type="button"
													onClick={() => setDeleteConfirmId(null)}
													className="text-foreground-muted hover:text-foreground text-xs"
												>
													Cancel
												</button>
											</div>
										) : (
											<div className="flex items-center gap-1">
												<button
													type="button"
													onClick={() => setEditClaim(claim)}
													className="p-1.5 text-foreground-muted hover:text-sakura-400 hover:bg-sakura-500/10 rounded transition-colors"
												>
													<PencilSimple size={16} />
												</button>
												<button
													type="button"
													onClick={() => setDeleteConfirmId(claim.id)}
													className="p-1.5 text-foreground-muted hover:text-torii-400 hover:bg-torii-500/10 rounded transition-colors"
												>
													<Trash size={16} />
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<KakeraClaimModal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
				onSubmit={async (request) => {
					await createClaimMutation.mutateAsync(request);
				}}
			/>

			<KakeraClaimModal
				isOpen={!!editClaim}
				onClose={() => setEditClaim(null)}
				editClaim={editClaim}
				onUpdate={async (id, request) => {
					await updateClaimMutation.mutateAsync({ id, request });
				}}
			/>

			{showImportConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="glass rounded-xl w-full max-w-md mx-4 p-6 lantern-top">
						<div className="flex items-center gap-3 mb-4">
							<Warning size={24} className="text-warning" weight="bold" />
							<h2 className="text-xl font-semibold">Import Claims</h2>
						</div>
						<p className="text-foreground-muted mb-6">
							This will <strong className="text-torii-400">overwrite</strong>{" "}
							all your current kakera claims with the{" "}
							{pendingImportData?.length || 0} claims from the file. This action
							cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => {
									setShowImportConfirm(false);
									setPendingImportData(null);
								}}
								className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									if (pendingImportData) {
										importClaimsMutation.mutate(pendingImportData);
									}
								}}
								disabled={importClaimsMutation.isPending}
								className="px-4 py-2 bg-warning text-background font-semibold rounded-lg hover:bg-warning/80 transition-colors disabled:opacity-50"
							>
								{importClaimsMutation.isPending ? "Importing..." : "Import"}
							</button>
						</div>
					</div>
				</div>
			)}

			{showWipeConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="glass rounded-xl w-full max-w-md mx-4 p-6 lantern-top">
						<div className="flex items-center gap-3 mb-4">
							<Warning size={24} className="text-torii-400" weight="bold" />
							<h2 className="text-xl font-semibold">Wipe All Claims</h2>
						</div>
						<p className="text-foreground-muted mb-6">
							This will permanently delete all {claims?.length || 0} of your
							kakera claims. This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => setShowWipeConfirm(false)}
								className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => wipeClaimsMutation.mutate()}
								disabled={wipeClaimsMutation.isPending}
								className="px-4 py-2 bg-torii-500 text-white font-semibold rounded-lg hover:bg-torii-300 transition-colors disabled:opacity-50"
							>
								{wipeClaimsMutation.isPending ? "Deleting..." : "Wipe All"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

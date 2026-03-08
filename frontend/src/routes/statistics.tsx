import {
	Calendar,
	CaretDown,
	CaretUp,
	ChartBar,
	ChartPie,
	Clock,
	Download,
	FileText,
	Gauge,
	ListNumbers,
	PencilSimple,
	Plus,
	Target,
	Trash,
	TrendDown,
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
	BulkKakeraImportResponse,
	CreateKakeraClaimRequest,
	KakeraClaim,
	KakeraClaimExportItem,
	KakeraType,
	UpdateKakeraClaimRequest,
} from "@/types";

export const Route = createFileRoute("/statistics")({
	component: StatisticsPage,
});

type TimeRange = "week" | "month" | "3months" | "year" | "all";

type SortField = "characterName" | "type" | "value" | "claimedAt";
type SortDirection = "asc" | "desc";

const TIME_RANGE_CONFIG: Record<
	TimeRange,
	{ label: string; days: number | null }
> = {
	week: { label: "Last Week", days: 7 },
	month: { label: "Last Month", days: 30 },
	"3months": { label: "Last 3 Months", days: 90 },
	year: { label: "Last Year", days: 365 },
	all: { label: "All Time", days: null },
};

function StatisticsPage() {
	const { isAuthenticated } = useAuth();
	const [timeRange, setTimeRange] = useState<TimeRange>("month");
	const [pieChartMode, setPieChartMode] = useState<"value" | "count">("value");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [sortBy, setSortBy] = useState<SortField>("claimedAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [showAddModal, setShowAddModal] = useState(false);
	const [editClaim, setEditClaim] = useState<KakeraClaim | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [showImportConfirm, setShowImportConfirm] = useState(false);
	const [showWipeConfirm, setShowWipeConfirm] = useState(false);
	const [showBulkImportModal, setShowBulkImportModal] = useState(false);
	const [bulkImportData, setBulkImportData] = useState("");
	const [bulkImportCharacterName, setBulkImportCharacterName] = useState("");
	const [pendingImportData, setPendingImportData] = useState<
		KakeraClaimExportItem[] | null
	>(null);
	const [showAdvancedStats, setShowAdvancedStats] = useState(false);
	const [thresholdTarget, setThresholdTarget] = useState<string>("0");
	const [linearResult, setLinearResult] = useState<{
		slope: number;
		intercept: number;
		rSquared: number;
		currentBaseline: number;
		lastDayInData: number;
		predictions: { day: number; dailyIncome: number; cumulative: number }[];
	} | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);
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

	const bulkImportMutation = useMutation({
		mutationFn: async () => {
			console.log("Sending bulk import:", {
				data: bulkImportData,
				characterName: bulkImportCharacterName,
			});
			const result = await kakeraApi.bulkImport({
				data: bulkImportData,
				characterName: bulkImportCharacterName || undefined,
			});
			console.log("Bulk import result:", result);
			return result;
		},
		onSuccess: (result: BulkKakeraImportResponse) => {
			queryClient.invalidateQueries({ queryKey: ["kakera-claims"] });
			queryClient.invalidateQueries({ queryKey: ["kakera-stats"] });
			setShowBulkImportModal(false);
			setBulkImportData("");
			setBulkImportCharacterName("");
			if (result.errors.length > 0) {
				alert(
					`Imported ${result.imported}, Skipped ${result.skipped}\n\nErrors:\n${result.errors.join("\n")}`,
				);
			} else {
				alert(`Imported ${result.imported} claims, skipped ${result.skipped}`);
			}
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
	const config = TIME_RANGE_CONFIG[timeRange];
	const daysCount = config.days ?? 365;

	const dateRange = Array.from({ length: daysCount }, (_, i) => {
		const date = subDays(now, i);
		return format(date, "yyyy-MM-dd");
	}).reverse();

	const dailyData = dateRange.map((date) => {
		const dayClaims = claims.filter(
			(c) => format(parseISO(c.claimedAt), "yyyy-MM-dd") === date,
		);
		return {
			date: format(parseISO(date), "MMM dd"),
			value: dayClaims.reduce((sum, c) => sum + c.value, 0),
			count: dayClaims.length,
		};
	});

	const startDate = config.days ? startOfDay(subDays(now, config.days)) : null;
	const filteredClaims = startDate
		? claims.filter((c) => isAfter(parseISO(c.claimedAt), startDate))
		: claims;

	const sevenDaysAgo = startOfDay(subDays(now, 7));
	const last7DaysClaims = claims.filter((c) =>
		isAfter(parseISO(c.claimedAt), sevenDaysAgo),
	);
	const last7DaysTotal = last7DaysClaims.reduce((sum, c) => sum + c.value, 0);

	const avgPerClaim =
		filteredClaims.length > 0
			? filteredClaims.reduce((sum, c) => sum + c.value, 0) /
				filteredClaims.length
			: 0;
	const daysWithData = dailyData.filter((d) => d.value > 0).length || 1;
	const dailyAvg =
		dailyData.reduce((sum, d) => sum + d.value, 0) / daysWithData;

	const getKakeraColor = (type: string | number) => {
		const typeStr = String(type).toLowerCase();
		return KAKERA_COLORS[typeStr as KakeraType] || "#ffffff";
	};

	const pieData = Object.entries(
		filteredClaims.reduce(
			(acc, claim) => {
				const type = String(claim.type);
				if (!acc[type]) {
					acc[type] = { totalValue: 0, count: 0 };
				}
				acc[type].totalValue += claim.value;
				acc[type].count += 1;
				return acc;
			},
			{} as Record<string, { totalValue: number; count: number }>,
		),
	).map(([type, data]) => ({
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
		const dayClaims = filteredClaims.filter(
			(c) => parseISO(c.claimedAt).getDay() === i,
		);
		return {
			name,
			count: dayClaims.length,
			value: dayClaims.reduce((sum, c) => sum + c.value, 0),
		};
	});

	const rolling7DayData = dailyData.map((day, i) => {
		const start = Math.max(0, i - 6);
		const window = dailyData.slice(start, i + 1);
		const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length;
		return {
			...day,
			rollingAvg: Math.round(avg),
		};
	});

	const dailyValues = dailyData.filter((d) => d.value > 0).map((d) => d.value);
	const sortedDailyValues = [...dailyValues].sort((a, b) => a - b);

	const medianDaily =
		sortedDailyValues.length > 0
			? sortedDailyValues.length % 2 === 0
				? (sortedDailyValues[sortedDailyValues.length / 2 - 1] +
						sortedDailyValues[sortedDailyValues.length / 2]) /
					2
				: sortedDailyValues[Math.floor(sortedDailyValues.length / 2)]
			: 0;

	const percentile25 =
		sortedDailyValues.length > 0
			? sortedDailyValues[Math.floor(sortedDailyValues.length * 0.25)]
			: 0;
	const percentile75 =
		sortedDailyValues.length > 0
			? sortedDailyValues[Math.floor(sortedDailyValues.length * 0.75)]
			: 0;

	const mean =
		dailyValues.length > 0
			? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
			: 0;
	const variance =
		dailyValues.length > 0
			? dailyValues.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
				dailyValues.length
			: 0;
	const stdDev = Math.sqrt(variance);
	const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

	const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
	const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
	const firstHalfAvg =
		firstHalf.length > 0
			? firstHalf.reduce((sum, d) => sum + d.value, 0) /
					firstHalf.filter((d) => d.value > 0).length || 1
			: 0;
	const secondHalfAvg =
		secondHalf.length > 0
			? secondHalf.reduce((sum, d) => sum + d.value, 0) /
					secondHalf.filter((d) => d.value > 0).length || 1
			: 0;
	const momentum =
		firstHalfAvg > 0
			? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
			: 0;

	const targetValue = parseInt(thresholdTarget) || 0;
	const remaining = targetValue;

	const daysToTargetDailyAvg =
		dailyAvg > 0 ? Math.ceil(remaining / dailyAvg) : Infinity;
	const daysToTargetMedian =
		medianDaily > 0 ? Math.ceil(remaining / medianDaily) : Infinity;
	const daysToTargetLast7 =
		last7DaysTotal > 0 ? Math.ceil(remaining / (last7DaysTotal / 7)) : Infinity;
	const daysToTargetTrend =
		secondHalfAvg > 0 ? Math.ceil(remaining / secondHalfAvg) : Infinity;

	const recentRollingAvg =
		rolling7DayData.length > 0
			? rolling7DayData[rolling7DayData.length - 1].rollingAvg
			: 0;

	const maxStreak = (() => {
		let maxLen = 0;
		let currentLen = 0;
		for (const day of dailyData) {
			if (day.value > 0) {
				currentLen++;
				maxLen = Math.max(maxLen, currentLen);
			} else {
				currentLen = 0;
			}
		}
		return maxLen;
	})();

	const bestDay = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
	const worstDay = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;
	const activeDaysCount = dailyData.filter((d) => d.value > 0).length;
	const consistencyScore =
		dailyData.length > 0 ? (activeDaysCount / dailyData.length) * 100 : 0;

	const calculateLinearModel = () => {
		setIsCalculating(true);

		setTimeout(() => {
			try {
				const dailyTotals = dailyData.map((d, i) => ({
					x: i + 1,
					y: d.value,
				}));

				const firstNonZeroIndex = dailyTotals.findIndex((p) => p.y > 0);
				const startIndex = Math.max(0, firstNonZeroIndex);
				const dataPoints = dailyTotals.slice(startIndex);

				const n = dataPoints.length;
				if (n < 2) {
					alert("Not enough data points to fit a model.");
					setIsCalculating(false);
					return;
				}

				const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
				const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
				const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
				const sumXX = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

				const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
				const intercept = (sumY - slope * sumX) / n;

				const meanY = sumY / n;
				const ssTotal = dataPoints.reduce(
					(sum, p) => sum + (p.y - meanY) ** 2,
					0,
				);
				const ssResidual = dataPoints.reduce((sum, p) => {
					const predicted = slope * p.x + intercept;
					return sum + (p.y - predicted) ** 2;
				}, 0);
				const rSquared = Math.max(0, 1 - ssResidual / ssTotal);

				const currentBaseline = stats.totalValue;
				const lastDayInData = Math.max(...dataPoints.map((p) => p.x));

				const futureDays = [7, 14, 30, 60, 90];
				const predictions: {
					day: number;
					dailyIncome: number;
					cumulative: number;
				}[] = [];

				for (const daysAhead of futureDays) {
					const targetDay = lastDayInData + daysAhead;
					let cumulativeFuture = 0;

					for (let day = lastDayInData + 1; day <= targetDay; day++) {
						const predictedDaily = Math.max(0, slope * day + intercept);
						cumulativeFuture += predictedDaily;
					}

					const predictedDailyAtTarget = Math.max(
						0,
						slope * targetDay + intercept,
					);

					predictions.push({
						day: targetDay,
						dailyIncome: Math.round(predictedDailyAtTarget),
						cumulative: Math.round(currentBaseline + cumulativeFuture),
					});
				}

				setLinearResult({
					slope,
					intercept,
					rSquared,
					currentBaseline,
					lastDayInData,
					predictions,
				});
			} catch (error) {
				console.error("Linear regression failed:", error);
				alert("Calculation failed.");
			} finally {
				setIsCalculating(false);
			}
		}, 50);
	};

	// Sorting and pagination for table (uses ALL claims, not filtered)
	const sortedClaims = [...claims].sort((a, b) => {
		let comparison = 0;
		switch (sortBy) {
			case "characterName":
				comparison = (a.characterName || "").localeCompare(
					b.characterName || "",
				);
				break;
			case "type":
				comparison = String(a.type).localeCompare(String(b.type));
				break;
			case "value":
				comparison = a.value - b.value;
				break;
			case "claimedAt":
				comparison =
					new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime();
				break;
		}
		return sortDirection === "asc" ? comparison : -comparison;
	});

	const totalPages = Math.ceil(sortedClaims.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedClaims = sortedClaims.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortDirection("desc");
		}
		setCurrentPage(1);
	};

	const SortIndicator = ({ field }: { field: SortField }) => {
		if (sortBy !== field) return null;
		return sortDirection === "asc" ? (
			<CaretUp size={14} className="inline ml-1" />
		) : (
			<CaretDown size={14} className="inline ml-1" />
		);
	};

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
						onClick={() => setShowBulkImportModal(true)}
						className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors"
					>
						<FileText size={18} />
						Bulk Import
					</button>
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

			<div className="flex flex-wrap gap-2">
				{(Object.keys(TIME_RANGE_CONFIG) as TimeRange[]).map((range) => (
					<button
						key={range}
						type="button"
						onClick={() => setTimeRange(range)}
						className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
							timeRange === range
								? "bg-sakura-500 text-white"
								: "bg-background-tertiary text-foreground-muted hover:text-foreground hover:bg-background-secondary"
						}`}
					>
						{TIME_RANGE_CONFIG[range].label}
					</button>
				))}
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
						<ChartBar size={20} /> Daily Kakera Gain ({config.label})
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
							<ChartPie size={20} /> Distribution by Type ({config.label})
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
						<ChartBar size={20} /> Claims per Day ({config.label})
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
						<Calendar size={20} /> Claims by Day of Week ({config.label})
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
						<TrendUp size={20} /> Cumulative Growth ({config.label})
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
				<button
					type="button"
					onClick={() => setShowAdvancedStats(!showAdvancedStats)}
					className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
				>
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Gauge size={20} className="text-purple-400" />
						Advanced Statistics
					</h2>
					<div className="flex items-center gap-2 text-foreground-muted">
						<span className="text-sm">
							Rolling averages, projections & more
						</span>
						{showAdvancedStats ? (
							<CaretUp size={20} />
						) : (
							<CaretDown size={20} />
						)}
					</div>
				</button>

				{showAdvancedStats && (
					<div className="p-6 pt-0 space-y-8 border-t border-border">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Rolling 7-Day Avg
								</div>
								<p className="text-2xl font-bold text-purple-400">
									{recentRollingAvg.toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Recent smoothed daily average
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Median Daily
								</div>
								<p className="text-2xl font-bold text-cyan-400">
									{Math.round(medianDaily).toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									More robust than average
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Std Deviation
								</div>
								<p className="text-2xl font-bold text-orange-400">
									{Math.round(stdDev).toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Income volatility measure
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Consistency
								</div>
								<p className="text-2xl font-bold text-teal-400">
									{consistencyScore.toFixed(1)}%
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									{activeDaysCount} of {dailyData.length} days active
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Momentum
								</div>
								<p
									className={`text-2xl font-bold flex items-center gap-2 ${momentum >= 0 ? "text-green-400" : "text-red-400"}`}
								>
									{momentum >= 0 ? (
										<TrendUp size={20} />
									) : (
										<TrendDown size={20} />
									)}
									{Math.abs(momentum).toFixed(1)}%
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Recent vs historical performance
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Volatility (CV)
								</div>
								<p className="text-2xl font-bold text-yellow-400">
									{coefficientOfVariation.toFixed(1)}%
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Coefficient of variation
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Longest Streak
								</div>
								<p className="text-2xl font-bold text-pink-400">
									{maxStreak} days
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Consecutive days with claims
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									Best/Worst Day
								</div>
								<p className="text-lg font-bold">
									<span className="text-green-400">
										{bestDay.toLocaleString()}
									</span>
									<span className="text-foreground-muted mx-2">/</span>
									<span className="text-red-400">
										{worstDay.toLocaleString()}
									</span>
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Highest and lowest daily income
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									25th Percentile
								</div>
								<p className="text-2xl font-bold text-blue-300">
									{percentile25.toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									25% of days are below this
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									50th Percentile (Median)
								</div>
								<p className="text-2xl font-bold text-blue-400">
									{Math.round(medianDaily).toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									Half of days are below this
								</p>
							</div>
							<div className="bg-background-tertiary/50 rounded-lg p-4">
								<div className="text-foreground-muted text-sm mb-1">
									75th Percentile
								</div>
								<p className="text-2xl font-bold text-blue-500">
									{percentile75.toLocaleString()}
								</p>
								<p className="text-xs text-foreground-muted mt-1">
									75% of days are below this
								</p>
							</div>
						</div>

						<div className="bg-background-tertiary/30 rounded-xl p-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Target size={20} className="text-sakura-400" />
								Threshold Calculator
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label
										htmlFor="threshold-target"
										className="block text-sm font-medium mb-2"
									>
										Target Kakera Amount
									</label>
									<input
										id="threshold-target"
										type="number"
										value={thresholdTarget}
										onChange={(e) => setThresholdTarget(e.target.value)}
										className="w-full px-4 py-2 bg-background-tertiary rounded-lg border border-border focus:border-sakura-500 focus:outline-none"
										placeholder="e.g., 100000"
									/>
									<p className="text-xs text-foreground-muted mt-2">
										Target:{" "}
										<span className="text-sakura-400 font-semibold">
											{remaining.toLocaleString()}
										</span>{" "}
										kakera
									</p>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-foreground-muted">
											Using daily avg:
										</span>
										<span className="font-semibold text-emerald-400">
											{daysToTargetDailyAvg === Infinity
												? "∞"
												: `${daysToTargetDailyAvg} days`}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-foreground-muted">
											Using median:
										</span>
										<span className="font-semibold text-cyan-400">
											{daysToTargetMedian === Infinity
												? "∞"
												: `${daysToTargetMedian} days`}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-foreground-muted">
											Using last 7 days:
										</span>
										<span className="font-semibold text-indigo-400">
											{daysToTargetLast7 === Infinity
												? "∞"
												: `${daysToTargetLast7} days`}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm text-foreground-muted">
											Using recent trend:
										</span>
										<span
											className={`font-semibold ${momentum >= 0 ? "text-green-400" : "text-red-400"}`}
										>
											{daysToTargetTrend === Infinity
												? "∞"
												: `${daysToTargetTrend} days`}
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="glass rounded-xl p-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<ChartBar size={20} className="text-purple-400" />
								7-Day Rolling Average Trend
							</h3>
							<div className="h-[250px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={rolling7DayData}>
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
										<Line
											type="monotone"
											dataKey="rollingAvg"
											stroke="#a855f7"
											strokeWidth={2}
											dot={false}
											name="7-Day Rolling Avg"
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="bg-background-tertiary/30 rounded-xl p-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<TrendUp size={20} className="text-cyan-400" />
								Linear Growth Model
							</h3>
							<p className="text-sm text-foreground-muted mb-4">
								Uses linear regression on daily income to find your earnings
								velocity (rate of growth), then projects future cumulative
								totals by summing predicted daily incomes.
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								<div className="flex items-end">
									<button
										type="button"
										onClick={calculateLinearModel}
										disabled={isCalculating || dailyData.length < 2}
										className="w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										{isCalculating ? (
											<>
												<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
												Calculating...
											</>
										) : (
											"Calculate Model"
										)}
									</button>
								</div>
								<div className="flex items-end">
									{linearResult && (
										<div className="text-sm space-y-1">
											<div>
												<span className="text-foreground-muted">R² = </span>
												<span className="font-semibold text-green-400">
													{(linearResult.rSquared * 100).toFixed(2)}%
												</span>
											</div>
											<div>
												<span className="text-foreground-muted">Slope = </span>
												<span
													className={`font-semibold ${linearResult.slope >= 0 ? "text-emerald-400" : "text-red-400"}`}
												>
													{linearResult.slope >= 0 ? "+" : ""}
													{linearResult.slope.toFixed(2)} kakera/day²
												</span>
											</div>
										</div>
									)}
								</div>
							</div>

							{linearResult && (
								<div className="space-y-4">
									<div className="bg-background-secondary/50 rounded-lg p-4">
										<h4 className="text-sm font-semibold mb-2 text-cyan-400">
											Daily Income Model
										</h4>
										<p className="font-mono text-sm text-foreground">
											daily_income = {linearResult.intercept.toFixed(2)} + (
											{linearResult.slope.toFixed(2)} × day)
										</p>
										<p className="text-xs text-foreground-muted mt-2">
											{linearResult.slope >= 0
												? `Your daily income is growing by ~${linearResult.slope.toFixed(1)} kakera each day`
												: `Your daily income is declining by ~${Math.abs(linearResult.slope).toFixed(1)} kakera each day`}
										</p>
									</div>

									<div>
										<h4 className="text-sm font-semibold mb-3 text-foreground-muted">
											Projected Cumulative Totals
										</h4>
										<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
											{linearResult.predictions.map((prediction) => {
												const daysAhead =
													prediction.day - linearResult.lastDayInData;
												return (
													<div
														key={prediction.day}
														className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/20 rounded-lg p-3"
													>
														<div className="text-cyan-300 text-xs mb-1">
															+{daysAhead} days
														</div>
														<div className="text-lg font-bold text-cyan-400">
															{prediction.cumulative.toLocaleString()}
														</div>
														<div className="text-xs text-foreground-muted mt-1">
															~{prediction.dailyIncome.toLocaleString()}/day
														</div>
													</div>
												);
											})}
										</div>
									</div>

									<div className="bg-background-secondary/30 rounded-lg p-4 text-sm">
										<h4 className="font-semibold mb-2 text-amber-400">
											How it works:
										</h4>
										<ol className="list-decimal list-inside space-y-1 text-foreground-muted">
											<li>
												Calculates daily income totals from your claim history
											</li>
											<li>
												Fits a linear regression to find if your daily income is
												trending up/down
											</li>
											<li>
												Predicts future daily incomes using the fitted line
											</li>
											<li>
												Sums predicted daily incomes to get cumulative
												projections
											</li>
										</ol>
									</div>

									<div>
										<h4 className="text-sm font-semibold mb-3 text-foreground-muted">
											Cumulative Growth Projection
										</h4>
										<div className="h-[350px] w-full">
											<ResponsiveContainer width="100%" height="100%">
												<LineChart
													data={[
														...cumulativeData.map((d, i) => ({
															day: i + 1,
															actual: d.cumulativeValue,
															predicted: null as number | null,
															isFuture: false,
														})),
														...Array.from({ length: 90 }, (_, i) => {
															const day = linearResult.lastDayInData + i + 1;
															let cumulativeFuture = 0;
															for (
																let d = linearResult.lastDayInData + 1;
																d <= day;
																d++
															) {
																cumulativeFuture += Math.max(
																	0,
																	linearResult.slope * d +
																		linearResult.intercept,
																);
															}
															return {
																day,
																actual: null as number | null,
																predicted:
																	linearResult.currentBaseline +
																	cumulativeFuture,
																isFuture: true,
															};
														}),
													]}
												>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke="rgba(255,255,255,0.05)"
													/>
													<XAxis
														dataKey="day"
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
														tickFormatter={(value) =>
															`${(value / 1000).toFixed(0)}k`
														}
													/>
													<Tooltip
														contentStyle={{
															backgroundColor: "rgba(26, 26, 46, 0.9)",
															border: "1px solid rgba(242, 181, 212, 0.2)",
															borderRadius: "8px",
														}}
														formatter={(
															value: number | undefined,
															_name,
															props,
														) => {
															if (value === undefined) return "";
															const isFuture = props.payload?.isFuture;
															return (
																<span
																	className={isFuture ? "text-cyan-400" : ""}
																>
																	{value.toLocaleString()}
																	{isFuture ? " (projected)" : ""}
																</span>
															);
														}}
													/>
													<Line
														type="monotone"
														dataKey="actual"
														stroke="#f2b5d4"
														strokeWidth={2}
														dot={false}
														name="Actual"
														connectNulls={false}
													/>
													<Line
														type="monotone"
														dataKey="predicted"
														stroke="#22d3ee"
														strokeWidth={2}
														strokeDasharray="5 5"
														dot={false}
														name="Projected"
													/>
												</LineChart>
											</ResponsiveContainer>
										</div>
										<div className="flex items-center justify-center gap-6 text-sm mt-4">
											<div className="flex items-center gap-2">
												<div className="w-8 h-0.5 bg-[#f2b5d4]" />
												<span className="text-foreground-muted">
													Actual Data
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div
													className="w-8 h-0.5 bg-[#22d3ee]"
													style={{ borderStyle: "dashed" }}
												/>
												<span className="text-foreground-muted">
													Model Projection
												</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="glass rounded-xl overflow-hidden">
				<div className="p-6 border-b border-border flex items-center justify-between">
					<h2 className="text-lg font-semibold">Claims</h2>
					<div className="flex items-center gap-3">
						<span className="text-sm text-foreground-muted">
							{sortedClaims.length} total
						</span>
						<select
							value={itemsPerPage}
							onChange={(e) => {
								setItemsPerPage(Number(e.target.value));
								setCurrentPage(1);
							}}
							className="px-3 py-1.5 bg-background-tertiary rounded-lg border border-border text-sm focus:border-sakura-500 focus:outline-none"
						>
							<option value={10}>10 per page</option>
							<option value={20}>20 per page</option>
							<option value={50}>50 per page</option>
							<option value={100}>100 per page</option>
						</select>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-background-tertiary/50">
								<th className="px-6 py-3 text-sm font-semibold">
									<button
										type="button"
										onClick={() => handleSort("characterName")}
										className="flex items-center hover:text-sakura-400 transition-colors"
									>
										Character
										<SortIndicator field="characterName" />
									</button>
								</th>
								<th className="px-6 py-3 text-sm font-semibold">
									<button
										type="button"
										onClick={() => handleSort("type")}
										className="flex items-center hover:text-sakura-400 transition-colors"
									>
										Type
										<SortIndicator field="type" />
									</button>
								</th>
								<th className="px-6 py-3 text-sm font-semibold text-right">
									<button
										type="button"
										onClick={() => handleSort("value")}
										className="flex items-center justify-end ml-auto hover:text-sakura-400 transition-colors"
									>
										Value
										<SortIndicator field="value" />
									</button>
								</th>
								<th className="px-6 py-3 text-sm font-semibold text-center">
									Status
								</th>
								<th className="px-6 py-3 text-sm font-semibold">
									<button
										type="button"
										onClick={() => handleSort("claimedAt")}
										className="flex items-center hover:text-sakura-400 transition-colors"
									>
										Date
										<SortIndicator field="claimedAt" />
									</button>
								</th>
								<th className="px-6 py-3 text-sm font-semibold w-24"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{paginatedClaims.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-foreground-muted"
									>
										No claims found
									</td>
								</tr>
							) : (
								paginatedClaims.map((claim) => (
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
								))
							)}
						</tbody>
					</table>
				</div>
				{totalPages > 1 && (
					<div className="p-4 border-t border-border flex items-center justify-between">
						<div className="text-sm text-foreground-muted">
							Showing {startIndex + 1} to{" "}
							{Math.min(startIndex + itemsPerPage, sortedClaims.length)} of{" "}
							{sortedClaims.length} claims
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setCurrentPage(1)}
								disabled={currentPage === 1}
								className="px-3 py-1.5 bg-background-tertiary rounded-lg text-sm hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								First
							</button>
							<button
								type="button"
								onClick={() => setCurrentPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="px-3 py-1.5 bg-background-tertiary rounded-lg text-sm hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Previous
							</button>
							<span className="px-3 py-1.5 text-sm">
								Page {currentPage} of {totalPages}
							</span>
							<button
								type="button"
								onClick={() => setCurrentPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="px-3 py-1.5 bg-background-tertiary rounded-lg text-sm hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Next
							</button>
							<button
								type="button"
								onClick={() => setCurrentPage(totalPages)}
								disabled={currentPage === totalPages}
								className="px-3 py-1.5 bg-background-tertiary rounded-lg text-sm hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Last
							</button>
						</div>
					</div>
				)}
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

			{showBulkImportModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="glass rounded-xl w-full max-w-2xl mx-4 p-6 lantern-top">
						<div className="flex items-center gap-3 mb-4">
							<FileText size={24} className="text-sakura-400" weight="bold" />
							<h2 className="text-xl font-semibold">
								Bulk Import from Discord
							</h2>
						</div>
						<p className="text-foreground-muted mb-4">
							Paste your Discord kakera log data below. The parser will
							automatically extract kakera claims.
						</p>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="character-name"
									className="block text-sm font-medium mb-2"
								>
									Character Name (optional)
								</label>
								<input
									id="character-name"
									type="text"
									value={bulkImportCharacterName}
									onChange={(e) => setBulkImportCharacterName(e.target.value)}
									placeholder="e.g., iamshiron"
									className="w-full px-4 py-2 bg-background-tertiary rounded-lg border border-border focus:border-sakura-500 focus:outline-none"
								/>
								<p className="text-xs text-foreground-muted mt-1">
									If provided, all claims will be associated with this
									character.
								</p>
							</div>
							<div>
								<label
									htmlFor="log-data"
									className="block text-sm font-medium mb-2"
								>
									Log Data
								</label>
								<textarea
									id="log-data"
									value={bulkImportData}
									onChange={(e) => setBulkImportData(e.target.value)}
									placeholder={`Paste Discord log here, e.g.:
Logan Yarborough
APP
 — 10/22/2025 7:06 PM
:kakera:iamshiron +121 ($k)`}
									rows={10}
									className="w-full px-4 py-3 bg-background-tertiary rounded-lg border border-border focus:border-sakura-500 focus:outline-none font-mono text-sm resize-none"
								/>
							</div>
						</div>
						<div className="flex gap-3 justify-end mt-6">
							<button
								type="button"
								onClick={() => {
									setShowBulkImportModal(false);
									setBulkImportData("");
									setBulkImportCharacterName("");
								}}
								className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => bulkImportMutation.mutate()}
								disabled={
									bulkImportMutation.isPending || !bulkImportData.trim()
								}
								className="px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors disabled:opacity-50"
							>
								{bulkImportMutation.isPending ? "Importing..." : "Import"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

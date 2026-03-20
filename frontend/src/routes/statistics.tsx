import {
    CalendarIcon,
    CaretDownIcon,
    CaretUpIcon,
    ChartBarIcon,
    ChartPieIcon,
    ClockIcon,
    DownloadIcon,
    FileTextIcon,
    GaugeIcon,
    ListNumbersIcon,
    PencilSimpleIcon,
    PlusIcon,
    TargetIcon,
    TrashIcon,
    TrendDownIcon,
    TrendUpIcon,
    UploadIcon,
    WarningIcon,
} from "@phosphor-icons/react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {format, isAfter, parseISO, startOfDay, subDays} from "date-fns";
import {useState} from "react";
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
import {KakeraClaimModal} from "@/components/kakera/KakeraClaimModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Spinner} from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {Textarea} from "@/components/ui/textarea";
import {useAuth} from "@/hooks/useAuth";
import {kakeraApi} from "@/lib/api";
import {KAKERA_COLORS} from "@/lib/constants";
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

// Chart colors derived from design tokens
const CHART_COLORS = {
    sakura: "var(--primary)",
    info: "var(--info)",
    purple: "var(--chart-3)",
    cyan: "var(--info)",
} as const;

const CHART_TOOLTIP_STYLE = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
} as const;

const CHART_GRID_STROKE = "var(--border)";
const CHART_AXIS_STROKE = "var(--muted-foreground)";

type TimeRange = "week" | "month" | "3months" | "year" | "all";

type SortField = "characterName" | "type" | "value" | "claimedAt";
type SortDirection = "asc" | "desc";

const TIME_RANGE_CONFIG: Record<
    TimeRange,
    { label: string; days: number | null }
> = {
    week: {label: "Last Week", days: 7},
    month: {label: "Last Month", days: 30},
    "3months": {label: "Last 3 Months", days: 90},
    year: {label: "Last Year", days: 365},
    all: {label: "All Time", days: null},
};

function StatisticsPage() {
    const {isAuthenticated} = useAuth();
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

    const {data: claims, isLoading: claimsLoading} = useQuery({
        queryKey: ["kakera-claims"],
        queryFn: () => kakeraApi.getClaims(),
        enabled: isAuthenticated,
    });

    const {data: stats, isLoading: statsLoading} = useQuery({
        queryKey: ["kakera-stats"],
        queryFn: () => kakeraApi.getStats(),
        enabled: isAuthenticated,
    });

    const createClaimMutation = useMutation({
        mutationFn: (request: CreateKakeraClaimRequest) =>
            kakeraApi.createClaim(request),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
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
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
            setEditClaim(null);
        },
    });

    const deleteClaimMutation = useMutation({
        mutationFn: (id: string) => kakeraApi.deleteClaim(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
            setDeleteConfirmId(null);
        },
    });

    const importClaimsMutation = useMutation({
        mutationFn: (claims: KakeraClaimExportItem[]) =>
            kakeraApi.importClaims(claims),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
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
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
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
            queryClient.invalidateQueries({queryKey: ["kakera-claims"]});
            queryClient.invalidateQueries({queryKey: ["kakera-stats"]});
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
                <Spinner className="size-8"/>
            </div>
        );
    }

    if (!claims || !stats) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No kakera data found.</p>
            </div>
        );
    }

    // Process data for charts
    const now = new Date();
    const config = TIME_RANGE_CONFIG[timeRange];
    const daysCount = config.days ?? 365;

    const dateRange = Array.from({length: daysCount}, (_, i) => {
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
        return KAKERA_COLORS[typeStr as KakeraType] || "var(--foreground)";
    };

    const pieData = Object.entries(
        filteredClaims.reduce(
            (acc, claim) => {
                const type = String(claim.type);
                if (!acc[type]) {
                    acc[type] = {totalValue: 0, count: 0};
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

    const SortIndicator = ({field}: { field: SortField }) => {
        if (sortBy !== field) return null;
        return sortDirection === "asc" ? (
            <CaretUpIcon size={14} className="inline ml-1"/>
        ) : (
            <CaretDownIcon size={14} className="inline ml-1"/>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Kakera Statistics</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Insights and trends for your kakera claims
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        className="h-9 px-4 text-sm"
                        onClick={handleExport}
                    >
                        <DownloadIcon size={18}/>
                        Export
                    </Button>
                    <Button variant="secondary" className="h-9 px-4 text-sm" asChild>
                        <label className="cursor-pointer">
                            <UploadIcon size={18}/>
                            Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportFile}
                                className="hidden"
                            />
                        </label>
                    </Button>
                    <Button
                        variant="secondary"
                        className="h-9 px-4 text-sm"
                        onClick={() => setShowBulkImportModal(true)}
                    >
                        <FileTextIcon size={18}/>
                        Bulk Import
                    </Button>
                    <Button
                        variant="destructive"
                        className="h-9 px-4 text-sm"
                        onClick={() => setShowWipeConfirm(true)}
                    >
                        <TrashIcon size={18}/>
                        Wipe
                    </Button>
                    <Button
                        className="h-9 px-4 text-sm"
                        onClick={() => setShowAddModal(true)}
                    >
                        <PlusIcon size={18}/>
                        Log Claim
                    </Button>
                </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex flex-wrap gap-2">
                {(Object.keys(TIME_RANGE_CONFIG) as TimeRange[]).map((range) => (
                    <Button
                        key={range}
                        variant={timeRange === range ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setTimeRange(range)}
                    >
                        {TIME_RANGE_CONFIG[range].label}
                    </Button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                            <TrendUpIcon size={20} className="text-primary"/>
                            <span className="text-muted-foreground text-sm">
								Total Kakera
							</span>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                            {stats.totalValue.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <ChartBarIcon size={20} className="text-info"/>
                            <span className="text-muted-foreground text-sm">
								Total Claims
							</span>
                        </div>
                        <p className="text-3xl font-bold text-info">
                            {stats.totalCount.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <ListNumbersIcon size={20} className="text-success"/>
                            <span className="text-muted-foreground text-sm">
								Avg. per Claim
							</span>
                        </div>
                        <p className="text-3xl font-bold text-success">
                            {Math.round(avgPerClaim).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <TargetIcon size={20} className="text-primary"/>
                            <span className="text-muted-foreground text-sm">Best Claim</span>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                            {Math.max(...claims.map((c) => c.value), 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarIcon size={20} className="text-chart-2"/>
                            <span className="text-muted-foreground text-sm">Last 7 Days</span>
                        </div>
                        <p className="text-3xl font-bold text-chart-2">
                            {last7DaysTotal.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <TrendUpIcon size={20} className="text-success"/>
                            <span className="text-muted-foreground text-sm">
								Daily Average
							</span>
                        </div>
                        <p className="text-3xl font-bold text-success">
                            {Math.round(dailyAvg).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <ChartBarIcon size={20} className="text-warning"/>
                            <span className="text-muted-foreground text-sm">
								Monthly Est.
							</span>
                        </div>
                        <p className="text-3xl font-bold text-warning">
                            {Math.round(dailyAvg * 30).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="glass lantern-top">
                    <CardContent>
                        <div className="flex items-center gap-3 mb-2">
                            <ClockIcon size={20} className="text-destructive"/>
                            <span className="text-muted-foreground text-sm">
								Success Rate
							</span>
                        </div>
                        <p className="text-3xl font-bold text-destructive">
                            {claims.length > 0
                                ? `${Math.round((claims.filter((c) => c.isClaimed).length / claims.length) * 100)}%`
                                : "0%"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Kakera Gain */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ChartBarIcon size={20}/> Daily Kakera Gain ({config.label})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={CHART_COLORS.sakura}
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={CHART_COLORS.sakura}
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={CHART_GRID_STROKE}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE}/>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={CHART_COLORS.sakura}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        name="Kakera"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution by Type */}
                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center justify-between w-full">
                            <CardTitle className="flex items-center gap-2">
                                <ChartPieIcon size={20}/> Distribution by Type ({config.label})
                            </CardTitle>
                            <div className="flex gap-1 bg-muted rounded-lg p-1">
                                <Button
                                    variant={pieChartMode === "value" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPieChartMode("value")}
                                >
                                    By Value
                                </Button>
                                <Button
                                    variant={pieChartMode === "count" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPieChartMode("count")}
                                >
                                    By Count
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-75 w-full">
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
                                            <Cell
                                                key={entry.type}
                                                fill={getKakeraColor(entry.type)}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={CHART_TOOLTIP_STYLE}
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
                                <div
                                    key={entry.name}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: getKakeraColor(entry.type),
                                        }}
                                    />
                                    <span className="text-muted-foreground truncate">
										{entry.name}
									</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Claims per Day */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ChartBarIcon size={20}/> Claims per Day ({config.label})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-75 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={CHART_GRID_STROKE}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE}/>
                                    <Bar
                                        dataKey="count"
                                        fill={CHART_COLORS.sakura}
                                        radius={[4, 4, 0, 0]}
                                        name="Claims"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Claims by Day of Week */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon size={20}/> Claims by Day of Week ({config.label})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dowData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={CHART_GRID_STROKE}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE}/>
                                    <Bar
                                        dataKey="count"
                                        fill={CHART_COLORS.info}
                                        radius={[4, 4, 0, 0]}
                                        name="Claims"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Cumulative Growth */}
                <Card className="glass lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendUpIcon size={20}/> Cumulative Growth ({config.label})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-75 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cumulativeData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={CHART_GRID_STROKE}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke={CHART_AXIS_STROKE}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE}/>
                                    <Line
                                        type="monotone"
                                        dataKey="cumulativeValue"
                                        stroke={CHART_COLORS.sakura}
                                        strokeWidth={3}
                                        dot={false}
                                        name="Total Kakera"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Statistics Collapsible */}
            <Card className="glass overflow-hidden">
                <Collapsible
                    open={showAdvancedStats}
                    onOpenChange={setShowAdvancedStats}
                >
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <GaugeIcon size={20} className="text-chart-3"/>
                                Advanced Statistics
                            </h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
								<span className="text-sm">
									Rolling averages, projections & more
								</span>
                                {showAdvancedStats ? (
                                    <CaretUpIcon size={20}/>
                                ) : (
                                    <CaretDownIcon size={20}/>
                                )}
                            </div>
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="p-6 pt-0 space-y-8 border-t border-border">
                            {/* Row 1: Rolling Avg, Median, Std Dev, Consistency */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Rolling 7-Day Avg
                                    </div>
                                    <p className="text-2xl font-bold text-chart-3">
                                        {recentRollingAvg.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Recent smoothed daily average
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Median Daily
                                    </div>
                                    <p className="text-2xl font-bold text-info">
                                        {Math.round(medianDaily).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        More robust than average
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Std Deviation
                                    </div>
                                    <p className="text-2xl font-bold text-warning">
                                        {Math.round(stdDev).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Income volatility measure
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Consistency
                                    </div>
                                    <p className="text-2xl font-bold text-chart-4">
                                        {consistencyScore.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {activeDaysCount} of {dailyData.length} days active
                                    </p>
                                </div>
                            </div>

                            {/* Row 2: Momentum, Volatility, Streak, Best/Worst */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Momentum
                                    </div>
                                    <p
                                        className={`text-2xl font-bold flex items-center gap-2 ${momentum >= 0 ? "text-success" : "text-destructive"}`}
                                    >
                                        {momentum >= 0 ? (
                                            <TrendUpIcon size={20}/>
                                        ) : (
                                            <TrendDownIcon size={20}/>
                                        )}
                                        {Math.abs(momentum).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Recent vs historical performance
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Volatility (CV)
                                    </div>
                                    <p className="text-2xl font-bold text-warning">
                                        {coefficientOfVariation.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Coefficient of variation
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Longest Streak
                                    </div>
                                    <p className="text-2xl font-bold text-primary">
                                        {maxStreak} days
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Consecutive days with claims
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        Best/Worst Day
                                    </div>
                                    <p className="text-lg font-bold">
										<span className="text-success">
											{bestDay.toLocaleString()}
										</span>
                                        <span className="text-muted-foreground mx-2">/</span>
                                        <span className="text-destructive">
											{worstDay.toLocaleString()}
										</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Highest and lowest daily income
                                    </p>
                                </div>
                            </div>

                            {/* Row 3: Percentiles */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        25th Percentile
                                    </div>
                                    <p className="text-2xl font-bold text-info/70">
                                        {percentile25.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        25% of days are below this
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        50th Percentile (Median)
                                    </div>
                                    <p className="text-2xl font-bold text-info">
                                        {Math.round(medianDaily).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Half of days are below this
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="text-muted-foreground text-sm mb-1">
                                        75th Percentile
                                    </div>
                                    <p className="text-2xl font-bold text-info">
                                        {percentile75.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        75% of days are below this
                                    </p>
                                </div>
                            </div>

                            {/* Threshold Calculator */}
                            <div className="bg-muted/30 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TargetIcon size={20} className="text-primary"/>
                                    Threshold Calculator
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="threshold-target" className="mb-2">
                                            Target Kakera Amount
                                        </Label>
                                        <Input
                                            id="threshold-target"
                                            type="number"
                                            value={thresholdTarget}
                                            onChange={(e) => setThresholdTarget(e.target.value)}
                                            className="h-9"
                                            placeholder="e.g., 100000"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Target:{" "}
                                            <span className="text-primary font-semibold">
												{remaining.toLocaleString()}
											</span>{" "}
                                            kakera
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">
												Using daily avg:
											</span>
                                            <span className="font-semibold text-success">
												{daysToTargetDailyAvg === Infinity
                                                    ? "\u221E"
                                                    : `${daysToTargetDailyAvg} days`}
											</span>
                                        </div>
                                        <div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">
												Using median:
											</span>
                                            <span className="font-semibold text-info">
												{daysToTargetMedian === Infinity
                                                    ? "\u221E"
                                                    : `${daysToTargetMedian} days`}
											</span>
                                        </div>
                                        <div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">
												Using last 7 days:
											</span>
                                            <span className="font-semibold text-chart-2">
												{daysToTargetLast7 === Infinity
                                                    ? "\u221E"
                                                    : `${daysToTargetLast7} days`}
											</span>
                                        </div>
                                        <div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">
												Using recent trend:
											</span>
                                            <span
                                                className={`font-semibold ${momentum >= 0 ? "text-success" : "text-destructive"}`}
                                            >
												{daysToTargetTrend === Infinity
                                                    ? "\u221E"
                                                    : `${daysToTargetTrend} days`}
											</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rolling Average Chart */}
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ChartBarIcon size={20} className="text-chart-3"/>
                                        7-Day Rolling Average Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={rolling7DayData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke={CHART_GRID_STROKE}
                                                />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke={CHART_AXIS_STROKE}
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke={CHART_AXIS_STROKE}
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE}/>
                                                <Line
                                                    type="monotone"
                                                    dataKey="rollingAvg"
                                                    stroke={CHART_COLORS.purple}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    name="7-Day Rolling Avg"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Linear Growth Model */}
                            <div className="bg-muted/30 rounded-xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TrendUpIcon size={20} className="text-info"/>
                                    Linear Growth Model
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Uses linear regression on daily income to find your earnings
                                    velocity (rate of growth), then projects future cumulative
                                    totals by summing predicted daily incomes.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-end">
                                        <Button
                                            onClick={calculateLinearModel}
                                            disabled={isCalculating || dailyData.length < 2}
                                            className="w-full"
                                        >
                                            {isCalculating ? (
                                                <>
                                                    <Spinner className="size-4"/>
                                                    Calculating...
                                                </>
                                            ) : (
                                                "Calculate Model"
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex items-end">
                                        {linearResult && (
                                            <div className="text-sm space-y-1">
                                                <div>
                                                    <span className="text-muted-foreground">R² = </span>
                                                    <span className="font-semibold text-success">
														{(linearResult.rSquared * 100).toFixed(2)}%
													</span>
                                                </div>
                                                <div>
													<span className="text-muted-foreground">
														Slope ={" "}
													</span>
                                                    <span
                                                        className={`font-semibold ${linearResult.slope >= 0 ? "text-success" : "text-destructive"}`}
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
                                        <div className="bg-secondary/50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold mb-2 text-info">
                                                Daily Income Model
                                            </h4>
                                            <p className="font-mono text-sm text-foreground">
                                                daily_income = {linearResult.intercept.toFixed(2)} + (
                                                {linearResult.slope.toFixed(2)} × day)
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {linearResult.slope >= 0
                                                    ? `Your daily income is growing by ~${linearResult.slope.toFixed(1)} kakera each day`
                                                    : `Your daily income is declining by ~${Math.abs(linearResult.slope).toFixed(1)} kakera each day`}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                                                Projected Cumulative Totals
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {linearResult.predictions.map((prediction) => {
                                                    const daysAhead =
                                                        prediction.day - linearResult.lastDayInData;
                                                    return (
                                                        <div
                                                            key={prediction.day}
                                                            className="bg-muted/30 border border-info/20 rounded-lg p-3"
                                                        >
                                                            <div className="text-info text-xs mb-1">
                                                                +{daysAhead} days
                                                            </div>
                                                            <div className="text-lg font-bold text-info">
                                                                {prediction.cumulative.toLocaleString()}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                ~{prediction.dailyIncome.toLocaleString()}/day
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="bg-secondary/30 rounded-lg p-4 text-sm">
                                            <h4 className="font-semibold mb-2 text-warning">
                                                How it works:
                                            </h4>
                                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                                <li>
                                                    Calculates daily income totals from your claim history
                                                </li>
                                                <li>
                                                    Fits a linear regression to find if your daily income
                                                    is trending up/down
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
                                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
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
                                                            ...Array.from({length: 90}, (_, i) => {
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
                                                            stroke={CHART_GRID_STROKE}
                                                        />
                                                        <XAxis
                                                            dataKey="day"
                                                            stroke={CHART_AXIS_STROKE}
                                                            fontSize={10}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <YAxis
                                                            stroke={CHART_AXIS_STROKE}
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) =>
                                                                `${(value / 1000).toFixed(0)}k`
                                                            }
                                                        />
                                                        <Tooltip
                                                            contentStyle={CHART_TOOLTIP_STYLE}
                                                            formatter={(
                                                                value: number | undefined,
                                                                _name,
                                                                props,
                                                            ) => {
                                                                if (value === undefined) return "";
                                                                const isFuture = props.payload?.isFuture;
                                                                return (
                                                                    <span className={isFuture ? "text-info" : ""}>
																		{value.toLocaleString()}
                                                                        {isFuture ? " (projected)" : ""}
																	</span>
                                                                );
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="actual"
                                                            stroke={CHART_COLORS.sakura}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            name="Actual"
                                                            connectNulls={false}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="predicted"
                                                            stroke={CHART_COLORS.cyan}
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
                                                    <div
                                                        className="w-8 h-0.5"
                                                        style={{backgroundColor: CHART_COLORS.sakura}}
                                                    />
                                                    <span className="text-muted-foreground">
														Actual Data
													</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-0.5"
                                                        style={{
                                                            backgroundColor: CHART_COLORS.cyan,
                                                            borderStyle: "dashed",
                                                        }}
                                                    />
                                                    <span className="text-muted-foreground">
														Model Projection
													</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Claims Table */}
            <Card className="glass overflow-hidden">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Claims</CardTitle>
                    <div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">
							{sortedClaims.length} total
						</span>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="20">20 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                                <SelectItem value="100">100 per page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("characterName")}
                                        className="flex items-center hover:text-primary transition-colors"
                                    >
                                        Character
                                        <SortIndicator field="characterName"/>
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("type")}
                                        className="flex items-center hover:text-primary transition-colors"
                                    >
                                        Type
                                        <SortIndicator field="type"/>
                                    </button>
                                </TableHead>
                                <TableHead className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleSort("value")}
                                        className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                                    >
                                        Value
                                        <SortIndicator field="value"/>
                                    </button>
                                </TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("claimedAt")}
                                        className="flex items-center hover:text-primary transition-colors"
                                    >
                                        Date
                                        <SortIndicator field="claimedAt"/>
                                    </button>
                                </TableHead>
                                <TableHead className="w-24"/>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedClaims.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No claims found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedClaims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell>
                                            {claim.characterName || (
                                                <span className="text-muted-foreground/70 italic">
													Unknown
												</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                                style={{
                                                    backgroundColor: `color-mix(in srgb, ${getKakeraColor(claim.type)} 12%, transparent)`,
                                                    color: getKakeraColor(claim.type),
                                                    borderColor: `color-mix(in srgb, ${getKakeraColor(claim.type)} 25%, transparent)`,
                                                }}
                                            >
                                                {String(claim.type).toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-primary">
                                            {claim.value.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {claim.isClaimed ? (
                                                <span className="text-success text-xs">Claimed</span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
													Not Claimed
												</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(parseISO(claim.claimedAt), "MMM dd, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            {deleteConfirmId === claim.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive h-auto py-0.5 px-1.5 text-xs"
                                                        onClick={() => deleteClaimMutation.mutate(claim.id)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground h-auto py-0.5 px-1.5 text-xs"
                                                        onClick={() => setDeleteConfirmId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-auto p-1.5 text-muted-foreground hover:text-primary"
                                                        onClick={() => setEditClaim(claim)}
                                                    >
                                                        <PencilSimpleIcon size={16}/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-auto p-1.5 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteConfirmId(claim.id)}
                                                    >
                                                        <TrashIcon size={16}/>
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1} to{" "}
                            {Math.min(startIndex + itemsPerPage, sortedClaims.length)} of{" "}
                            {sortedClaims.length} claims
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className={
                                            currentPage === 1
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(pageNum)}
                                                isActive={currentPage === pageNum}
                                                className="cursor-pointer"
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className={
                                            currentPage === totalPages
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>

            {/* Add/Edit Claim Modals */}
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
                    await updateClaimMutation.mutateAsync({id, request});
                }}
            />

            {/* Import Confirm AlertDialog */}
            <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3">
                            <WarningIcon size={24} className="text-warning" weight="bold"/>
                            Import Claims
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will <strong className="text-destructive">overwrite</strong>{" "}
                            all your current kakera claims with the{" "}
                            {pendingImportData?.length || 0} claims from the file. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowImportConfirm(false);
                                setPendingImportData(null);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                if (pendingImportData) {
                                    importClaimsMutation.mutate(pendingImportData);
                                }
                            }}
                            disabled={importClaimsMutation.isPending}
                        >
                            {importClaimsMutation.isPending ? "Importing..." : "Import"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Wipe Confirm AlertDialog */}
            <AlertDialog open={showWipeConfirm} onOpenChange={setShowWipeConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3">
                            <WarningIcon size={24} className="text-destructive" weight="bold"/>
                            Wipe All Claims
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all {claims?.length || 0} of your
                            kakera claims. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowWipeConfirm(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => wipeClaimsMutation.mutate()}
                            disabled={wipeClaimsMutation.isPending}
                        >
                            {wipeClaimsMutation.isPending ? "Deleting..." : "Wipe All"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Import Dialog */}
            <Dialog open={showBulkImportModal} onOpenChange={setShowBulkImportModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <FileTextIcon size={24} className="text-primary" weight="bold"/>
                            Bulk Import from Discord
                        </DialogTitle>
                        <DialogDescription>
                            Paste your Discord kakera log data below. The parser will
                            automatically extract kakera claims.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="character-name" className="mb-2">
                                Character Name (optional)
                            </Label>
                            <Input
                                id="character-name"
                                type="text"
                                value={bulkImportCharacterName}
                                onChange={(e) => setBulkImportCharacterName(e.target.value)}
                                placeholder="e.g., iamshiron"
                                className="h-9"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                If provided, all claims will be associated with this character.
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="log-data" className="mb-2">
                                Log Data
                            </Label>
                            <Textarea
                                id="log-data"
                                value={bulkImportData}
                                onChange={(e) => setBulkImportData(e.target.value)}
                                placeholder={`Paste Discord log here, e.g.:
Logan Yarborough
APP
 — 10/22/2025 7:06 PM
:kakera:iamshiron +121 ($k)`}
                                rows={10}
                                className="font-mono text-sm resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowBulkImportModal(false);
                                setBulkImportData("");
                                setBulkImportCharacterName("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => bulkImportMutation.mutate()}
                            disabled={bulkImportMutation.isPending || !bulkImportData.trim()}
                        >
                            {bulkImportMutation.isPending ? "Importing..." : "Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

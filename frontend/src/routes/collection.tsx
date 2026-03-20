import {
	CaretDown,
	Download,
	FolderOpen,
	Funnel,
	Images,
	Key,
	ListBullets,
	MagnifyingGlass,
	Pencil,
	SignIn,
	SortAscending,
	Trash,
	Upload,
	X,
} from "@phosphor-icons/react";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useEffect, useState } from "react";
import { ImportModal } from "@/components/collection/ImportModal";
import { SeriesImportModal } from "@/components/collection/SeriesImportModal";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { collectionApi } from "@/lib/api";
import type { CollectionEntry, CollectionExportRequest } from "@/types";

export const Route = createFileRoute("/collection")({
	component: CollectionPage,
});

function useDebouncedValue<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}

const CharacterCard = memo(function CharacterCard({
	entry,
	onEdit,
	onDelete,
}: {
	entry: CollectionEntry;
	onEdit: (entry: CollectionEntry) => void;
	onDelete: (entry: CollectionEntry) => void;
}) {
	const character = entry.character;
	const keyColors: Record<string, string> = {
		bronzekey: "text-warning",
		silverkey: "text-muted-foreground",
		goldkey: "text-warning",
		chaoskey: "text-chart-3",
		rubykey: "text-destructive",
		emeraldkey: "text-success",
		sapphirekey: "text-info",
	};

	const imageSrc = character.storedImageId
		? `/api/collection/images/${character.storedImageId}`
		: character.imageUrl;

	const isDisabled = entry.isDisabled;

	return (
		<div
			className={`glass rounded-lg p-4 lantern-top hover:shadow-lg transition-all group relative ${isDisabled ? "ring-2 ring-destructive/50 bg-destructive/5" : ""}`}
		>
			{isDisabled && (
				<Badge variant="destructive" className="absolute top-2 right-2 z-10">
					Disabled
				</Badge>
			)}
			<div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={character.name}
						className={`w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform ${isDisabled ? "opacity-60" : ""}`}
						loading="lazy"
					/>
				) : (
					<span className="text-muted-foreground/70 text-4xl">?</span>
				)}
			</div>
			<div className="flex items-start justify-between gap-2">
				<h3
					className={`font-semibold truncate ${isDisabled ? "text-destructive" : ""}`}
					title={character.name}
				>
					{character.name}
				</h3>
				{character.keyType && (
					<div className="flex items-center gap-0.5 shrink-0">
						<Key
							size={16}
							className={
								keyColors[character.keyType] || "text-muted-foreground/70"
							}
							weight="fill"
						/>
						{character.keyCount && (
							<span
								className={`text-xs ${keyColors[character.keyType] || "text-muted-foreground/70"}`}
							>
								×{character.keyCount}
							</span>
						)}
					</div>
				)}
			</div>
			{character.seriesName && (
				<p
					className="text-xs text-muted-foreground/70 truncate"
					title={character.seriesName}
				>
					{character.seriesName}
				</p>
			)}
			<div className="flex items-center justify-between mt-2 text-sm">
				<span className="text-muted-foreground">#{character.rank ?? "?"}</span>
				<div className="flex items-center gap-2">
					{character.sp && (
						<span className="text-info">
							{character.sp.toLocaleString()} sp
						</span>
					)}
					<span className="text-primary">
						{character.kakera?.toLocaleString() ?? "?"} ka
					</span>
				</div>
			</div>
			{character.claims !== null && (
				<p className="text-xs text-muted-foreground/70 mt-1">
					{character.claims} claims
					{character.images !== null && ` · ${character.images} img`}
					{character.gifs !== null && ` + ${character.gifs} gif`}
				</p>
			)}

			{character.kakeraStats && character.kakeraStats.totalValue > 0 && (
				<div className="relative mt-2 pt-2 border-t border-border/50">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">User Kakera</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="flex items-center gap-1 cursor-default hover:text-primary transition-colors font-bold text-primary">
									<span>
										{character.kakeraStats.totalValue.toLocaleString()}
									</span>
									<CaretDown size={12} weight="bold" className="opacity-50" />
								</span>
							</TooltipTrigger>
							<TooltipContent side="top" className="glass p-2.5 min-w-[140px]">
								<p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 border-b border-border/30 pb-1 font-bold text-center">
									Breakdown
								</p>
								<div className="space-y-1">
									{Object.entries(character.kakeraStats.byType).map(
										([type, value]) => (
											<div
												key={type}
												className="flex justify-between items-center gap-4"
											>
												<span className="capitalize text-[11px]">{type}</span>
												<span className="font-mono text-primary font-bold text-[11px]">
													{value.toLocaleString()}
												</span>
											</div>
										),
									)}
								</div>
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			)}

			<div className="flex gap-2 mt-3 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onEdit(entry)}
					className="flex-1"
				>
					<Pencil size={14} />
					Edit
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => onDelete(entry)}
					className="flex-1"
				>
					<Trash size={14} />
					Remove
				</Button>
			</div>
		</div>
	);
});

function ExportModal({
	isOpen,
	onClose,
	onExport,
}: {
	isOpen: boolean;
	onClose: () => void;
	onExport: (request: CollectionExportRequest) => Promise<void>;
}) {
	const [minKeys, setMinKeys] = useState<number | "">("");
	const [sortBy, setSortBy] =
		useState<CollectionExportRequest["sortBy"]>("kakera");
	const [sortOrder, setSortOrder] =
		useState<CollectionExportRequest["sortOrder"]>("desc");
	const [limit, setLimit] = useState<number | "">("");
	const [excludeDisabled, setExcludeDisabled] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			await onExport({
				minKeys: minKeys === "" ? undefined : minKeys,
				sortBy,
				sortOrder,
				limit: limit === "" ? undefined : limit,
				excludeDisabled,
			});
			onClose();
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Export Collection</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label htmlFor="minKeys" className="mb-1">
							Minimum Keys
						</Label>
						<Input
							id="minKeys"
							type="number"
							value={minKeys}
							onChange={(e) =>
								setMinKeys(e.target.value === "" ? "" : Number(e.target.value))
							}
							placeholder="Any"
							min={0}
							className="h-9"
						/>
					</div>

					<div>
						<Label htmlFor="sortBy" className="mb-1">
							Sort By
						</Label>
						<Select
							value={sortBy}
							onValueChange={(value) =>
								setSortBy(value as CollectionExportRequest["sortBy"])
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="kakera">Kakera Value</SelectItem>
								<SelectItem value="keyCount">Key Count</SelectItem>
								<SelectItem value="sp">Spheres</SelectItem>
								<SelectItem value="name">Name</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="sortOrder" className="mb-1">
							Sort Order
						</Label>
						<Select
							value={sortOrder}
							onValueChange={(value) =>
								setSortOrder(value as CollectionExportRequest["sortOrder"])
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="desc">Descending</SelectItem>
								<SelectItem value="asc">Ascending</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="limitResults" className="mb-1">
							Limit Results
						</Label>
						<Input
							id="limitResults"
							type="number"
							value={limit}
							onChange={(e) =>
								setLimit(e.target.value === "" ? "" : Number(e.target.value))
							}
							placeholder="All"
							min={1}
							className="h-9"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="exclude-disabled"
							checked={excludeDisabled}
							onCheckedChange={(checked) =>
								setExcludeDisabled(checked as boolean)
							}
						/>
						<Label htmlFor="exclude-disabled">
							Exclude disabled characters
						</Label>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={handleExport}
						disabled={isExporting}
						className="h-9 px-4 text-sm"
					>
						<Download size={18} />
						{isExporting ? "Exporting..." : "Export JSON"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EditModal({
	entry,
	isOpen,
	onClose,
	onSave,
}: {
	entry: CollectionEntry | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		id: string,
		data: { notes?: string; keyCount?: number },
	) => Promise<void>;
}) {
	const [notes, setNotes] = useState("");
	const [keyCount, setKeyCount] = useState<number | "">("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (entry) {
			setNotes(entry.notes || "");
			setKeyCount(entry.character.keyCount ?? "");
		}
	}, [entry]);

	const handleSave = async () => {
		if (!entry) return;
		setIsSaving(true);
		try {
			await onSave(entry.id, {
				notes: notes || undefined,
				keyCount: keyCount === "" ? undefined : keyCount,
			});
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Character</DialogTitle>
					<DialogDescription>{entry?.character.name}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label htmlFor="edit-key-count" className="mb-1">
							Key Count
						</Label>
						<Input
							id="edit-key-count"
							type="number"
							value={keyCount}
							onChange={(e) =>
								setKeyCount(e.target.value === "" ? "" : Number(e.target.value))
							}
							min={0}
							placeholder="0"
							className="h-9"
						/>
						<p className="text-xs text-muted-foreground/70 mt-1">
							Key type is automatically determined: Bronze (1-2), Silver (3-5),
							Gold (6-9), Chaos (10+)
						</p>
					</div>

					<div>
						<Label htmlFor="edit-notes" className="mb-1">
							Notes
						</Label>
						<Textarea
							id="edit-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Add notes about this character..."
							rows={4}
							className="resize-none"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DeleteConfirmModal({
	entry,
	isOpen,
	onClose,
	onConfirm,
}: {
	entry: CollectionEntry | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (id: string) => Promise<void>;
}) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = async () => {
		if (!entry) return;
		setIsDeleting(true);
		try {
			await onConfirm(entry.id);
			onClose();
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove Character</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to remove{" "}
						<span className="text-foreground font-semibold">
							{entry?.character.name}
						</span>{" "}
						from your collection?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
						{isDeleting ? "Removing..." : "Remove"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const KEY_TYPE_CONFIG: Record<
	string,
	{ label: string; color: string; bgColor: string }
> = {
	bronzekey: {
		label: "Bronze",
		color: "text-amber-600",
		bgColor: "bg-amber-600/10 border-amber-600/30",
	},
	silverkey: {
		label: "Silver",
		color: "text-slate-400",
		bgColor: "bg-slate-400/10 border-slate-400/30",
	},
	goldkey: {
		label: "Gold",
		color: "text-yellow-500",
		bgColor: "bg-yellow-500/10 border-yellow-500/30",
	},
	chaoskey: {
		label: "Chaos",
		color: "text-purple-500",
		bgColor: "bg-purple-500/10 border-purple-500/30",
	},
	rubykey: {
		label: "Ruby",
		color: "text-rose-500",
		bgColor: "bg-rose-500/10 border-rose-500/30",
	},
	emeraldkey: {
		label: "Emerald",
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10 border-emerald-500/30",
	},
	sapphirekey: {
		label: "Sapphire",
		color: "text-sky-500",
		bgColor: "bg-sky-500/10 border-sky-500/30",
	},
};

function CollectionPage() {
	const [showImport, setShowImport] = useState(false);
	const [showExport, setShowExport] = useState(false);
	const [showSeriesImport, setShowSeriesImport] = useState(false);
	const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(
		null,
	);
	const [deletingEntry, setDeletingEntry] = useState<CollectionEntry | null>(
		null,
	);
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState("rank");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [minKeys, setMinKeys] = useState(0);
	const [minKakera, setMinKakera] = useState(0);
	const [disabledFilter, setDisabledFilter] = useState<
		"all" | "disabled" | "enabled"
	>("all");
	const [selectedKeyTypes, setSelectedKeyTypes] = useState<string[]>([]);
	const queryClient = useQueryClient();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();

	const debouncedSearch = useDebouncedValue(search, 300);

	const hasActiveFilters =
		minKeys > 0 ||
		minKakera > 0 ||
		disabledFilter !== "all" ||
		selectedKeyTypes.length > 0;

	const clearAllFilters = () => {
		setMinKeys(0);
		setMinKakera(0);
		setDisabledFilter("all");
		setSelectedKeyTypes([]);
	};

	const toggleKeyType = (keyType: string) => {
		setSelectedKeyTypes((prev) =>
			prev.includes(keyType)
				? prev.filter((k) => k !== keyType)
				: [...prev, keyType],
		);
	};

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, minKeys, minKakera, disabledFilter, selectedKeyTypes]);

	const { data, isLoading, error } = useQuery({
		queryKey: [
			"collection",
			{
				search: debouncedSearch,
				sortBy,
				sortOrder,
				page,
				minKeys: minKeys || undefined,
				minKakera: minKakera || undefined,
				isDisabled:
					disabledFilter === "all" ? undefined : disabledFilter === "disabled",
			},
		],
		queryFn: () =>
			collectionApi.get({
				search: debouncedSearch,
				sortBy,
				sortOrder,
				page,
				pageSize: 60,
				minKeys: minKeys || undefined,
				minKakera: minKakera || undefined,
				isDisabled:
					disabledFilter === "all" ? undefined : disabledFilter === "disabled",
			}),
		enabled: isAuthenticated,
		placeholderData: keepPreviousData,
	});

	const { data: stats } = useQuery({
		queryKey: ["collection-stats"],
		queryFn: () => collectionApi.getStats(),
		enabled: isAuthenticated,
	});

	const { data: imageStatus, refetch: refetchImageStatus } = useQuery({
		queryKey: ["image-status"],
		queryFn: () => collectionApi.getImageStatus(),
		enabled: isAuthenticated,
		refetchInterval: (query) => {
			const d = query.state.data;
			return d && d.pending > 0 ? 5000 : false;
		},
	});

	const importMutation = useMutation({
		mutationFn: ({
			data,
			disabledCharacters,
		}: {
			data: string;
			disabledCharacters?: string;
		}) => collectionApi.import(data, disabledCharacters),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collection"] });
			queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
			refetchImageStatus();
		},
	});

	const clearMutation = useMutation({
		mutationFn: collectionApi.clear,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collection"] });
			queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
		},
	});

	const processImagesMutation = useMutation({
		mutationFn: collectionApi.processImages,
		onSuccess: () => {
			refetchImageStatus();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			...data
		}: {
			id: string;
			notes?: string;
			keyCount?: number;
		}) => collectionApi.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collection"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => collectionApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collection"] });
			queryClient.invalidateQueries({ queryKey: ["collection-stats"] });
		},
	});

	const importSeriesMutation = useMutation({
		mutationFn: (data: string) => collectionApi.importSeries(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collection"] });
		},
	});

	const handleExport = async (request: CollectionExportRequest) => {
		const data = await collectionApi.export(request);
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "collection-export.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<FolderOpen size={48} className="text-muted-foreground/70 mb-4" />
				<h2 className="text-xl font-semibold mb-2">Login Required</h2>
				<p className="text-muted-foreground mb-4">
					Please login to view your collection
				</p>
				<Button
					onClick={() => navigate({ to: "/" })}
					className="h-9 px-6 text-sm"
				>
					<SignIn size={20} weight="bold" />
					Login with Discord
				</Button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<p className="text-destructive mb-4">Failed to load collection</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Collection</h1>
						{stats && (
							<div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
								<span>{stats.totalCharacters.toLocaleString()} characters</span>
								<span className="text-border">·</span>
								<span>
									{stats.disabledCount?.toLocaleString() ?? 0} disabled
								</span>
								<span className="text-border">·</span>
								<span className="text-primary font-medium">
									{stats.totalKakera.toLocaleString()} ka
								</span>
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowExport(true)}
						>
							<Download size={16} />
							Export
						</Button>
						{imageStatus &&
							imageStatus.pending === 0 &&
							imageStatus.stored < imageStatus.total && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => processImagesMutation.mutate()}
									disabled={processImagesMutation.isPending}
								>
									<Images size={16} />
									{processImagesMutation.isPending
										? "Caching..."
										: "Cache Images"}
								</Button>
							)}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowSeriesImport(true)}
						>
							<ListBullets size={16} />
							Series
						</Button>
						<Button size="sm" onClick={() => setShowImport(true)}>
							<Upload size={16} />
							Import
						</Button>
					</div>
				</div>

				{stats && Object.keys(stats.keyDistribution).length > 0 && (
					<div className="flex gap-2 flex-wrap">
						{Object.entries(stats.keyDistribution).map(([key, count]) => {
							const config = KEY_TYPE_CONFIG[key] || {
								label: key.replace("key", ""),
								color: "text-muted-foreground",
								bgColor: "bg-muted/50",
							};
							const isSelected = selectedKeyTypes.includes(key);
							return (
								<button
									key={key}
									onClick={() => toggleKeyType(key)}
									className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
										isSelected
											? `${config.bgColor} ${config.color} ring-1 ring-current/20`
											: "bg-muted/30 text-muted-foreground hover:bg-muted/50"
									}`}
								>
									<Key size={12} weight="fill" className={config.color} />
									<span>{config.label}</span>
									<span className="opacity-60">{count}</span>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{imageStatus &&
				(imageStatus.pending > 0 || imageStatus.processing > 0) && (
					<div className="glass rounded-lg px-4 py-3 flex items-center gap-3">
						<Spinner className="size-4 text-primary" />
						<span className="text-sm">
							Processing images: {imageStatus.stored}/{imageStatus.total} cached
							{imageStatus.pending > 0 && ` · ${imageStatus.pending} pending`}
						</span>
					</div>
				)}

			{imageStatus && imageStatus.failed > 0 && (
				<div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
					{imageStatus.failed} images failed to download
				</div>
			)}

			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<MagnifyingGlass
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70"
						size={18}
					/>
					<Input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name or series..."
						className="h-10 pl-10 pr-4"
					/>
				</div>

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className="h-10 w-10 relative"
						>
							<Funnel size={18} />
							{hasActiveFilters && (
								<span className="absolute -top-1 -right-1 size-3 bg-primary rounded-full" />
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80" align="end">
						<div className="space-y-5">
							<div>
								<h4 className="text-sm font-medium mb-3">Filters</h4>
								<div className="space-y-4">
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-xs text-muted-foreground">
												Minimum Keys
											</Label>
											<span className="text-xs font-mono text-primary">
												{minKeys}+
											</span>
										</div>
										<Slider
											value={[minKeys]}
											onValueChange={([v]) => setMinKeys(v)}
											min={0}
											max={20}
											step={1}
											className="py-2"
										/>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-xs text-muted-foreground">
												Minimum Kakera
											</Label>
											<span className="text-xs font-mono text-primary">
												{minKakera.toLocaleString()}+
											</span>
										</div>
										<Slider
											value={[minKakera]}
											onValueChange={([v]) => setMinKakera(v)}
											min={0}
											max={10000}
											step={100}
											className="py-2"
										/>
									</div>

									<Separator />

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Status
										</Label>
										<div className="flex gap-1.5">
											{(["all", "enabled", "disabled"] as const).map(
												(status) => (
													<Button
														key={status}
														variant={
															disabledFilter === status ? "default" : "outline"
														}
														size="sm"
														onClick={() => setDisabledFilter(status)}
														className="flex-1 text-xs capitalize"
													>
														{status}
													</Button>
												),
											)}
										</div>
									</div>
								</div>
							</div>

							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearAllFilters}
									className="w-full text-destructive hover:text-destructive"
								>
									<X size={14} />
									Clear all filters
								</Button>
							)}
						</div>
					</PopoverContent>
				</Popover>

				<Select value={sortBy} onValueChange={setSortBy}>
					<SelectTrigger className="h-10! w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="rank">Rank</SelectItem>
						<SelectItem value="name">Name</SelectItem>
						<SelectItem value="kakera">Kakera</SelectItem>
						<SelectItem value="user_kakera">Best Performing</SelectItem>
						<SelectItem value="claims">Claims</SelectItem>
						<SelectItem value="keys">Keys</SelectItem>
					</SelectContent>
				</Select>

				<Button
					variant="outline"
					size="icon"
					className="h-10 w-10"
					onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
				>
					<SortAscending
						size={18}
						className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
					/>
				</Button>
			</div>

			{hasActiveFilters && (
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs text-muted-foreground">Active filters:</span>
					{minKeys > 0 && (
						<Badge variant="secondary" className="gap-1 pr-1">
							{minKeys}+ keys
							<Button
								onClick={() => setMinKeys(0)}
								className="ml-1 hover:bg-background/50 rounded-sm p-0.5"
							>
								<XIcon size={10} />
							</Button>
						</Badge>
					)}
					{minKakera > 0 && (
						<Badge variant="secondary" className="gap-1 pr-1">
							{minKakera.toLocaleString()}+ ka
							<button
								onClick={() => setMinKakera(0)}
								className="ml-1 hover:bg-background/50 rounded-sm p-0.5"
							>
								<X size={10} />
							</button>
						</Badge>
					)}
					{disabledFilter !== "all" && (
						<Badge variant="secondary" className="gap-1 pr-1 capitalize">
							{disabledFilter}
							<button
								onClick={() => setDisabledFilter("all")}
								className="ml-1 hover:bg-background/50 rounded-sm p-0.5"
							>
								<X size={10} />
							</button>
						</Badge>
					)}
					{selectedKeyTypes.map((keyType) => {
						const config = KEY_TYPE_CONFIG[keyType];
						return (
							<Badge key={keyType} variant="secondary" className="gap-1 pr-1">
								<Key size={10} weight="fill" className={config?.color} />
								{config?.label ?? keyType}
								<button
									onClick={() => toggleKeyType(keyType)}
									className="ml-1 hover:bg-background/50 rounded-sm p-0.5"
								>
									<X size={10} />
								</button>
							</Badge>
						);
					})}
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllFilters}
						className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
					>
						Clear all
					</Button>
				</div>
			)}

			{!data?.items.length ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<FolderOpen size={48} className="text-muted-foreground/50 mb-4" />
					<h2 className="text-lg font-semibold mb-2">No characters found</h2>
					<p className="text-muted-foreground text-sm mb-6">
						{hasActiveFilters
							? "Try adjusting your filters"
							: "Import your collection from Mudae to get started"}
					</p>
					{hasActiveFilters ? (
						<Button variant="outline" onClick={clearAllFilters}>
							Clear Filters
						</Button>
					) : (
						<Button onClick={() => setShowImport(true)}>
							Import Collection
						</Button>
					)}
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{data.items.map((entry) => (
							<CharacterCard
								key={entry.id}
								entry={entry}
								onEdit={setEditingEntry}
								onDelete={setDeletingEntry}
							/>
						))}
					</div>

					{data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<div className="flex items-center gap-1.5 px-3">
								<span className="text-sm font-medium">{page}</span>
								<span className="text-muted-foreground">/</span>
								<span className="text-sm text-muted-foreground">
									{data.totalPages}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
								disabled={page === data.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			<ImportModal
				isOpen={showImport}
				onClose={() => setShowImport(false)}
				onImport={async (data, disabledCharacters) => {
					return importMutation.mutateAsync({ data, disabledCharacters });
				}}
				onClear={async () => {
					await clearMutation.mutateAsync();
				}}
			/>

			<ExportModal
				isOpen={showExport}
				onClose={() => setShowExport(false)}
				onExport={handleExport}
			/>

			<SeriesImportModal
				isOpen={showSeriesImport}
				onClose={() => setShowSeriesImport(false)}
				onImport={async (data) => {
					return importSeriesMutation.mutateAsync(data);
				}}
			/>

			<EditModal
				entry={editingEntry}
				isOpen={editingEntry !== null}
				onClose={() => setEditingEntry(null)}
				onSave={async (id, data) => {
					await updateMutation.mutateAsync({ id, ...data });
				}}
			/>

			<DeleteConfirmModal
				entry={deletingEntry}
				isOpen={deletingEntry !== null}
				onClose={() => setDeletingEntry(null)}
				onConfirm={async (id) => {
					await deleteMutation.mutateAsync(id);
				}}
			/>
		</div>
	);
}

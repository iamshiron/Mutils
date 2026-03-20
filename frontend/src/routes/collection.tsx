import {
    CaretDown,
    Download,
    FolderOpen,
    Funnel,
    Images,
    Key,
    MagnifyingGlass,
    Pencil,
    SignIn,
    SortAscending,
    Trash,
    Upload,
} from "@phosphor-icons/react";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {memo, useEffect, useState} from "react";
import {ImportModal} from "@/components/collection/ImportModal";
import {useAuth} from "@/hooks/useAuth";
import {collectionApi} from "@/lib/api";
import type {CollectionEntry, CollectionExportRequest} from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {Spinner} from "@/components/ui/spinner";
import {Toggle} from "@/components/ui/toggle";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

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
                                    <span>{character.kakeraStats.totalValue.toLocaleString()}</span>
                                    <CaretDown size={12} weight="bold" className="opacity-50"/>
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
                    <Pencil size={14}/>
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(entry)}
                    className="flex-1"
                >
                    <Trash size={14}/>
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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
                            onCheckedChange={(checked) => setExcludeDisabled(checked as boolean)}
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
                        <Download size={18}/>
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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Character</DialogTitle>
                    <DialogDescription>
                        {entry?.character.name}
                    </DialogDescription>
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
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
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
        <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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

function CollectionPage() {
    const [showImport, setShowImport] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
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
    const [minKeys, setMinKeys] = useState<number | "">("");
    const [minKakera, setMinKakera] = useState<number | "">("");
    const [disabledFilter, setDisabledFilter] = useState<
        "all" | "disabled" | "enabled"
    >("all");
    const queryClient = useQueryClient();
    const {isAuthenticated, isLoading: authLoading} = useAuth();
    const navigate = useNavigate();

    const debouncedSearch = useDebouncedValue(search, 300);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, minKeys, minKakera, disabledFilter]);

    const {data, isLoading, error} = useQuery({
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

    const {data: stats} = useQuery({
        queryKey: ["collection-stats"],
        queryFn: () => collectionApi.getStats(),
        enabled: isAuthenticated,
    });

    const {data: imageStatus, refetch: refetchImageStatus} = useQuery({
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
            queryClient.invalidateQueries({queryKey: ["collection"]});
            queryClient.invalidateQueries({queryKey: ["collection-stats"]});
            refetchImageStatus();
        },
    });

    const clearMutation = useMutation({
        mutationFn: collectionApi.clear,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["collection"]});
            queryClient.invalidateQueries({queryKey: ["collection-stats"]});
        },
    });

    const processImagesMutation = useMutation({
        mutationFn: collectionApi.processImages,
        onSuccess: () => {
            refetchImageStatus();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({id, ...data}: {
            id: string;
            notes?: string;
            keyCount?: number;
        }) => collectionApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["collection"]});
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => collectionApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["collection"]});
            queryClient.invalidateQueries({queryKey: ["collection-stats"]});
        },
    });

    const handleExport = async (request: CollectionExportRequest) => {
        const data = await collectionApi.export(request);
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: "application/json"});
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
                <Spinner className="size-8 text-primary"/>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FolderOpen size={48} className="text-muted-foreground/70 mb-4"/>
                <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                <p className="text-muted-foreground mb-4">
                    Please login to view your collection
                </p>
                <Button
                    onClick={() => navigate({to: "/"})}
                    className="h-9 px-6 text-sm"
                >
                    <SignIn size={20} weight="bold"/>
                    Login with Discord
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner className="size-8 text-primary"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-destructive mb-4">Failed to load collection</p>
                <Button
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">My Collection</h1>
                    {stats && (
                        <p className="text-muted-foreground text-sm mt-1">
                            {stats.totalCharacters} characters ·{" "}{stats.disabledCount} disabled ·{" "}
                            {stats.totalKakera.toLocaleString()} total kakera
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowExport(true)}
                        className="h-9 px-4 text-sm"
                    >
                        <Download size={18}/>
                        Export
                    </Button>
                    {imageStatus &&
                        imageStatus.pending === 0 &&
                        imageStatus.stored < imageStatus.total && (
                            <Button
                                variant="outline"
                                onClick={() => processImagesMutation.mutate()}
                                disabled={processImagesMutation.isPending}
                                className="h-9 px-4 text-sm"
                            >
                                <Images size={18}/>
                                {processImagesMutation.isPending
                                    ? "Starting..."
                                    : "Cache Images"}
                            </Button>
                        )}
                    <Button
                        onClick={() => setShowImport(true)}
                        className="h-9 px-4 text-sm"
                    >
                        <Upload size={18}/>
                        Import
                    </Button>
                </div>
            </div>

            {imageStatus &&
                (imageStatus.pending > 0 || imageStatus.processing > 0) && (
                    <div className="glass rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Spinner className="size-4 text-primary"/>
                            <span className="text-sm">
                                Processing images: {imageStatus.stored}/{imageStatus.total}{" "}
                                cached
                                {imageStatus.pending > 0 && ` · ${imageStatus.pending} pending`}
                            </span>
                        </div>
                    </div>
                )}

            {imageStatus && imageStatus.failed > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6 text-sm text-destructive">
                    {imageStatus.failed} images failed to download
                </div>
            )}

            {stats && Object.keys(stats.keyDistribution).length > 0 && (
                <div className="flex gap-4 mb-6 flex-wrap">
                    {Object.entries(stats.keyDistribution).map(([key, count]) => (
                        <div key={key} className="glass rounded-lg px-3 py-2 text-sm">
                            <span className="text-muted-foreground capitalize">
                                {key.replace("key", "")}:{" "}
                            </span>
                            <span className="font-semibold">{count}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <MagnifyingGlass
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                        size={18}
                    />
                    <Input
                        key="collection-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search characters..."
                        className="h-9 pl-10 pr-4"
                    />
                </div>
                <Toggle
                    variant="outline"
                    pressed={showFilters}
                    onPressedChange={setShowFilters}
                    aria-label="Toggle filters"
                >
                    <Funnel size={16}/>
                </Toggle>
                <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                >
                    <SelectTrigger>
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
                <Toggle
                    variant="outline"
                    pressed={sortOrder === "desc"}
                    onPressedChange={(pressed) => setSortOrder(pressed ? "desc" : "asc")}
                    aria-label="Toggle sort direction"
                >
                    <SortAscending size={16} className={sortOrder === "desc" ? "rotate-180" : ""}/>
                </Toggle>
            </div>

            {showFilters && (
                <div className="glass rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filter-min-keys">
                                Min Keys:
                            </Label>
                            <Input
                                id="filter-min-keys"
                                type="number"
                                value={minKeys}
                                onChange={(e) =>
                                    setMinKeys(
                                        e.target.value === "" ? "" : Number(e.target.value),
                                    )
                                }
                                placeholder="0"
                                min={0}
                                className="w-20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filter-min-kakera">
                                Min Kakera:
                            </Label>
                            <Input
                                id="filter-min-kakera"
                                type="number"
                                value={minKakera}
                                onChange={(e) =>
                                    setMinKakera(
                                        e.target.value === "" ? "" : Number(e.target.value),
                                    )
                                }
                                placeholder="0"
                                min={0}
                                className="w-24"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="filter-disabled">
                                Status:
                            </Label>
                            <Select
                                value={disabledFilter}
                                onValueChange={(value) =>
                                    setDisabledFilter(value as "all" | "disabled" | "enabled")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="disabled">Disabled Only</SelectItem>
                                    <SelectItem value="enabled">Enabled Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(minKeys !== "" ||
                            minKakera !== "" ||
                            disabledFilter !== "all") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setMinKeys("");
                                    setMinKakera("");
                                    setDisabledFilter("all");
                                }}
                                className="text-destructive hover:text-destructive"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {!data?.items.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FolderOpen size={48} className="text-muted-foreground/70 mb-4"/>
                    <h2 className="text-xl font-semibold mb-2">No characters yet</h2>
                    <p className="text-muted-foreground mb-4">
                        Import your collection from Mudae to get started
                    </p>
                    <Button onClick={() => setShowImport(true)}>
                        Import Collection
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-muted-foreground">
                                Page {page} of {data.totalPages}
                            </span>
                            <Button
                                variant="outline"
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
                    return importMutation.mutateAsync({data, disabledCharacters});
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

            <EditModal
                entry={editingEntry}
                isOpen={editingEntry !== null}
                onClose={() => setEditingEntry(null)}
                onSave={async (id, data) => {
                    await updateMutation.mutateAsync({id, ...data});
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

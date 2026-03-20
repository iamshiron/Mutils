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
        bronzekey: "text-amber-600",
        silverkey: "text-gray-400",
        goldkey: "text-yellow-500",
        chaoskey: "text-purple-500",
        rubykey: "text-red-500",
        emeraldkey: "text-emerald-500",
        sapphirekey: "text-blue-500",
    };

    const imageSrc = character.storedImageId
        ? `/api/collection/images/${character.storedImageId}`
        : character.imageUrl;

    const isDisabled = entry.isDisabled;

    return (
        <div
            className={`glass rounded-lg p-4 lantern-top hover:shadow-glow-sakura transition-all group ${isDisabled ? "ring-2 ring-torii-500/50 bg-torii-500/5" : ""}`}
        >
            {isDisabled && (
                <div className="absolute top-2 right-2 z-10">
					<span className="px-2 py-0.5 text-xs font-semibold bg-torii-500/20 text-torii-300 rounded-full border border-torii-500/30">
						Disabled
					</span>
                </div>
            )}
            <div className="aspect-square bg-background-tertiary rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={character.name}
                        className={`w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform ${isDisabled ? "opacity-60" : ""}`}
                        loading="lazy"
                    />
                ) : (
                    <span className="text-foreground-subtle text-4xl">?</span>
                )}
            </div>
            <div className="flex items-start justify-between gap-2">
                <h3
                    className={`font-semibold truncate ${isDisabled ? "text-torii-300" : ""}`}
                    title={character.name}
                >
                    {character.name}
                </h3>
                {character.keyType && (
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Key
                            size={16}
                            className={
                                keyColors[character.keyType] || "text-foreground-subtle"
                            }
                            weight="fill"
                        />
                        {character.keyCount && (
                            <span
                                className={`text-xs ${keyColors[character.keyType] || "text-foreground-subtle"}`}
                            >
								×{character.keyCount}
							</span>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-foreground-muted">#{character.rank ?? "?"}</span>
                <div className="flex items-center gap-2">
                    {character.sp && (
                        <span className="text-blue-400">
							{character.sp.toLocaleString()} sp
						</span>
                    )}
                    <span className="text-sakura-400">
						{character.kakera?.toLocaleString() ?? "?"} ka
					</span>
                </div>
            </div>
            {character.claims !== null && (
                <p className="text-xs text-foreground-subtle mt-1">
                    {character.claims} claims
                    {character.images !== null && ` · ${character.images} img`}
                    {character.gifs !== null && ` + ${character.gifs} gif`}
                </p>
            )}

            {character.kakeraStats && character.kakeraStats.totalValue > 0 && (
                <div className="relative mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-muted">User Kakera</span>
                        <div className="relative group/tooltip">
                            <div className="flex items-center gap-1 cursor-default hover:text-sakura-300 transition-colors font-bold text-sakura-300">
                                <span>{character.kakeraStats.totalValue.toLocaleString()}</span>
                                <CaretDown size={12} weight="bold" className="opacity-50"/>
                            </div>

                            {/* Simple Absolute Tooltip Overlay */}
                            <div
                                className="hidden group-hover/tooltip:block absolute bottom-full right-0 mb-2 z-[100] glass p-2.5 rounded-lg min-w-[140px] shadow-2xl border border-border/50 pointer-events-none">
                                <p className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5 border-b border-border/30 pb-1 font-bold text-center">
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
                                                <span className="font-mono text-sakura-400 font-bold text-[11px]">
													{value.toLocaleString()}
												</span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-3 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-background-tertiary hover:bg-background-secondary rounded transition-colors"
                >
                    <Pencil size={14}/>
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(entry)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-torii-500/20 hover:bg-torii-500/40 text-torii-300 rounded transition-colors"
                >
                    <Trash size={14}/>
                    Remove
                </button>
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Export Collection</h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="minKeys" className="block text-sm text-foreground-muted mb-1">
                            Minimum Keys
                        </label>
                        <input
                            id="minKeys"
                            type="number"
                            value={minKeys}
                            onChange={(e) =>
                                setMinKeys(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder="Any"
                            min={0}
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="sortBy" className="block text-sm text-foreground-muted mb-1">
                            Sort By
                        </label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as CollectionExportRequest["sortBy"])
                            }
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                        >
                            <option value="kakera">Kakera Value</option>
                            <option value="keyCount">Key Count</option>
                            <option value="sp">Spheres</option>
                            <option value="name">Name</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sortOrder" className="block text-sm text-foreground-muted mb-1">
                            Sort Order
                        </label>
                        <select
                            id="sortOrder"
                            value={sortOrder}
                            onChange={(e) =>
                                setSortOrder(
                                    e.target.value as CollectionExportRequest["sortOrder"],
                                )
                            }
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="limitResults" className="block text-sm text-foreground-muted mb-1">
                            Limit Results
                        </label>
                        <input
                            id="limitResults"
                            type="number"
                            value={limit}
                            onChange={(e) =>
                                setLimit(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder="All"
                            min={1}
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="exclude-disabled"
                            checked={excludeDisabled}
                            onChange={(e) => setExcludeDisabled(e.target.checked)}
                            className="w-4 h-4 rounded border-border bg-background-tertiary accent-sakura-500"
                        />
                        <label
                            htmlFor="exclude-disabled"
                            className="text-sm text-foreground-muted"
                        >
                            Exclude disabled characters
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex-1 px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Download size={18}/>
                        {isExporting ? "Exporting..." : "Export JSON"}
                    </button>
                </div>
            </div>
        </div>
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

    if (!isOpen || !entry) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-2">Edit Character</h2>
                <p className="text-foreground-muted text-sm mb-4">
                    {entry.character.name}
                </p>

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="edit-key-count"
                            className="block text-sm text-foreground-muted mb-1"
                        >
                            Key Count
                        </label>
                        <input
                            id="edit-key-count"
                            type="number"
                            value={keyCount}
                            onChange={(e) =>
                                setKeyCount(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            min={0}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                        />
                        <p className="text-xs text-foreground-subtle mt-1">
                            Key type is automatically determined: Bronze (1-2), Silver (3-5),
                            Gold (6-9), Chaos (10+)
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="edit-notes"
                            className="block text-sm text-foreground-muted mb-1"
                        >
                            Notes
                        </label>
                        <textarea
                            id="edit-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this character..."
                            rows={4}
                            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
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

    if (!isOpen || !entry) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass rounded-lg p-6 max-w-sm w-full mx-4">
                <h2 className="text-xl font-bold mb-2">Remove Character</h2>
                <p className="text-foreground-muted mb-4">
                    Are you sure you want to remove{" "}
                    <span className="text-foreground font-semibold">
						{entry.character.name}
					</span>{" "}
                    from your collection?
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-torii-500 text-background font-semibold rounded-lg hover:bg-torii-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
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
                <div className="animate-spin w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full"/>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FolderOpen size={48} className="text-foreground-subtle mb-4"/>
                <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                <p className="text-foreground-muted mb-4">
                    Please login to view your collection
                </p>
                <button
                    type="button"
                    onClick={() => navigate({to: "/"})}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors"
                >
                    <SignIn size={20} weight="bold"/>
                    Login with Discord
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-torii-500 mb-4">Failed to load collection</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-sakura-500 text-background rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">My Collection</h1>
                    {stats && (
                        <p className="text-foreground-muted text-sm mt-1">
                            {stats.totalCharacters} characters ·{" "}{stats.disabledCount} disabled ·{" "}
                            {stats.totalKakera.toLocaleString()} total kakera
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowExport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors"
                    >
                        <Download size={18}/>
                        Export
                    </button>
                    {imageStatus &&
                        imageStatus.pending === 0 &&
                        imageStatus.stored < imageStatus.total && (
                            <button
                                type="button"
                                onClick={() => processImagesMutation.mutate()}
                                disabled={processImagesMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors disabled:opacity-50"
                            >
                                <Images size={18}/>
                                {processImagesMutation.isPending
                                    ? "Starting..."
                                    : "Cache Images"}
                            </button>
                        )}
                    <button
                        type="button"
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors"
                    >
                        <Upload size={18}/>
                        Import
                    </button>
                </div>
            </div>

            {imageStatus &&
                (imageStatus.pending > 0 || imageStatus.processing > 0) && (
                    <div className="glass rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin w-4 h-4 border-2 border-sakura-500 border-t-transparent rounded-full"/>
                            <span className="text-sm">
								Processing images: {imageStatus.stored}/{imageStatus.total}{" "}
                                cached
                                {imageStatus.pending > 0 && ` · ${imageStatus.pending} pending`}
							</span>
                        </div>
                    </div>
                )}

            {imageStatus && imageStatus.failed > 0 && (
                <div className="bg-torii-500/10 border border-torii-500/30 rounded-lg px-4 py-3 mb-6 text-sm text-torii-300">
                    {imageStatus.failed} images failed to download
                </div>
            )}

            {stats && Object.keys(stats.keyDistribution).length > 0 && (
                <div className="flex gap-4 mb-6 flex-wrap">
                    {Object.entries(stats.keyDistribution).map(([key, count]) => (
                        <div key={key} className="glass rounded-lg px-3 py-2 text-sm">
							<span className="text-foreground-muted capitalize">
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
                        size={18}
                    />
                    <input
                        key="collection-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search characters..."
                        className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 focus:ring-1 focus:ring-sakura-500 outline-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 border rounded-lg transition-colors ${showFilters ? "bg-sakura-500/20 border-sakura-500 text-sakura-400" : "bg-background-tertiary border-border hover:border-sakura-500"}`}
                    title="Filters"
                >
                    <Funnel size={20}/>
                </button>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
                >
                    <option value="rank">Rank</option>
                    <option value="name">Name</option>
                    <option value="kakera">Kakera</option>
                    <option value="user_kakera">Best Performing</option>
                    <option value="claims">Claims</option>
                    <option value="keys">Keys</option>
                </select>
                <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className={`p-2 bg-background-tertiary border border-border rounded-lg hover:border-sakura-500 transition-colors ${sortOrder === "desc" ? "rotate-180" : ""}`}
                >
                    <SortAscending size={20}/>
                </button>
            </div>

            {showFilters && (
                <div className="glass rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="filter-min-keys"
                                className="text-sm text-foreground-muted"
                            >
                                Min Keys:
                            </label>
                            <input
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
                                className="w-20 px-2 py-1 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="filter-min-kakera"
                                className="text-sm text-foreground-muted"
                            >
                                Min Kakera:
                            </label>
                            <input
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
                                className="w-24 px-2 py-1 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="filter-disabled"
                                className="text-sm text-foreground-muted"
                            >
                                Status:
                            </label>
                            <select
                                id="filter-disabled"
                                value={disabledFilter}
                                onChange={(e) =>
                                    setDisabledFilter(
                                        e.target.value as "all" | "disabled" | "enabled",
                                    )
                                }
                                className="px-3 py-1 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none text-sm"
                            >
                                <option value="all">All</option>
                                <option value="disabled">Disabled Only</option>
                                <option value="enabled">Enabled Only</option>
                            </select>
                        </div>
                        {(minKeys !== "" ||
                            minKakera !== "" ||
                            disabledFilter !== "all") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMinKeys("");
                                    setMinKakera("");
                                    setDisabledFilter("all");
                                }}
                                className="text-sm text-torii-400 hover:text-torii-300 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!data?.items.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FolderOpen size={48} className="text-foreground-subtle mb-4"/>
                    <h2 className="text-xl font-semibold mb-2">No characters yet</h2>
                    <p className="text-foreground-muted mb-4">
                        Import your collection from Mudae to get started
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowImport(true)}
                        className="px-4 py-2 bg-sakura-500 text-background rounded-lg hover:bg-sakura-300 transition-colors"
                    >
                        Import Collection
                    </button>
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
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-background-tertiary rounded-lg disabled:opacity-50 hover:bg-background-secondary transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-foreground-muted">
								Page {page} of {data.totalPages}
							</span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                                className="px-4 py-2 bg-background-tertiary rounded-lg disabled:opacity-50 hover:bg-background-secondary transition-colors"
                            >
                                Next
                            </button>
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

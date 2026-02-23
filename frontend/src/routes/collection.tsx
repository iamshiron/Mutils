import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	useQuery,
	useMutation,
	useQueryClient,
	keepPreviousData,
} from "@tanstack/react-query";
import { useState, useEffect, memo } from "react";
import {
	FolderOpen,
	Upload,
	Key,
	SortAscending,
	MagnifyingGlass,
	SignIn,
	Images,
} from "@phosphor-icons/react";
import { collectionApi } from "@/lib/api";
import { ImportModal } from "@/components/collection/ImportModal";
import { useAuth } from "@/hooks/useAuth";
import type { Character } from "@/types";

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
	character,
}: {
	character: Character;
}) {
	const keyColors: Record<string, string> = {
		bronzekey: "text-amber-600",
		silverkey: "text-gray-400",
		goldkey: "text-yellow-500",
		rubykey: "text-red-500",
		emeraldkey: "text-emerald-500",
		sapphirekey: "text-blue-500",
	};

	const imageSrc = character.storedImageId
		? `/api/collection/images/${character.storedImageId}`
		: character.imageUrl;

	return (
		<div className="glass rounded-lg p-4 lantern-top hover:shadow-glow-sakura transition-all group">
			<div className="aspect-square bg-background-tertiary rounded-md mb-3 flex items-center justify-center overflow-hidden">
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={character.name}
						className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
						loading="lazy"
					/>
				) : (
					<span className="text-foreground-subtle text-4xl">?</span>
				)}
			</div>
			<div className="flex items-start justify-between gap-2">
				<h3 className="font-semibold truncate" title={character.name}>
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
		</div>
	);
});

function CollectionPage() {
	const [showImport, setShowImport] = useState(false);
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState("rank");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const queryClient = useQueryClient();
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();

	const debouncedSearch = useDebouncedValue(search, 300);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch]);

	const { data, isLoading, error } = useQuery({
		queryKey: [
			"collection",
			{ search: debouncedSearch, sortBy, sortOrder, page },
		],
		queryFn: () =>
			collectionApi.get({
				search: debouncedSearch,
				sortBy,
				sortOrder,
				page,
				pageSize: 60,
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
		mutationFn: collectionApi.import,
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

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="animate-spin w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<FolderOpen size={48} className="text-foreground-subtle mb-4" />
				<h2 className="text-xl font-semibold mb-2">Login Required</h2>
				<p className="text-foreground-muted mb-4">
					Please login to view your collection
				</p>
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="inline-flex items-center gap-2 px-6 py-3 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors"
				>
					<SignIn size={20} weight="bold" />
					Login with Discord
				</button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="animate-spin w-8 h-8 border-2 border-sakura-500 border-t-transparent rounded-full" />
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
							{stats.totalCharacters} characters ·{" "}
							{stats.totalKakera.toLocaleString()} total kakera
						</p>
					)}
				</div>
				<div className="flex gap-2">
					{imageStatus &&
						imageStatus.pending === 0 &&
						imageStatus.stored < imageStatus.total && (
							<button
								type="button"
								onClick={() => processImagesMutation.mutate()}
								disabled={processImagesMutation.isPending}
								className="flex items-center gap-2 px-4 py-2 bg-background-tertiary text-foreground font-semibold rounded-lg hover:bg-background-secondary transition-colors disabled:opacity-50"
							>
								<Images size={18} />
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
						<Upload size={18} />
						Import
					</button>
				</div>
			</div>

			{imageStatus &&
				(imageStatus.pending > 0 || imageStatus.processing > 0) && (
					<div className="glass rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="animate-spin w-4 h-4 border-2 border-sakura-500 border-t-transparent rounded-full" />
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
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value)}
					className="px-4 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
				>
					<option value="rank">Rank</option>
					<option value="name">Name</option>
					<option value="kakera">Kakera</option>
					<option value="claims">Claims</option>
					<option value="keys">Keys</option>
				</select>
				<button
					type="button"
					onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
					className={`p-2 bg-background-tertiary border border-border rounded-lg hover:border-sakura-500 transition-colors ${sortOrder === "desc" ? "rotate-180" : ""}`}
				>
					<SortAscending size={20} />
				</button>
			</div>

			{!data?.items.length ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<FolderOpen size={48} className="text-foreground-subtle mb-4" />
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
							<CharacterCard key={entry.id} character={entry.character} />
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
				onImport={importMutation.mutateAsync}
				onClear={async () => {
					await clearMutation.mutateAsync();
				}}
			/>
		</div>
	);
}

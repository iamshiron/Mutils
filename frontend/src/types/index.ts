export interface User {
	id: string;
	discordId: string;
	username: string;
	avatarUrl: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface Character {
	id: string;
	name: string;
	rank: number | null;
	claims: number | null;
	images: number | null;
	gifs: number | null;
	seriesCount: number | null;
	keyType: string | null;
	keyCount: number | null;
	kakera: number | null;
	sp: number | null;
	imageUrl: string | null;
	storedImageId: string | null;
	kakeraStats?: CharacterKakeraStats;
}

export interface CharacterKakeraStats {
	totalValue: number;
	totalCount: number;
	byType: Record<string, number>;
}

export interface CollectionEntry {
	id: string;
	character: Character;
	acquiredAt: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export type ListType = "enable" | "disable";

export interface EnableList {
	id: string;
	name: string;
	content: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DisableList {
	id: string;
	name: string;
	content: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ListPreset {
	id: string;
	name: string;
	type: ListType;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: User;
}

export interface ImportResponse {
	imported: number;
	skipped: number;
	updated: number;
	errors: string[];
	imagesQueued: number;
}

export interface CollectionStats {
	totalCharacters: number;
	totalKakera: number;
	keyDistribution: Record<string, number>;
}

export interface OptimizerAnalysis {
	totalCharacters: number;
	totalKakera: number;
	keyDistribution: Record<string, number>;
	recommendations: OptimizerRecommendation[];
}

export interface OptimizerRecommendation {
	type: string;
	series: string;
	reason: string;
	impact: "high" | "medium" | "low";
}

export interface OptimizerSuggestion {
	id: string;
	type: string;
	characters: string[];
	reason: string;
	priority: number;
}

export interface OptimizerSuggestionsResponse {
	suggestions: OptimizerSuggestion[];
}

export interface ApiError {
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
}

export type KakeraType =
	| "purple"
	| "blue"
	| "green"
	| "yellow"
	| "orange"
	| "red"
	| "rainbow"
	| "light"
	| "chaos"
	| "dark"
	| "teal"
	| "bku";

export interface KakeraClaim {
	id: string;
	userId: string;
	characterId: string | null;
	characterName: string | null;
	type: KakeraType;
	value: number;
	isClaimed: boolean;
	claimedAt: string;
}

export interface KakeraStats {
	totalValue: number;
	totalCount: number;
	byType: Record<
		string,
		{
			count: number;
			totalValue: number;
		}
	>;
}

export interface CreateKakeraClaimRequest {
	characterId?: string;
	characterName?: string;
	type: KakeraType;
	value: number;
	isClaimed: boolean;
	claimedAt?: string;
}

export interface UpdateKakeraClaimRequest {
	characterName?: string;
	type: KakeraType;
	value: number;
	isClaimed: boolean;
	claimedAt?: string;
}

export interface KakeraClaimExportItem {
	id: string;
	characterName: string | null;
	type: KakeraType;
	value: number;
	isClaimed: boolean;
	claimedAt: string;
}

export interface CalculatorConfig {
	id: string;
	name: string;
	totalPool: number;
	disabledLimit: number;
	antiDisabled: number;
	silverBadge: number;
	rubyBadge: number;
	bwLevel: number;
	perk2: number;
	perk3: number;
	perk4: number;
	ownedTotal: number;
	ownedDisabled: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCalculatorConfigRequest {
	name: string;
	totalPool: number;
	disabledLimit: number;
	antiDisabled: number;
	silverBadge: number;
	rubyBadge: number;
	bwLevel: number;
	perk2: number;
	perk3: number;
	perk4: number;
	ownedTotal: number;
	ownedDisabled: number;
}

export interface UpdateCalculatorConfigRequest {
	name?: string;
	totalPool?: number;
	disabledLimit?: number;
	antiDisabled?: number;
	silverBadge?: number;
	rubyBadge?: number;
	bwLevel?: number;
	perk2?: number;
	perk3?: number;
	perk4?: number;
	ownedTotal?: number;
	ownedDisabled?: number;
}

export interface BulkKakeraImportRequest {
	data: string;
	characterName?: string;
}

export interface BulkKakeraImportResponse {
	imported: number;
	skipped: number;
	errors: string[];
}

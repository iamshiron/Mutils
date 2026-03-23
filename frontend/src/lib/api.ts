import axios from "axios";
import type {
	ApiError,
	AuthResponse,
	BulkKakeraImportRequest,
	BulkKakeraImportResponse,
	CalculatorConfig,
	CollectionEntry,
	CollectionExportRequest,
	CollectionExportResponse,
	CollectionStats,
	CreateCalculatorConfigRequest,
	CreateKakeraClaimRequest,
	CreateWishlistEntryRequest,
	DisableList,
	EnableList,
	ImportResponse,
	ImportSeriesResponse,
	KakeraClaim,
	KakeraClaimExportItem,
	KakeraStats,
	ListPreset,
	PaginatedResponse,
	UpdateCalculatorConfigRequest,
	UpdateKakeraClaimRequest,
	UpdateProfileRequest,
	UpdateWishlistEntryRequest,
	User,
	UserProfile,
	WishlistEntry,
	WishlistStats,
} from "@/types";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			const refreshToken = localStorage.getItem("refreshToken");
			if (refreshToken) {
				try {
					const { data } = await api.post<AuthResponse>("/auth/refresh", {
						refreshToken,
					});
					localStorage.setItem("accessToken", data.accessToken);
					localStorage.setItem("refreshToken", data.refreshToken);
					originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
					return api(originalRequest);
				} catch {
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refreshToken");
					window.location.href = "/";
				}
			}
		}
		return Promise.reject(error);
	},
);

export const authApi = {
	getDiscordUrl: () => {
		const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
		const redirectUri = `${window.location.origin}/auth/callback`;
		return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
	},

	callback: async (code: string) => {
		const redirectUri = `${window.location.origin}/auth/callback`;
		const { data } = await api.get<AuthResponse>(
			`/auth/callback?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
		);
		return data;
	},

	refresh: async (refreshToken: string) => {
		const { data } = await api.post<AuthResponse>("/auth/refresh", {
			refreshToken,
		});
		return data;
	},

	logout: async () => {
		await api.post("/auth/logout");
	},
};

export const collectionApi = {
	get: async (params?: {
		search?: string;
		sortBy?: string;
		sortOrder?: "asc" | "desc";
		page?: number;
		pageSize?: number;
		minKeys?: number;
		minKakera?: number;
		isDisabled?: boolean;
		keyTypes?: string;
		wishStatus?: "wish" | "starwish" | "inwishlist";
	}) => {
		const { data } = await api.get<PaginatedResponse<CollectionEntry>>(
			"/collection",
			{ params },
		);
		return data;
	},

	getStats: async () => {
		const { data } = await api.get<CollectionStats>("/collection/stats");
		return data;
	},

	import: async (data: string, disabledCharacters?: string) => {
		const response = await api.post<ImportResponse>("/collection/import", {
			data,
			disabledCharacters,
		});
		return response.data;
	},

	clear: async () => {
		const { data } = await api.delete<{ deleted: number }>("/collection/clear");
		return data;
	},

	processImages: async () => {
		const { data } = await api.post<{ queued: number; message: string }>(
			"/collection/process-images",
		);
		return data;
	},

	getImageStatus: async () => {
		const { data } = await api.get<{
			total: number;
			stored: number;
			pending: number;
			processing: number;
			failed: number;
		}>("/collection/image-status");
		return data;
	},

	update: async (id: string, data: { notes?: string; keyCount?: number }) => {
		const { data: response } = await api.put<CollectionEntry>(
			`/collection/${id}`,
			data,
		);
		return response;
	},

	delete: async (id: string) => {
		await api.delete(`/collection/${id}`);
	},

	export: async (request: CollectionExportRequest) => {
		const { data } = await api.post<CollectionExportResponse>(
			"/collection/export",
			request,
		);
		return data;
	},

	importSeries: async (data: string) => {
		const { data: response } = await api.post<ImportSeriesResponse>(
			"/collection/import-series",
			{ data },
		);
		return response;
	},
};

export const listsApi = {
	getEnable: async () => {
		const { data } = await api.get<EnableList[]>("/lists/enable");
		return data;
	},

	createEnable: async (name: string, content: string, isActive = false) => {
		const { data } = await api.post<EnableList>("/lists/enable", {
			name,
			content,
			isActive,
		});
		return data;
	},

	getDisable: async () => {
		const { data } = await api.get<DisableList[]>("/lists/disable");
		return data;
	},

	createDisable: async (name: string, content: string, isActive = false) => {
		const { data } = await api.post<DisableList>("/lists/disable", {
			name,
			content,
			isActive,
		});
		return data;
	},

	update: async (
		type: "enable" | "disable",
		id: string,
		updates: { name?: string; content?: string; isActive?: boolean },
	) => {
		const { data } = await api.put(`/lists/${type}/${id}`, updates);
		return data;
	},

	delete: async (type: "enable" | "disable", id: string) => {
		await api.delete(`/lists/${type}/${id}`);
	},

	getPresets: async (type?: "enable" | "disable") => {
		const { data } = await api.get<ListPreset[]>("/lists/presets", {
			params: { type },
		});
		return data;
	},

	export: async (listId: string, format: "comma" | "newline" | "mudae") => {
		const { data } = await api.post<{
			content: string;
			characterCount: number;
		}>("/lists/export", { listId, format });
		return data;
	},

	getWishlist: async (params?: {
		isStarwish?: boolean;
		search?: string;
		page?: number;
		pageSize?: number;
	}) => {
		const { data } = await api.get<{
			items: WishlistEntry[];
			total: number;
			page: number;
			pageSize: number;
			totalPages: number;
		}>("/lists/wishlist", { params });
		return data;
	},

	getWishlistStats: async () => {
		const { data } = await api.get<WishlistStats>("/lists/wishlist/stats");
		return data;
	},

	addToWishlist: async (request: CreateWishlistEntryRequest) => {
		const { data } = await api.post<WishlistEntry>("/lists/wishlist", request);
		return data;
	},

	updateWishlistEntry: async (
		id: string,
		request: UpdateWishlistEntryRequest,
	) => {
		const { data } = await api.put(`/lists/wishlist/${id}`, request);
		return data;
	},

	removeFromWishlist: async (id: string) => {
		await api.delete(`/lists/wishlist/${id}`);
	},

	toggleStarwish: async (id: string) => {
		const { data } = await api.post<{ isStarwish: boolean }>(
			`/lists/wishlist/toggle-starwish/${id}`,
		);
		return data;
	},
};

export const optimizerApi = {
	analyze: async () => {
		const { data } = await api.post("/optimizer/analyze", {});
		return data;
	},

	getSuggestions: async () => {
		const { data } = await api.get("/optimizer/suggest");
		return data;
	},
};

export const kakeraApi = {
	getClaims: async (params?: { from?: string; to?: string }) => {
		const { data } = await api.get<KakeraClaim[]>("/kakera/claims", { params });
		return data;
	},

	getStats: async () => {
		const { data } = await api.get<KakeraStats>("/kakera/stats");
		return data;
	},

	createClaim: async (request: CreateKakeraClaimRequest) => {
		const { data } = await api.post<KakeraClaim>("/kakera/claims", request);
		return data;
	},

	updateClaim: async (id: string, request: UpdateKakeraClaimRequest) => {
		const { data } = await api.put<KakeraClaim>(
			`/kakera/claims/${id}`,
			request,
		);
		return data;
	},

	deleteClaim: async (id: string) => {
		await api.delete(`/kakera/claims/${id}`);
	},

	exportClaims: async () => {
		const { data } = await api.get<KakeraClaimExportItem[]>("/kakera/export");
		return data;
	},

	importClaims: async (claims: KakeraClaimExportItem[]) => {
		const { data } = await api.post<{ imported: number }>(
			"/kakera/import",
			claims,
		);
		return data;
	},

	wipeClaims: async () => {
		const { data } = await api.delete<{ deleted: number }>("/kakera/claims");
		return data;
	},

	bulkImport: async (request: BulkKakeraImportRequest) => {
		const { data } = await api.post<BulkKakeraImportResponse>(
			"/kakera/bulk-import",
			request,
		);
		return data;
	},
};

export const userApi = {
	getMe: async () => {
		const { data } = await api.get<User>("/user/me");
		return data;
	},
};

export const profileApi = {
	get: async () => {
		const { data } = await api.get<UserProfile>("/profile");
		return data;
	},

	update: async (request: UpdateProfileRequest) => {
		const { data } = await api.put<UserProfile>("/profile", request);
		return data;
	},
};

export const calculatorApi = {
	getAll: async () => {
		const { data } = await api.get<CalculatorConfig[]>("/calculator");
		return data;
	},

	create: async (request: CreateCalculatorConfigRequest) => {
		const { data } = await api.post<CalculatorConfig>("/calculator", request);
		return data;
	},

	update: async (id: string, request: UpdateCalculatorConfigRequest) => {
		const { data } = await api.put<CalculatorConfig>(
			`/calculator/${id}`,
			request,
		);
		return data;
	},

	delete: async (id: string) => {
		await api.delete(`/calculator/${id}`);
	},
};

export type { ApiError };
export default api;

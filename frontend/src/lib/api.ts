import axios from "axios";
import type {
	User,
	CollectionEntry,
	PaginatedResponse,
	EnableList,
	DisableList,
	ListPreset,
	AuthResponse,
	ImportResponse,
	CollectionStats,
	ApiError,
	KakeraClaim,
	KakeraStats,
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

	import: async (data: string) => {
		const response = await api.post<ImportResponse>("/collection/import", {
			data,
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

	update: async (id: string, notes: string) => {
		const { data } = await api.put<CollectionEntry>(`/collection/${id}`, {
			notes,
		});
		return data;
	},

	delete: async (id: string) => {
		await api.delete(`/collection/${id}`);
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

	deleteClaim: async (id: string) => {
		await api.delete(`/kakera/claims/${id}`);
	},
};

export const userApi = {
	getMe: async () => {
		const { data } = await api.get<User>("/user/me");
		return data;
	},
};

export type { ApiError };
export default api;

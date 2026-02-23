import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setIsLoading(false);
	}, []);

	const login = useCallback(async (code: string) => {
		const response = await authApi.callback(code);
		console.log("Auth response:", response);
		localStorage.setItem("accessToken", response.accessToken);
		localStorage.setItem("refreshToken", response.refreshToken);
		localStorage.setItem("user", JSON.stringify(response.user));
		setUser(response.user);
		return response.user;
	}, []);

	const logout = useCallback(async () => {
		try {
			await authApi.logout();
		} catch {
			// Ignore logout errors
		} finally {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			localStorage.removeItem("user");
			setUser(null);
			window.location.href = "/";
		}
	}, []);

	return {
		user,
		isLoading,
		isAuthenticated: !!user,
		login,
		logout,
	};
}

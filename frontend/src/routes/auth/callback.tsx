import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/auth/callback")({
	component: AuthCallbackPage,
	validateSearch: (search: Record<string, unknown>) => ({
		code: search.code as string | undefined,
	}),
});

function AuthCallbackPage() {
	const { code } = Route.useSearch();
	const navigate = useNavigate();
	const { login, isAuthenticated } = useAuth();
	const processedRef = useRef(false);

	useEffect(() => {
		if (!code) {
			navigate({ to: "/" });
			return;
		}

		if (processedRef.current || isAuthenticated) {
			navigate({ to: "/collection" });
			return;
		}

		processedRef.current = true;

		login(code)
			.then((user) => {
				console.log("Auth successful:", user);
				navigate({ to: "/collection" });
			})
			.catch((error) => {
				if (isAuthenticated) {
					navigate({ to: "/collection" });
					return;
				}
				console.error("Auth failed:", error);
				const msg =
					error?.response?.data?.error ||
					(error instanceof Error ? error.message : "Unknown error");
				alert(`Authentication failed: ${msg}`);
				navigate({ to: "/" });
			});
	}, [code, login, navigate, isAuthenticated]);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="text-center">
				<Spinner className="size-8 text-primary mx-auto mb-4" />
				<p className="text-muted-foreground">Completing authentication...</p>
			</div>
		</div>
	);
}

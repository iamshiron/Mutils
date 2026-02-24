import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
	const { user, logout } = useAuth();

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 border-b border-border glass">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<a href="/" className="flex items-center gap-2">
						<span className="text-xl font-bold text-sakura-500">Mutils</span>
					</a>
					<nav className="flex items-center gap-6">
						<a
							href="/collection"
							className="text-foreground-muted hover:text-foreground transition-colors"
						>
							Collection
						</a>
						<a
							href="/lists"
							className="text-foreground-muted hover:text-foreground transition-colors"
						>
							Lists
						</a>
						<a
							href="/optimizer"
							className="text-foreground-muted hover:text-foreground transition-colors"
						>
							Optimizer
						</a>
						<a
							href="/statistics"
							className="text-foreground-muted hover:text-foreground transition-colors"
						>
							Statistics
						</a>
					</nav>
					<div className="flex items-center gap-4">
						{user && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-foreground-muted">
									{user.username}
								</span>
								<button
									type="button"
									onClick={logout}
									className="text-sm text-torii-500 hover:text-torii-300 transition-colors"
								>
									Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</header>
			<main className="container mx-auto px-4 py-6">{children}</main>
		</div>
	);
}

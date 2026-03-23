import { Link } from "@tanstack/react-router";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
	const { user, logout } = useAuth();

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 border-b border-border glass">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<Link to="/" className="flex items-center gap-2">
						<span className="text-xl font-bold text-primary">Mutils</span>
					</Link>
					<nav className="flex items-center gap-1">
						<Button asChild variant="ghost">
							<Link to="/collection">Collection</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/rolls">Rolls</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/calculator">Calculator</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/statistics">Statistics</Link>
						</Button>
						<Button asChild variant="ghost">
							<Link to="/profile">Profile</Link>
						</Button>
					</nav>
					<div className="flex items-center gap-2">
						<ModeToggle />
						{user && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									{user.username}
								</span>
								<Button
									variant="ghost"
									onClick={logout}
									className="text-destructive hover:text-destructive"
								>
									Logout
								</Button>
							</div>
						)}
					</div>
				</div>
			</header>
			<main className="container mx-auto px-4 py-6">{children}</main>
		</div>
	);
}

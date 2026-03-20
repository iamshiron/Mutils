import {useAuth} from "@/hooks/useAuth";
import {Link} from "@tanstack/react-router";

export function AppShell({children}: { children: React.ReactNode }) {
    const {user, logout} = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b border-border glass">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-sakura-500">Mutils</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link
                            to="/collection"
                            className="text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Collection
                        </Link>
                        <Link
                            to="/lists"
                            className="text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Lists
                        </Link>
                        <Link
                            to="/calculator"
                            className="text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Calculator
                        </Link>
                        <Link
                            to="/optimizer"
                            className="text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Optimizer
                        </Link>
                        <Link
                            to="/statistics"
                            className="text-foreground-muted hover:text-foreground transition-colors"
                        >
                            Statistics
                        </Link>
                        <Link
                            to="/profile"
                            className="text-foreground-muted hover:text-foreground transition-colors">
                            Profile
                        </Link>
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

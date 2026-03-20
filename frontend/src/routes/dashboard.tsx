import {createFileRoute, Link} from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass rounded-lg p-6 lantern-top">
                    <h3 className="text-foreground-muted text-sm mb-1">
                        Total Characters
                    </h3>
                    <p className="text-3xl font-bold text-sakura-500">0</p>
                </div>
                <div className="glass rounded-lg p-6 lantern-top">
                    <h3 className="text-foreground-muted text-sm mb-1">Active Lists</h3>
                    <p className="text-3xl font-bold text-sakura-500">0</p>
                </div>
                <div className="glass rounded-lg p-6 lantern-top">
                    <h3 className="text-foreground-muted text-sm mb-1">Unique Series</h3>
                    <p className="text-3xl font-bold text-sakura-500">0</p>
                </div>
            </div>

            <div className="glass rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        to="/collection"
                        className="block p-4 bg-background-tertiary rounded-lg hover:bg-sakura-500/10 transition-colors"
                    >
                        <span className="font-medium">Import Collection</span>
                        <p className="text-sm text-foreground-muted">
                            Add characters from Mudae
                        </p>
                    </Link>
                    <Link
                        to="/lists"
                        className="block p-4 bg-background-tertiary rounded-lg hover:bg-sakura-500/10 transition-colors"
                    >
                        <span className="font-medium">Create List</span>
                        <p className="text-sm text-foreground-muted">
                            Build enable/disable lists
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

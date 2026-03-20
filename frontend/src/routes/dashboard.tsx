import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card className="glass lantern-top">
					<CardContent className="pt-6">
						<h3 className="text-muted-foreground text-sm mb-1">
							Total Characters
						</h3>
						<p className="text-3xl font-bold text-primary">0</p>
					</CardContent>
				</Card>
				<Card className="glass lantern-top">
					<CardContent className="pt-6">
						<h3 className="text-muted-foreground text-sm mb-1">Active Lists</h3>
						<p className="text-3xl font-bold text-primary">0</p>
					</CardContent>
				</Card>
				<Card className="glass lantern-top">
					<CardContent className="pt-6">
						<h3 className="text-muted-foreground text-sm mb-1">Unique Series</h3>
						<p className="text-3xl font-bold text-primary">0</p>
					</CardContent>
				</Card>
			</div>

			<Card className="glass">
				<CardContent className="pt-6">
					<h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Button asChild variant="ghost" className="h-auto p-4 justify-start hover:bg-primary/10">
							<Link to="/collection" className="flex flex-col items-start">
								<span className="font-medium">Import Collection</span>
								<p className="text-sm text-muted-foreground">
									Add characters from Mudae
								</p>
							</Link>
						</Button>
						<Button asChild variant="ghost" className="h-auto p-4 justify-start hover:bg-primary/10">
							<Link to="/lists" className="flex flex-col items-start">
								<span className="font-medium">Create List</span>
								<p className="text-sm text-muted-foreground">
									Build enable/disable lists
								</p>
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

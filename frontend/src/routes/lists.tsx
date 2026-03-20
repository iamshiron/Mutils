import { createFileRoute } from "@tanstack/react-router";
import { ListPlus, ListChecks } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/lists")({
	component: ListsPage,
});

function ListsPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Enable/Disable Lists</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="glass lantern-top">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3 mb-4">
							<ListPlus size={24} className="text-primary" />
							<h2 className="text-xl font-semibold">Enable Lists</h2>
						</div>
						<p className="text-muted-foreground mb-4">
							Characters you want to enable for rolling.
						</p>
						<Button className="w-full">
							Create Enable List
						</Button>
					</CardContent>
				</Card>

				<Card className="glass lantern-top">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3 mb-4">
							<ListChecks size={24} className="text-destructive" />
							<h2 className="text-xl font-semibold">Disable Lists</h2>
						</div>
						<p className="text-muted-foreground mb-4">
							Characters you want to disable from rolling.
						</p>
						<Button variant="destructive" className="w-full">
							Create Disable List
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

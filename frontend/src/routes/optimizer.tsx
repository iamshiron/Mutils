import { createFileRoute } from "@tanstack/react-router";
import { ChartLineUp, Sparkle } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/optimizer")({
	component: OptimizerPage,
});

function OptimizerPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Collection Optimizer</h1>

			<Card className="glass lantern-top mb-6">
				<CardContent className="pt-6">
					<div className="flex items-center gap-3 mb-4">
						<ChartLineUp size={24} className="text-primary" />
						<h2 className="text-xl font-semibold">Analyze Collection</h2>
					</div>
					<p className="text-muted-foreground mb-4">
						Get personalized recommendations based on your current collection and
						goals.
					</p>
					<Button className="h-9 px-4 text-sm shadow-lg hover:shadow-glow-sakura">
						Run Analysis
					</Button>
				</CardContent>
			</Card>

			<Card className="glass">
				<CardContent className="pt-6">
					<div className="flex items-center gap-3 mb-4">
						<Sparkle size={24} className="text-warning" />
						<h2 className="text-xl font-semibold">Suggestions</h2>
					</div>
					<p className="text-muted-foreground">
						Run an analysis to see optimization suggestions for your collection.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

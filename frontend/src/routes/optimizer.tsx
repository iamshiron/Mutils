import { createFileRoute } from "@tanstack/react-router";
import { ChartLineUp, Sparkle } from "@phosphor-icons/react";

export const Route = createFileRoute("/optimizer")({
	component: OptimizerPage,
});

function OptimizerPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Collection Optimizer</h1>

			<div className="glass rounded-lg p-6 lantern-top mb-6">
				<div className="flex items-center gap-3 mb-4">
					<ChartLineUp size={24} className="text-sakura-500" />
					<h2 className="text-xl font-semibold">Analyze Collection</h2>
				</div>
				<p className="text-foreground-muted mb-4">
					Get personalized recommendations based on your current collection and
					goals.
				</p>
				<button
					type="button"
					className="px-6 py-3 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors shadow-lg hover:shadow-glow-sakura"
				>
					Run Analysis
				</button>
			</div>

			<div className="glass rounded-lg p-6">
				<div className="flex items-center gap-3 mb-4">
					<Sparkle size={24} className="text-warning" />
					<h2 className="text-xl font-semibold">Suggestions</h2>
				</div>
				<p className="text-foreground-muted">
					Run an analysis to see optimization suggestions for your collection.
				</p>
			</div>
		</div>
	);
}

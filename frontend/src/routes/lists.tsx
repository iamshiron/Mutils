import { createFileRoute } from "@tanstack/react-router";
import { ListPlus, ListChecks } from "@phosphor-icons/react";

export const Route = createFileRoute("/lists")({
	component: ListsPage,
});

function ListsPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Enable/Disable Lists</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="glass rounded-lg p-6 lantern-top">
					<div className="flex items-center gap-3 mb-4">
						<ListPlus size={24} className="text-sakura-500" />
						<h2 className="text-xl font-semibold">Enable Lists</h2>
					</div>
					<p className="text-foreground-muted mb-4">
						Characters you want to enable for rolling.
					</p>
					<button
						type="button"
						className="w-full px-4 py-2 bg-sakura-500 text-background rounded-lg hover:bg-sakura-300 transition-colors"
					>
						Create Enable List
					</button>
				</div>

				<div className="glass rounded-lg p-6 lantern-top">
					<div className="flex items-center gap-3 mb-4">
						<ListChecks size={24} className="text-torii-500" />
						<h2 className="text-xl font-semibold">Disable Lists</h2>
					</div>
					<p className="text-foreground-muted mb-4">
						Characters you want to disable from rolling.
					</p>
					<button
						type="button"
						className="w-full px-4 py-2 bg-torii-500 text-white rounded-lg hover:bg-torii-300 transition-colors"
					>
						Create Disable List
					</button>
				</div>
			</div>
		</div>
	);
}

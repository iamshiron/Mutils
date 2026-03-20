import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/profile")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<h2 className="text-xl font-semibold mb-4">Kakera Badges</h2>
			<Separator className="mb-4" />
			<div>
			</div>

			<h2 className="text-xl font-semibold mb-4">Tower Levels Badges</h2>
			<Separator className="mb-4" />
			<div>
			</div>
		</div>
	);
}

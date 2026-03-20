import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
	component: () => (
		<TooltipProvider>
			<AppShell>
				<Outlet />
			</AppShell>
		</TooltipProvider>
	),
});

import { SignInIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
	const isConfigured =
		clientId && clientId !== "your_discord_application_id_here";

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold mb-4">
					<span className="text-primary">Mutils</span>
				</h1>
				<p className="text-muted-foreground text-lg max-w-md">
					Optimize your Mudae experience. Track collections, manage lists, and
					maximize your gains.
				</p>
			</div>
			{isConfigured ? (
				<Button
					asChild
					className="h-10 px-6 text-sm shadow-lg hover:shadow-glow-sakura"
				>
					<a href={authApi.getDiscordUrl()}>
						<SignInIcon size={20} weight="bold" />
						Login with Discord
					</a>
				</Button>
			) : (
				<div className="text-center">
					<p className="text-warning mb-4">
						Discord OAuth not configured. Create a{" "}
						<code className="bg-muted px-2 py-1 rounded">.env</code> file in{" "}
						<code className="bg-muted px-2 py-1 rounded">frontend/</code> with:
					</p>
					<pre className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
						{`VITE_DISCORD_CLIENT_ID=your_discord_application_id
VITE_API_URL=http://localhost:5000/api`}
					</pre>
					<p className="text-foreground-subtle text-sm mt-4">
						See{" "}
						<a
							href="/docs/DISCORD_SETUP.md"
							className="text-primary hover:underline"
						>
							Discord Setup Guide
						</a>{" "}
						for instructions.
					</p>
				</div>
			)}
		</div>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@phosphor-icons/react";
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
					<span className="text-sakura-500">Mutils</span>
				</h1>
				<p className="text-foreground-muted text-lg max-w-md">
					Optimize your Mudae experience. Track collections, manage lists, and
					maximize your gains.
				</p>
			</div>
			{isConfigured ? (
				<a
					href={authApi.getDiscordUrl()}
					className="inline-flex items-center gap-2 px-6 py-3 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors shadow-lg hover:shadow-glow-sakura"
				>
					<SignIn size={20} weight="bold" />
					Login with Discord
				</a>
			) : (
				<div className="text-center">
					<p className="text-warning mb-4">
						Discord OAuth not configured. Create a{" "}
						<code className="bg-background-tertiary px-2 py-1 rounded">
							.env
						</code>{" "}
						file in{" "}
						<code className="bg-background-tertiary px-2 py-1 rounded">
							frontend/
						</code>{" "}
						with:
					</p>
					<pre className="bg-background-tertiary p-4 rounded-lg text-sm text-foreground-muted">
						{`VITE_DISCORD_CLIENT_ID=your_discord_application_id
VITE_API_URL=http://localhost:5000/api`}
					</pre>
					<p className="text-foreground-subtle text-sm mt-4">
						See{" "}
						<a
							href="/docs/DISCORD_SETUP.md"
							className="text-sakura-400 hover:underline"
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

import { UploadIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ImportSeriesResponse } from "@/types";

interface SeriesImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (data: string) => Promise<ImportSeriesResponse>;
}

export function SeriesImportModal({
	isOpen,
	onClose,
	onImport,
}: SeriesImportModalProps) {
	const [data, setData] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<ImportSeriesResponse | null>(null);

	const handleImport = async () => {
		if (!data.trim()) return;
		setIsLoading(true);
		try {
			const res = await onImport(data);
			setResult(res);
			if (res.updated > 0) {
				setData("");
			}
		} catch {
			setResult({
				updated: 0,
				notFound: 0,
				notFoundNames: ["Failed to import series data"],
			});
		}
		setIsLoading(false);
	};

	const handleClose = () => {
		setData("");
		setResult(null);
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Import Series</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-auto">
					<p className="text-muted-foreground text-sm mb-2">
						Paste your character series data below.
					</p>
					<p className="text-muted-foreground text-sm mb-4">
						Run{" "}
						<code className="px-1.5 py-0.5 bg-muted rounded text-primary font-mono text-xs">
							$mma+s
						</code>{" "}
						in Discord to get your characters with their series.
					</p>

					<Textarea
						value={data}
						onChange={(e) => setData(e.target.value)}
						placeholder={`Milliela Stanfield - Grisaia no Meikyuu
Bai Winchester - Closers
Amillion - Zenless Zone Zero
Yukimi Sajo - THE iDOLM@STER Cinderella Girls`}
						className="h-48 font-mono text-sm resize-none"
					/>

					{result && (
						<div
							className={`mt-4 p-4 rounded-lg ${result.notFoundNames.length > 0 && result.updated === 0 ? "bg-destructive/10 border border-destructive/30" : "bg-success/10 border border-success/30"}`}
						>
							<div className="flex gap-6 text-sm flex-wrap">
								<span className="text-success">
									Updated: <strong>{result.updated}</strong>
								</span>
								{result.notFound > 0 && (
									<span className="text-warning">
										Not found: <strong>{result.notFound}</strong>
									</span>
								)}
							</div>
							{result.notFoundNames.length > 0 && (
								<div className="mt-2 text-sm text-muted-foreground">
									<p className="text-xs text-muted-foreground/70 mb-1">
										Characters not in collection:
									</p>
									{result.notFoundNames.slice(0, 5).map((name, i) => (
										<p key={i} className="text-warning">
											{name}
										</p>
									))}
									{result.notFoundNames.length > 5 && (
										<p className="text-warning">
											...and {result.notFoundNames.length - 5} more
										</p>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleImport} disabled={isLoading || !data.trim()}>
						<UploadIcon size={18} />
						{isLoading ? "Importing..." : "Import Series"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

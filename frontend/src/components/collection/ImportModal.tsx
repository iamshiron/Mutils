import { useState } from "react";
import { X, Upload, Trash, Warning } from "@phosphor-icons/react";
import type { ImportResponse } from "@/types";

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (data: string) => Promise<ImportResponse>;
	onClear: () => Promise<void>;
}

export function ImportModal({
	isOpen,
	onClose,
	onImport,
	onClear,
}: ImportModalProps) {
	const [data, setData] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<ImportResponse | null>(null);
	const [showClearConfirm, setShowClearConfirm] = useState(false);

	if (!isOpen) return null;

	const handleImport = async () => {
		if (!data.trim()) return;
		setIsLoading(true);
		try {
			const res = await onImport(data);
			setResult(res);
			if (res.imported > 0 || res.updated > 0) {
				setData("");
			}
		} catch (error) {
			setResult({
				imported: 0,
				skipped: 0,
				updated: 0,
				errors: ["Failed to import data"],
				imagesQueued: 0,
			});
		}
		setIsLoading(false);
	};

	const handleClear = async () => {
		setIsLoading(true);
		try {
			await onClear();
			setShowClearConfirm(false);
			setResult({
				imported: 0,
				skipped: 0,
				updated: 0,
				errors: [],
				imagesQueued: 0,
			});
		} catch (error) {
			setResult({
				imported: 0,
				skipped: 0,
				updated: 0,
				errors: ["Failed to clear collection"],
				imagesQueued: 0,
			});
		}
		setIsLoading(false);
	};

	const handleClose = () => {
		setData("");
		setResult(null);
		setShowClearConfirm(false);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="glass rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col lantern-top">
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-xl font-semibold">Import Collection</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-4 flex-1 overflow-auto">
					{!showClearConfirm ? (
						<>
							<p className="text-foreground-muted text-sm mb-2">
								Paste your Mudae collection data below.
							</p>
							<p className="text-foreground-muted text-sm mb-4">
								Run{" "}
								<code className="px-1.5 py-0.5 bg-background-tertiary rounded text-sakura-400 font-mono text-xs">
									$mmy+k=rlz+dx+i-s
								</code>{" "}
								in Discord to get your full list with images.
							</p>

							<textarea
								value={data}
								onChange={(e) => setData(e.target.value)}
								placeholder={`#72 - Gawr Gura => 67 al, 118 img + 12 gif, 14 series · :bronzekey:   (1) 792 ka - https://mudae.net/uploads/...
#117 - Itsuki Nakano => 4 al, 58 img + 3 gif, 5 series 647 ka - https://mudae.net/uploads/...`}
								className="w-full h-48 p-3 bg-background text-foreground rounded-lg border border-border focus:border-sakura-500 focus:ring-1 focus:ring-sakura-500 outline-none resize-none font-mono text-sm"
							/>

							{result && (
								<div
									className={`mt-4 p-4 rounded-lg ${result.errors.length > 0 ? "bg-torii-500/10 border border-torii-500/30" : "bg-success/10 border border-success/30"}`}
								>
									<div className="flex gap-6 text-sm flex-wrap">
										<span className="text-success">
											Imported: <strong>{result.imported}</strong>
										</span>
										<span className="text-warning">
											Updated: <strong>{result.updated}</strong>
										</span>
										<span className="text-foreground-muted">
											Skipped: <strong>{result.skipped}</strong>
										</span>
										{result.imagesQueued > 0 && (
											<span className="text-sakura-400">
												Images queued: <strong>{result.imagesQueued}</strong>
											</span>
										)}
									</div>
									{result.errors.length > 0 && (
										<div className="mt-2 text-sm text-torii-300">
											{result.errors.slice(0, 3).map((err, i) => (
												<p key={i}>{err}</p>
											))}
											{result.errors.length > 3 && (
												<p>...and {result.errors.length - 3} more errors</p>
											)}
										</div>
									)}
								</div>
							)}
						</>
					) : (
						<div className="text-center py-8">
							<Warning size={48} className="text-torii-500 mx-auto mb-4" />
							<h3 className="text-lg font-semibold mb-2">Clear Collection?</h3>
							<p className="text-foreground-muted mb-6">
								This will permanently delete all characters from your
								collection. This action cannot be undone.
							</p>
							<div className="flex gap-4 justify-center">
								<button
									type="button"
									onClick={() => setShowClearConfirm(false)}
									className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleClear}
									disabled={isLoading}
									className="px-4 py-2 bg-torii-500 text-white rounded-lg hover:bg-torii-300 transition-colors disabled:opacity-50"
								>
									{isLoading ? "Clearing..." : "Yes, Clear All"}
								</button>
							</div>
						</div>
					)}
				</div>

				{!showClearConfirm && (
					<div className="flex items-center justify-between p-4 border-t border-border">
						<button
							type="button"
							onClick={() => setShowClearConfirm(true)}
							className="flex items-center gap-2 px-4 py-2 text-torii-500 hover:bg-torii-500/10 rounded-lg transition-colors"
						>
							<Trash size={18} />
							Clear Collection
						</button>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleImport}
								disabled={isLoading || !data.trim()}
								className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors disabled:opacity-50"
							>
								<Upload size={18} />
								{isLoading ? "Importing..." : "Import"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

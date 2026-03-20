import {
	ProhibitIcon,
	TrashIcon,
	UploadIcon,
	WarningIcon,
} from "@phosphor-icons/react";
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
import type { ImportResponse } from "@/types";

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImport: (
		data: string,
		disabledCharacters?: string,
	) => Promise<ImportResponse>;
	onClear: () => Promise<void>;
}

export function ImportModal({
	isOpen,
	onClose,
	onImport,
	onClear,
}: ImportModalProps) {
	const [data, setData] = useState("");
	const [disabledData, setDisabledData] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<ImportResponse | null>(null);
	const [showClearConfirm, setShowClearConfirm] = useState(false);

	const handleImport = async () => {
		if (!data.trim() && !disabledData.trim()) return;
		setIsLoading(true);
		try {
			const res = await onImport(data, disabledData);
			setResult(res);
			if (res.imported > 0 || res.updated > 0) {
				setData("");
				setDisabledData("");
			}
		} catch {
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
		} catch {
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
		setDisabledData("");
		setResult(null);
		setShowClearConfirm(false);
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
					<DialogTitle>Import Collection</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-auto">
					{!showClearConfirm ? (
						<>
							<p className="text-muted-foreground text-sm mb-2">
								Paste your Mudae collection data below.
							</p>
							<p className="text-muted-foreground text-sm mb-4">
								Run{" "}
								<code className="px-1.5 py-0.5 bg-muted rounded text-primary font-mono text-xs">
									$mmy+k=rlz+dx+i-s
								</code>{" "}
								in Discord to get your full list with images.
							</p>

							<Textarea
								value={data}
								onChange={(e) => setData(e.target.value)}
								placeholder={`#72 - Gawr Gura => 67 al, 118 img + 12 gif, 14 series · :bronzekey:   (1) 792 ka - https://mudae.net/uploads/...
#117 - Itsuki Nakano => 4 al, 58 img + 3 gif, 5 series 647 ka - https://mudae.net/uploads/...`}
								className="h-48 font-mono text-sm resize-none"
							/>

							<div className="mt-4 pt-4 border-t border-border">
								<div className="flex items-center gap-2 mb-2">
									<ProhibitIcon size={16} className="text-destructive" />
									<p className="text-muted-foreground text-sm">
										Disabled Characters (optional)
									</p>
								</div>
								<p className="text-muted-foreground text-sm mb-3">
									Run{" "}
									<code className="px-1.5 py-0.5 bg-muted rounded text-primary font-mono text-xs">
										$mmxs
									</code>{" "}
									in Discord to get your disabled list.
								</p>

								<Textarea
									value={disabledData}
									onChange={(e) => setDisabledData(e.target.value)}
									placeholder={`Karlach  🚫
Assassin Coli  🚫
Elizabeth  🚫`}
									className="h-32 font-mono text-sm resize-none"
								/>
							</div>

							{result && (
								<div
									className={`mt-4 p-4 rounded-lg ${result.errors.length > 0 ? "bg-destructive/10 border border-destructive/30" : "bg-success/10 border border-success/30"}`}
								>
									<div className="flex gap-6 text-sm flex-wrap">
										<span className="text-success">
											Imported: <strong>{result.imported}</strong>
										</span>
										<span className="text-warning">
											Updated: <strong>{result.updated}</strong>
										</span>
										<span className="text-muted-foreground">
											Skipped: <strong>{result.skipped}</strong>
										</span>
										{result.imagesQueued > 0 && (
											<span className="text-primary">
												Images queued: <strong>{result.imagesQueued}</strong>
											</span>
										)}
										{result.disabledImported !== undefined &&
											result.disabledImported > 0 && (
												<span className="text-destructive">
													Disabled: <strong>{result.disabledImported}</strong>
												</span>
											)}
									</div>
									{result.errors.length > 0 && (
										<div className="mt-2 text-sm text-destructive">
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
							<WarningIcon
								size={48}
								className="text-destructive mx-auto mb-4"
							/>
							<h3 className="text-lg font-semibold mb-2">Clear Collection?</h3>
							<p className="text-muted-foreground mb-6">
								This will permanently delete all characters from your
								collection. This action cannot be undone.
							</p>
							<div className="flex gap-4 justify-center">
								<Button
									variant="outline"
									onClick={() => setShowClearConfirm(false)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleClear}
									disabled={isLoading}
								>
									{isLoading ? "Clearing..." : "Yes, Clear All"}
								</Button>
							</div>
						</div>
					)}
				</div>

				{!showClearConfirm && (
					<DialogFooter className="flex items-center justify-between sm:justify-between">
						<Button
							variant="ghost"
							className="text-destructive hover:text-destructive"
							onClick={() => setShowClearConfirm(true)}
						>
							<TrashIcon size={18} />
							Clear Collection
						</Button>
						<div className="flex gap-3">
							<Button variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button
								onClick={handleImport}
								disabled={isLoading || (!data.trim() && !disabledData.trim())}
							>
								<UploadIcon size={18} />
								{isLoading ? "Importing..." : "Import"}
							</Button>
						</div>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}

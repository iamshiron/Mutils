import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { KAKERA_COLORS } from "@/lib/constants";
import type {
	CreateKakeraClaimRequest,
	KakeraClaim,
	KakeraType,
	UpdateKakeraClaimRequest,
} from "@/types";

interface KakeraClaimModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (request: CreateKakeraClaimRequest) => Promise<void>;
	onUpdate?: (id: string, request: UpdateKakeraClaimRequest) => Promise<void>;
	editClaim?: KakeraClaim | null;
}

const KAKERA_TYPES: {
	value: KakeraType;
	label: string;
	defaultValue: number;
}[] = [
	{ value: "purple", label: "Purple", defaultValue: 120 },
	{ value: "blue", label: "Blue", defaultValue: 100 },
	{ value: "green", label: "Green", defaultValue: 75 },
	{ value: "yellow", label: "Yellow", defaultValue: 60 },
	{ value: "orange", label: "Orange", defaultValue: 50 },
	{ value: "red", label: "Red", defaultValue: 40 },
	{ value: "rainbow", label: "Rainbow", defaultValue: 150 },
	{ value: "light", label: "Light", defaultValue: 30 },
	{ value: "chaos", label: "Chaos", defaultValue: 25 },
	{ value: "dark", label: "Dark", defaultValue: 20 },
	{ value: "teal", label: "Teal", defaultValue: 15 },
	{ value: "bku", label: "Bku", defaultValue: 10 },
];

export function KakeraClaimModal({
	isOpen,
	onClose,
	onSubmit,
	onUpdate,
	editClaim,
}: KakeraClaimModalProps) {
	const [characterName, setCharacterName] = useState("");
	const [type, setType] = useState<KakeraType>("purple");
	const [value, setValue] = useState(120);
	const [isClaimed, setIsClaimed] = useState(true);
	const [claimedAt, setClaimedAt] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [isLoading, setIsLoading] = useState(false);

	const isEditMode = !!editClaim;

	useEffect(() => {
		if (editClaim) {
			setCharacterName(editClaim.characterName || "");
			setType(editClaim.type);
			setValue(editClaim.value);
			setIsClaimed(editClaim.isClaimed);
			setClaimedAt(editClaim.claimedAt.slice(0, 10));
		} else {
			setCharacterName("");
			setType("purple");
			setValue(120);
			setIsClaimed(true);
			setClaimedAt(new Date().toISOString().slice(0, 10));
		}
	}, [editClaim]);

	if (!isOpen) return null;

	const handleTypeChange = (newType: KakeraType) => {
		setType(newType);
		const typeConfig = KAKERA_TYPES.find((t) => t.value === newType);
		if (typeConfig && !isEditMode) {
			setValue(typeConfig.defaultValue);
		}
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const request = {
				characterName: characterName.trim() || undefined,
				type,
				value,
				isClaimed,
				claimedAt: new Date(claimedAt).toISOString(),
			};

			if (isEditMode && editClaim && onUpdate) {
				await onUpdate(editClaim.id, request);
			} else if (onSubmit) {
				await onSubmit(request as CreateKakeraClaimRequest);
			}

			onClose();
		} catch (error) {
			console.error("Failed to save claim:", error);
		}
		setIsLoading(false);
	};

	const handleClose = () => {
		setCharacterName("");
		setType("purple");
		setValue(120);
		setIsClaimed(true);
		setClaimedAt(new Date().toISOString().slice(0, 10));
		onClose();
	};

	const toggleClaimed = () => setIsClaimed(!isClaimed);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="glass rounded-xl w-full max-w-md mx-4 lantern-top">
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-xl font-semibold">
						{isEditMode ? "Edit Kakera Claim" : "Log Kakera Claim"}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-4 space-y-4">
					<div>
						<label
							htmlFor="character-name"
							className="block text-sm text-foreground-muted mb-1.5"
						>
							Character Name
						</label>
						<input
							id="character-name"
							type="text"
							value={characterName}
							onChange={(e) => setCharacterName(e.target.value)}
							placeholder="Optional character name"
							className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 focus:ring-1 focus:ring-sakura-500 outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="kakera-type"
							className="block text-sm text-foreground-muted mb-1.5"
						>
							Kakera Type
						</label>
						<select
							id="kakera-type"
							value={type}
							onChange={(e) => handleTypeChange(e.target.value as KakeraType)}
							className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 outline-none"
						>
							{KAKERA_TYPES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="kakera-value"
							className="block text-sm text-foreground-muted mb-1.5"
						>
							Value
						</label>
						<input
							id="kakera-value"
							type="number"
							value={value}
							onChange={(e) => setValue(parseInt(e.target.value) || 0)}
							min={0}
							className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 focus:ring-1 focus:ring-sakura-500 outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="claimed-date"
							className="block text-sm text-foreground-muted mb-1.5"
						>
							Claimed Date
						</label>
						<input
							id="claimed-date"
							type="date"
							value={claimedAt}
							onChange={(e) => setClaimedAt(e.target.value)}
							className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg focus:border-sakura-500 focus:ring-1 focus:ring-sakura-500 outline-none"
						/>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							role="checkbox"
							aria-checked={isClaimed}
							onClick={toggleClaimed}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleClaimed();
								}
							}}
							className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
								isClaimed
									? "bg-sakura-500 border-sakura-500"
									: "border-border bg-transparent"
							}`}
						>
							{isClaimed && (
								<svg
									className="w-3 h-3 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<title>Checked</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={3}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							)}
						</button>
						<span
							className="text-sm cursor-pointer"
							onClick={toggleClaimed}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleClaimed();
								}
							}}
							role="button"
							tabIndex={0}
						>
							Claimed?
						</span>
					</div>

					<div className="flex items-center gap-2 pt-2">
						<span className="text-sm text-foreground-muted">Preview:</span>
						<span
							className="px-2 py-0.5 rounded text-xs font-medium capitalize"
							style={{
								backgroundColor: `${KAKERA_COLORS[type]}20`,
								color: KAKERA_COLORS[type],
							}}
						>
							{type}
						</span>
						<span className="text-sm font-mono text-sakura-400">
							{value.toLocaleString()} ka
						</span>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 p-4 border-t border-border">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isLoading || value <= 0}
						className="px-4 py-2 bg-sakura-500 text-background font-semibold rounded-lg hover:bg-sakura-300 transition-colors disabled:opacity-50"
					>
						{isLoading
							? "Saving..."
							: isEditMode
								? "Update Claim"
								: "Save Claim"}
					</button>
				</div>
			</div>
		</div>
	);
}

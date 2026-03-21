import { useEffect, useState } from "react";
import { KAKERA_COLORS } from "@/lib/constants";
import type {
	CreateKakeraClaimRequest,
	KakeraClaim,
	KakeraType,
	UpdateKakeraClaimRequest,
} from "@/types";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";

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

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Kakera Claim" : "Log Kakera Claim"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label htmlFor="character-name">Character Name</Label>
						<Input
							id="character-name"
							type="text"
							value={characterName}
							onChange={(e) => setCharacterName(e.target.value)}
							placeholder="Optional character name"
							className="h-9 mt-1.5"
						/>
					</div>

					<div>
						<Label htmlFor="kakera-type">Kakera Type</Label>
						<NativeSelect
							id="kakera-type"
							value={type}
							onChange={(e) => handleTypeChange(e.target.value as KakeraType)}
							className="mt-1.5"
						>
							{KAKERA_TYPES.map((t) => (
								<NativeSelectOption key={t.value} value={t.value}>
									{t.label}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>

					<div>
						<Label htmlFor="kakera-value">Value</Label>
						<Input
							id="kakera-value"
							type="number"
							value={value}
							onChange={(e) => setValue(parseInt(e.target.value) || 0)}
							min={0}
							className="h-9 mt-1.5"
						/>
					</div>

					<div>
						<Label htmlFor="claimed-date">Claimed Date</Label>
						<Input
							id="claimed-date"
							type="date"
							value={claimedAt}
							onChange={(e) => setClaimedAt(e.target.value)}
							className="h-9 mt-1.5"
						/>
					</div>

					<div className="flex items-center gap-3">
						<Checkbox
							id="is-claimed"
							checked={isClaimed}
							onCheckedChange={(checked) => setIsClaimed(checked as boolean)}
						/>
						<Label htmlFor="is-claimed" className="cursor-pointer">
							Claimed?
						</Label>
					</div>

					<div className="flex items-center gap-2 pt-2">
						<span className="text-sm text-muted-foreground">Preview:</span>
						<span
							className="px-2 py-0.5 rounded text-xs font-medium capitalize"
							style={{
								backgroundColor: `color-mix(in srgb, ${KAKERA_COLORS[type]} 12%, transparent)`,
								color: KAKERA_COLORS[type],
							}}
						>
							{type}
						</span>
						<span className="text-sm font-mono text-primary">
							{value.toLocaleString()} ka
						</span>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading || value <= 0}>
						{isLoading
							? "Saving..."
							: isEditMode
								? "Update Claim"
								: "Save Claim"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

import {
	CastleTurret,
	DiceFive,
	FloppyDisk,
	Medal,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { profileApi } from "@/lib/api";
import type { UpdateProfileRequest, UserProfile } from "@/types";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

const BADGES = [
	{ key: "bronzeBadge", label: "Bronze" },
	{ key: "silverBadge", label: "Silver" },
	{ key: "goldBadge", label: "Gold" },
	{ key: "sapphireBadge", label: "Sapphire" },
	{ key: "rubyBadge", label: "Ruby" },
	{ key: "emeraldBadge", label: "Emerald" },
	{ key: "diamondBadge", label: "Diamond" },
] as const;

const TOWER_PERKS = [
	{ key: "towerPerk1", id: 1, description: "+2 wishlist slots" },
	{
		key: "towerPerk2",
		id: 2,
		description: "Increased spawn chance for your $starwish: +50%",
	},
	{
		key: "towerPerk3",
		id: 3,
		description:
			"Disablelist: +1 slot and limits lowered by 200 $wa, 200 $ha, 140 $wg, 140 $hg",
	},
	{
		key: "towerPerk4",
		id: 4,
		description: "+10% chance to earn a second key if the character is wished",
	},
	{
		key: "towerPerk5",
		id: 5,
		description: "Unveil 2 random buttons for the $oh command",
	},
	{
		key: "towerPerk6",
		id: 6,
		description: "+30 spheres when you claim a character",
	},
	{
		key: "towerPerk7",
		id: 7,
		description: "Max kakera power increased to 110%",
	},
	{
		key: "towerPerk8",
		id: 8,
		description: "Kakera buttons cost -4% kakera power",
	},
	{
		key: "towerPerk9",
		id: 9,
		description: "Gold keys max bonus increased by +500 kakera/3h ($bku)",
	},
	{
		key: "towerPerk10",
		id: 10,
		description: "Light kakera give +1 random kakera",
	},
	{ key: "towerPerk11", id: 11, description: "+1 roll per hour" },
	{
		key: "towerPerk12",
		id: 12,
		description: "$colormm and $colorpr commands unlocked",
	},
] as const;

const ROLL_SETTINGS = [
	{
		key: "totalPool",
		label: "Total Pool ($wg)",
		description: "Total characters in roulette from $wg",
	},
	{
		key: "disabledLimit",
		label: "Disabled Limit",
		description: "Base disabled limit before perk 3",
	},
	{
		key: "antiDisabled",
		label: "Antidisabled ($ad)",
		description: "Characters added back via $ad",
	},
	{
		key: "totalRolls",
		label: "Total Rolls/Hour",
		description: "Total rolls available per hour (base + perk 11 bonus)",
	},
	{
		key: "bwRollsInvested",
		label: "$bw Rolls Invested",
		description: "Rolls invested in boostwish for bonus spawn",
	},
] as const;

type ProfileFieldKey =
	| (typeof BADGES)[number]["key"]
	| (typeof TOWER_PERKS)[number]["key"]
	| (typeof ROLL_SETTINGS)[number]["key"];

function LevelSelect({
	value,
	onChange,
	max,
}: {
	value: number;
	onChange: (v: number) => void;
	max: number;
}) {
	return (
		<Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
			<SelectTrigger className="w-20">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Array.from({ length: max + 1 }, (_, i) => (
					<SelectItem key={i} value={String(i)}>
						{i}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function ProfilePage() {
	const queryClient = useQueryClient();

	const { data: serverProfile, isLoading } = useQuery({
		queryKey: ["profile"],
		queryFn: profileApi.get,
	});

	const [localEdits, setLocalEdits] = useState<
		Partial<Record<ProfileFieldKey, number>>
	>({});
	const hasChanges = Object.keys(localEdits).length > 0;

	useEffect(() => {
		setLocalEdits({});
	}, [serverProfile]);

	const getValue = useCallback(
		(key: ProfileFieldKey): number => {
			if (key in localEdits) return localEdits[key]!;
			return (serverProfile?.[key as keyof UserProfile] as number) ?? 0;
		},
		[localEdits, serverProfile],
	);

	const updateField = useCallback((key: ProfileFieldKey, value: number) => {
		setLocalEdits((prev) => ({ ...prev, [key]: value }));
	}, []);

	const saveMutation = useMutation({
		mutationFn: (request: UpdateProfileRequest) => profileApi.update(request),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
			toast.success("Profile saved");
		},
		onError: () => {
			toast.error("Failed to save profile");
		},
	});

	const handleSave = useCallback(() => {
		if (!hasChanges) return;
		saveMutation.mutate(localEdits as UpdateProfileRequest);
	}, [localEdits, hasChanges, saveMutation]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Profile</h1>
					<p className="text-muted-foreground">
						Configure your badge levels and tower perks
					</p>
				</div>
				<Button
					onClick={handleSave}
					disabled={!hasChanges || saveMutation.isPending}
				>
					<FloppyDisk className="mr-2 h-4 w-4" />
					{saveMutation.isPending ? "Saving..." : "Save"}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Medal className="h-5 w-5" />
						Kakera Badges
					</CardTitle>
					<CardDescription>Set your current badge levels (0–4)</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{BADGES.map((badge) => (
							<div
								key={badge.key}
								className="flex items-center justify-between gap-3 rounded-md border p-3"
							>
								<Label className="font-medium">{badge.label}</Label>
								<LevelSelect
									value={getValue(badge.key)}
									onChange={(v) => updateField(badge.key, v)}
									max={4}
								/>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CastleTurret className="h-5 w-5" />
						Tower Perks
					</CardTitle>
					<CardDescription>
						Set your current tower perk levels (0–5)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{TOWER_PERKS.map((perk) => (
							<div
								key={perk.key}
								className="flex items-center justify-between gap-4 rounded-md border p-3"
							>
								<div className="flex items-baseline gap-2 min-w-0">
									<span className="text-muted-foreground font-mono text-sm shrink-0">
										[{perk.id}]
									</span>
									<span className="text-sm">{perk.description}</span>
								</div>
								<LevelSelect
									value={getValue(perk.key)}
									onChange={(v) => updateField(perk.key, v)}
									max={5}
								/>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DiceFive className="h-5 w-5" />
						Roll Settings
					</CardTitle>
					<CardDescription>
						Manual settings for roll calculations (cannot be auto-imported)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{ROLL_SETTINGS.map((setting) => (
							<div
								key={setting.key}
								className="flex items-center justify-between gap-4 rounded-md border p-3"
							>
								<div className="flex-1 min-w-0">
									<Label className="font-medium">{setting.label}</Label>
									<p className="text-xs text-muted-foreground mt-0.5">
										{setting.description}
									</p>
								</div>
								<Input
									type="number"
									min={0}
									value={getValue(setting.key)}
									onChange={(e) =>
										updateField(setting.key, parseInt(e.target.value) || 0)
									}
									className="w-32"
								/>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

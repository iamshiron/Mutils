import {
	CalculatorIcon,
	CheckCircleIcon,
	DownloadIcon,
	KeyIcon,
	StarIcon,
	TrashIcon,
	UploadIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculatorApi } from "@/lib/api";
import type { CalculatorConfig, CreateCalculatorConfigRequest } from "@/types";

export const Route = createFileRoute("/calculator")({
	component: CalculatorPage,
});

interface CalculatorInputs {
	totalPool: number;
	disabledLimit: number;
	antiDisabled: number;
	silverBadge: number;
	rubyBadge: number;
	perk2: number;
	perk3: number;
	perk4: number;
	ownedTotal: number;
	ownedDisabled: number;
	totalRolls: number;
	bwRollsInvested: number;
}

interface CalculationResults {
	effectivePool: number;
	badgeBonus: number;
	regWishMult: number;
	starwishMult: number;
	activeOwned: number;
	starwishProb: number;
	wishProb: number;
	ownedProb: number;
	doubleKeyChance: number;
	bwRollsWishBonus: number;
	bwRollsStarwishBonus: number;
	expectedStarwishHits: number;
	expectedWishHits: number;
}

const defaultInputs: CalculatorInputs = {
	totalPool: 33927,
	disabledLimit: 28927,
	antiDisabled: 1296,
	silverBadge: 4,
	rubyBadge: 2,
	perk2: 1,
	perk3: 0,
	perk4: 0,
	ownedTotal: 544,
	ownedDisabled: 216,
	totalRolls: 10,
	bwRollsInvested: 0,
};

function calculateBWRollBonuses(investedRolls: number): {
	wishBonus: number;
	starwishBonus: number;
} {
	let wishBonus = 0;
	let starwishBonus = 0;

	for (let i = 1; i <= investedRolls; i++) {
		if (i <= 5) {
			wishBonus += 20;
		} else if (i <= 15) {
			wishBonus += 15;
		} else if (i <= 100) {
			wishBonus += 10;
		} else if (i <= 200) {
			wishBonus += 5;
		} else {
			wishBonus += 1;
		}

		if (i <= 100) {
			starwishBonus += 10;
		} else if (i <= 200) {
			starwishBonus += 5;
		} else {
			starwishBonus += 1;
		}
	}

	return { wishBonus, starwishBonus };
}

function calculateOptimalBW(
	inputs: CalculatorInputs,
	type: "wish" | "starwish",
): number {
	const extraDisabledFromPerk3 = inputs.perk3 * 140;
	let effectivePool =
		inputs.totalPool -
		(inputs.disabledLimit + extraDisabledFromPerk3) +
		inputs.antiDisabled;
	if (effectivePool <= 0) effectivePool = 1;

	let badgeBonus = inputs.silverBadge * 25;
	if (inputs.rubyBadge >= 2) badgeBonus += 50;

	const towerBonus = inputs.perk2 * 50;

	let bestHits = 0;
	let bestInvested = 0;

	for (let invested = 0; invested <= inputs.totalRolls; invested++) {
		const { wishBonus, starwishBonus } = calculateBWRollBonuses(invested);
		const effectiveRolls = inputs.totalRolls - invested;

		const baseMult = 1 + badgeBonus / 100;
		const starwishBase = baseMult + towerBonus / 100;

		const wishMult = baseMult + wishBonus / 100;
		const starwishMult = starwishBase + wishBonus / 100 + starwishBonus / 100;

		const wishProb = wishMult / effectivePool;
		const starwishProb = starwishMult / effectivePool;

		const hits =
			type === "wish"
				? wishProb * effectiveRolls
				: starwishProb * effectiveRolls;

		if (hits > bestHits) {
			bestHits = hits;
			bestInvested = invested;
		}
	}

	return bestInvested;
}

function calculate(inputs: CalculatorInputs): CalculationResults {
	const extraDisabledFromPerk3 = inputs.perk3 * 140;
	let effectivePool =
		inputs.totalPool -
		(inputs.disabledLimit + extraDisabledFromPerk3) +
		inputs.antiDisabled;
	if (effectivePool <= 0) effectivePool = 1;

	let badgeBonus = inputs.silverBadge * 25;
	if (inputs.rubyBadge >= 2) badgeBonus += 50;

	const regWishMult = 1 + badgeBonus / 100;

	const towerBonus = inputs.perk2 * 50;
	const starwishMult = regWishMult + towerBonus / 100;

	const activeOwned = Math.max(0, inputs.ownedTotal - inputs.ownedDisabled);

	const { wishBonus: bwRollsWishBonus, starwishBonus: bwRollsStarwishBonus } =
		calculateBWRollBonuses(inputs.bwRollsInvested);

	const effectiveRollsPerHour = Math.max(
		0,
		inputs.totalRolls - inputs.bwRollsInvested,
	);

	const finalWishMult = regWishMult + bwRollsWishBonus / 100;
	const finalStarwishMult =
		starwishMult + bwRollsWishBonus / 100 + bwRollsStarwishBonus / 100;

	const starwishProb = finalStarwishMult / effectivePool;
	const wishProb = finalWishMult / effectivePool;
	const ownedProb = activeOwned / effectivePool;

	const expectedStarwishHits = starwishProb * effectiveRollsPerHour;
	const expectedWishHits = wishProb * effectiveRollsPerHour;

	return {
		effectivePool,
		badgeBonus,
		regWishMult: finalWishMult,
		starwishMult: finalStarwishMult,
		activeOwned,
		starwishProb,
		wishProb,
		ownedProb,
		doubleKeyChance: inputs.perk4 * 10,
		bwRollsWishBonus,
		bwRollsStarwishBonus,
		expectedStarwishHits,
		expectedWishHits,
	};
}

function formatOdds(probability: number): string {
	if (probability <= 0) return "Impossible";
	const odds = Math.round(1 / probability);
	return `1 in ${odds.toLocaleString()}`;
}

function formatPercent(value: number, decimals = 4): string {
	return (value * 100).toFixed(decimals) + "%";
}

function CalculatorPage() {
	const queryClient = useQueryClient();
	const [inputs, setInputs] = useState<CalculatorIconInputs>(defaultInputs);
	const [configName, setConfigName] = useState("");
	const [importError, setImportError] = useState<string | null>(null);

	const { data: configs = [], isLoading } = useQuery({
		queryKey: ["calculator-configs"],
		queryFn: calculatorApi.getAll,
	});

	const createMutation = useMutation({
		mutationFn: calculatorApi.create,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calculator-configs"] });
			setConfigName("");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: calculatorApi.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calculator-configs"] });
		},
	});

	const results = calculate(inputs);

	const updateInput = (key: keyof CalculatorInputs, value: number) => {
		setInputs((prev) => ({ ...prev, [key]: value }));
	};

	const handleSaveConfig = () => {
		let name = configName.trim();
		if (!name) {
			name = `Setup ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
		}

		const request: CreateCalculatorConfigRequest = {
			name,
			...inputs,
		};
		createMutation.mutate(request);
	};

	const handleLoadConfig = (config: CalculatorConfig) => {
		setInputs({
			totalPool: config.totalPool,
			disabledLimit: config.disabledLimit,
			antiDisabled: config.antiDisabled,
			silverBadge: config.silverBadge,
			rubyBadge: config.rubyBadge,
			perk2: config.perk2,
			perk3: config.perk3,
			perk4: config.perk4,
			ownedTotal: config.ownedTotal,
			ownedDisabled: config.ownedDisabled,
			totalRolls: config.totalRolls ?? 0,
			bwRollsInvested: config.bwRollsInvested ?? 0,
		});
	};

	const handleDeleteConfig = (id: string) => {
		deleteMutation.mutate(id);
	};

	const handleExport = () => {
		if (configs.length === 0) return;
		const dataStr = JSON.stringify(configs, null, 2);
		const blob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `mudae-calculator-configs-${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const imported = JSON.parse(e.target?.result as string);
					if (Array.isArray(imported)) {
						const validImports = imported.filter(
							(item) => item.id && item.name && item.totalPool !== undefined,
						);
						if (validImports.length > 0) {
							validImports.forEach((config) => {
								const request: CreateCalculatorConfigRequest = {
									name: config.name,
									totalPool: config.totalPool,
									disabledLimit: config.disabledLimit ?? 0,
									antiDisabled: config.antiDisabled ?? 0,
									silverBadge: config.silverBadge ?? 0,
									rubyBadge: config.rubyBadge ?? 0,
									perk2: config.perk2 ?? 0,
									perk3: config.perk3 ?? 0,
									perk4: config.perk4 ?? 0,
									ownedTotal: config.ownedTotal ?? 0,
									ownedDisabled: config.ownedDisabled ?? 0,
									totalRolls: config.totalRolls ?? 0,
									bwRollsInvested: config.bwRollsInvested ?? 0,
								};
								createMutation.mutate(request);
							});
							setImportError(null);
						} else {
							setImportError("No valid configurations found in the JSON file.");
						}
					} else {
						setImportError(
							"Invalid configuration file format (expected an array).",
						);
					}
				} catch {
					setImportError(
						"Error parsing JSON file. Make sure it is a valid export.",
					);
				}
			};
			reader.readAsText(file);
			event.target.value = "";
		},
		[createMutation],
	);

	useEffect(() => {
		if (importError) {
			const timer = setTimeout(() => setImportError(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [importError]);

	return (
		<div className="max-w-6xl mx-auto">
			<Card className="glass mb-6">
				<CardHeader>
					<div className="flex items-center gap-3">
						<CalculatorIcon size={28} className="text-primary" />
						<div>
							<CardTitle className="text-2xl font-bold">
								What If Calculator
							</CardTitle>
							<CardDescription>
								Experiment with different stats to see how they affect your
								odds.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<PoolSettings inputs={inputs} updateInput={updateInput} />
					<WishMultipliers inputs={inputs} updateInput={updateInput} />
					<TowerPerks inputs={inputs} updateInput={updateInput} />
					<RollSettings inputs={inputs} updateInput={updateInput} />
					<OwnedCharacters inputs={inputs} updateInput={updateInput} />

					<Card className="glass lantern-top">
						<CardHeader className="border-b">
							<CardTitle className="text-lg">Saved Configurations</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2 mb-4">
								<Input
									type="text"
									value={configName}
									onChange={(e) => setConfigName(e.target.value)}
									placeholder="Name for current setup..."
									className="flex-1 h-9"
								/>
								<Button
									onClick={handleSaveConfig}
									disabled={createMutation.isPending}
									className="h-9 px-4 text-sm"
								>
									Save
								</Button>
							</div>

							{importError && (
								<Alert variant="destructive" className="mb-4">
									<AlertDescription>{importError}</AlertDescription>
								</Alert>
							)}

							<div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
								{isLoading ? (
									<p className="text-muted-foreground text-sm italic py-2 text-center">
										Loading...
									</p>
								) : configs.length === 0 ? (
									<p className="text-muted-foreground text-sm italic py-2 text-center border border-dashed border-border rounded">
										No saved configurations yet.
									</p>
								) : (
									configs.map((config) => (
										<div
											key={config.id}
											className="bg-secondary border border-border rounded p-3 flex justify-between items-center group"
										>
											<span className="text-foreground font-medium truncate flex-1 pr-2">
												{config.name}
											</span>
											<div className="flex gap-2">
												<Button
													variant="secondary"
													size="sm"
													onClick={() => handleLoadConfig(config)}
												>
													Load
												</Button>
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleDeleteConfig(config.id)}
												>
													<TrashIcon size={14} />
												</Button>
											</div>
										</div>
									))
								)}
							</div>

							<Separator className="mb-4" />

							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={handleExport}
									disabled={configs.length === 0}
									className="flex-1"
								>
									<DownloadIcon size={16} />
									Export JSON
								</Button>
								<Button variant="outline" className="flex-1" asChild>
									<label className="cursor-pointer">
										<UploadIcon size={16} />
										Import JSON
										<input
											type="file"
											accept=".json"
											onChange={handleImport}
											className="hidden"
										/>
									</label>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<ResultCard
						title="Effective Rollable Pool"
						value={results.effectivePool.toLocaleString()}
						subtext="Total - (DL Limit + Perk 3) + AD"
						variant="primary"
					/>

					{inputs.bwRollsInvested > 0 && (
						<Card className="glass border-info/30">
							<CardContent>
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
									$bw Roll Bonuses
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">Wish Bonus:</span>
										<Badge variant="outline">
											+{results.bwRollsWishBonus}%
										</Badge>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">
											Starwish Bonus:
										</span>
										<Badge variant="outline">
											+{results.bwRollsWishBonus + results.bwRollsStarwishBonus}
											%
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					<ResultCard
						title="Specific Starwish"
						icon={<StarIcon size={16} className="text-warning" />}
						percent={formatPercent(results.starwishProb)}
						odds={formatOdds(results.starwishProb)}
						mult={results.starwishMult.toFixed(2)}
						subtext={`(+${results.badgeBonus}% from Badges)`}
						hitsPerHour={results.expectedStarwishHits}
						variant="warning"
					/>

					<ResultCard
						title="Specific Regular Wish"
						percent={formatPercent(results.wishProb)}
						odds={formatOdds(results.wishProb)}
						mult={results.regWishMult.toFixed(2)}
						hitsPerHour={results.expectedWishHits}
						variant="default"
					/>

					<ResultCard
						title="ANY Rollable Owned"
						icon={<CheckCircleIcon size={16} className="text-success" />}
						percent={formatPercent(results.ownedProb, 2)}
						odds={formatOdds(results.ownedProb)}
						subtext={`Active Targets: ${results.activeOwned}`}
						variant="success"
					/>

					{results.doubleKeyChance > 0 && (
						<ResultCard
							title="Double Key Chance"
							icon={<KeyIcon size={16} className="text-info" />}
							percent={`${results.doubleKeyChance}%`}
							subtext="Applied when rolling a wished character"
							variant="info"
						/>
					)}
				</div>
			</div>
		</div>
	);
}

interface InputSectionProps {
	inputs: CalculatorInputs;
	updateInput: (key: keyof CalculatorInputs, value: number) => void;
}

function PoolSettings({ inputs, updateInput }: InputSectionProps) {
	return (
		<Card className="glass lantern-top">
			<CardHeader className="border-b">
				<CardTitle className="text-lg">Pool Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<InputField
						label="Total in Roulette (e.g. $wg)"
						value={inputs.totalPool}
						onChange={(v) => updateInput("totalPool", v)}
					/>
					<InputField
						label="Base Disabled Limit"
						value={inputs.disabledLimit}
						onChange={(v) => updateInput("disabledLimit", v)}
						title="Base limit before Tower Perk 3"
					/>
					<InputField
						label="Antidisabled ($ad)"
						value={inputs.antiDisabled}
						onChange={(v) => updateInput("antiDisabled", v)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function WishMultipliers({ inputs, updateInput }: InputSectionProps) {
	return (
		<Card className="glass lantern-top">
			<CardHeader className="border-b">
				<CardTitle className="text-lg">Wish Multipliers</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<SelectField
						label="Silver Badge"
						value={inputs.silverBadge}
						onChange={(v) => updateInput("silverBadge", v)}
						options={[
							{ value: 0, label: "None" },
							{ value: 1, label: "Level I (+25%)" },
							{ value: 2, label: "Level II (+50%)" },
							{ value: 3, label: "Level III (+75%)" },
							{ value: 4, label: "Level IV (+100%)" },
						]}
					/>
					<SelectField
						label="Ruby Badge"
						value={inputs.rubyBadge}
						onChange={(v) => updateInput("rubyBadge", v)}
						options={[
							{ value: 0, label: "None" },
							{ value: 1, label: "Level I (No Wish %)" },
							{ value: 2, label: "Level II (+50%)" },
							{ value: 3, label: "Level III (+50%)" },
							{ value: 4, label: "Level IV (+50%)" },
						]}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function TowerPerks({ inputs, updateInput }: InputSectionProps) {
	return (
		<Card className="glass lantern-top">
			<CardHeader className="border-b">
				<CardTitle className="text-lg">Kakera Tower Perks</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<SelectField
						label="Perk 2 (Starwish %)"
						value={inputs.perk2}
						onChange={(v) => updateInput("perk2", v)}
						options={[
							{ value: 0, label: "0 Levels" },
							{ value: 1, label: "1 Level (+50%)" },
							{ value: 2, label: "2 Levels (+100%)" },
							{ value: 3, label: "3 Levels (+150%)" },
							{ value: 4, label: "4 Levels (+200%)" },
							{ value: 5, label: "5 Levels (+250%)" },
						]}
					/>
					<SelectField
						label="Perk 3 (DL Limit)"
						value={inputs.perk3}
						onChange={(v) => updateInput("perk3", v)}
						options={[
							{ value: 0, label: "0 Levels" },
							{ value: 1, label: "1 Level (-140 $wg)" },
							{ value: 2, label: "2 Levels (-280 $wg)" },
							{ value: 3, label: "3 Levels (-420 $wg)" },
							{ value: 4, label: "4 Levels (-560 $wg)" },
							{ value: 5, label: "5 Levels (-700 $wg)" },
						]}
						title="Subtracts an extra 140 $wg from your pool per level"
					/>
					<SelectField
						label="Perk 4 (Double Keys)"
						value={inputs.perk4}
						onChange={(v) => updateInput("perk4", v)}
						options={[
							{ value: 0, label: "0 Levels" },
							{ value: 1, label: "1 Level (10%)" },
							{ value: 2, label: "2 Levels (20%)" },
							{ value: 3, label: "3 Levels (30%)" },
							{ value: 4, label: "4 Levels (40%)" },
							{ value: 5, label: "5 Levels (50%)" },
						]}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function RollSettings({ inputs, updateInput }: InputSectionProps) {
	const handleOptimize = (type: "wish" | "starwish") => {
		const optimal = calculateOptimalBW(inputs, type);
		updateInput("bwRollsInvested", optimal);
	};

	return (
		<Card className="glass lantern-top">
			<CardHeader className="border-b">
				<CardTitle className="text-lg">Hourly Roll Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputField
						label="Total Rolls Available"
						value={inputs.totalRolls}
						onChange={(v) => updateInput("totalRolls", v)}
						min={0}
						title="Total number of rolls you have per hour"
					/>
					<InputField
						label="Rolls Invested in $bw"
						value={inputs.bwRollsInvested}
						onChange={(v) => updateInput("bwRollsInvested", v)}
						min={0}
						max={inputs.totalRolls}
						title="Number of rolls invested in boostwish for bonus spawn rates"
					/>
				</div>
				<div className="mt-4 flex gap-2">
					<Button
						variant="secondary"
						onClick={() => handleOptimize("wish")}
						className="flex-1 text-sm"
					>
						Optimize for Wish
					</Button>
					<Button
						variant="secondary"
						onClick={() => handleOptimize("starwish")}
						className="flex-1 text-sm"
					>
						Optimize for Starwish
					</Button>
				</div>
				{inputs.bwRollsInvested > 0 && (
					<div className="mt-4 p-3 bg-info/10 border border-info/30 rounded-lg">
						<p className="text-sm text-muted-foreground">
							Effective rolls per hour:{" "}
							<span className="text-foreground font-medium">
								{Math.max(0, inputs.totalRolls - inputs.bwRollsInvested)}
							</span>
						</p>
						<p className="text-xs text-muted-foreground/70 mt-1">
							Each roll invested grants +20% wish spawn (decreases at
							thresholds: 15% after 5, 10% after 15, 5% after 100, 1% after 200)
							and +10% starwish (5% after 100, 1% after 200)
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function OwnedCharacters({ inputs, updateInput }: InputSectionProps) {
	return (
		<Card className="glass lantern-top">
			<CardHeader className="border-b">
				<CardTitle className="text-lg">
					Owned Characters ($persrare 1)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<InputField
						label="Total Owned Characters"
						value={inputs.ownedTotal}
						onChange={(v) => updateInput("ownedTotal", v)}
					/>
					<InputField
						label="Owned but Disabled"
						value={inputs.ownedDisabled}
						onChange={(v) => updateInput("ownedDisabled", v)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

interface InputFieldProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	title?: string;
}

function InputField({
	label,
	value,
	onChange,
	min,
	max,
	title,
}: InputFieldProps) {
	const id = `input-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

	const labelContent = title ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Label
						htmlFor={id}
						className="cursor-help border-b border-dotted border-muted-foreground/50"
					>
						{label}
					</Label>
				</TooltipTrigger>
				<TooltipContent>{title}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		<Label htmlFor={id}>{label}</Label>
	);

	return (
		<div className="space-y-1.5">
			{labelContent}
			<Input
				id={id}
				type="number"
				value={value}
				onChange={(e) => onChange(parseInt(e.target.value) || 0)}
				min={min}
				max={max}
				className="h-9"
			/>
		</div>
	);
}

interface SelectFieldProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	options: { value: number; label: string }[];
	title?: string;
}

function SelectField({
	label,
	value,
	onChange,
	options,
	title,
}: SelectFieldProps) {
	const labelContent = title ? (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Label className="cursor-help border-b border-dotted border-muted-foreground/50">
						{label}
					</Label>
				</TooltipTrigger>
				<TooltipContent>{title}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	) : (
		<Label>{label}</Label>
	);

	return (
		<div className="space-y-1.5">
			{labelContent}
			<Select
				value={String(value)}
				onValueChange={(v) => onChange(parseInt(v))}
			>
				<SelectTrigger className="w-full h-9">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={String(opt.value)}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

interface ResultCardProps {
	title: string;
	value?: string;
	percent?: string;
	odds?: string;
	mult?: string;
	subtext?: string;
	icon?: React.ReactNode;
	hitsPerHour?: number;
	variant?: "primary" | "warning" | "success" | "info" | "default";
}

function ResultCard({
	title,
	value,
	percent,
	odds,
	mult,
	subtext,
	icon,
	hitsPerHour,
	variant = "default",
}: ResultCardProps) {
	const variantStyles = {
		primary: "border-primary/50",
		warning: "border-warning/30",
		success: "border-success/30",
		info: "border-info/30",
		default: "border-border",
	};

	const textStyles = {
		primary: "text-primary",
		warning: "text-warning",
		success: "text-success",
		info: "text-info",
		default: "text-foreground",
	};

	const badgeVariants: Record<
		string,
		"default" | "secondary" | "outline" | "destructive"
	> = {
		primary: "default",
		warning: "outline",
		success: "outline",
		info: "outline",
		default: "secondary",
	};

	return (
		<Card className={`glass ${variantStyles[variant]}`}>
			<CardContent>
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
						{icon}
						{title}
					</h3>
					{mult && <Badge variant={badgeVariants[variant]}>{mult}x</Badge>}
				</div>
				{value && (
					<p
						className={`text-4xl font-bold text-foreground mt-1 ${textStyles[variant]}`}
					>
						{value}
					</p>
				)}
				{percent && (
					<div className="mt-2 flex items-baseline gap-2">
						<p className={`text-3xl font-bold ${textStyles[variant]}`}>
							{percent}
						</p>
					</div>
				)}
				{odds && (
					<Badge
						variant="outline"
						className="mt-1 font-mono text-sm px-3 py-1 h-auto"
					>
						{odds}
					</Badge>
				)}
				{hitsPerHour !== undefined && hitsPerHour > 0 && (
					<p className="text-sm text-muted-foreground mt-2">
						~
						<span className="text-foreground font-medium">
							{hitsPerHour.toFixed(5)}
						</span>{" "}
						hits/hour
					</p>
				)}
				{mult && subtext && (
					<p className="text-xs text-muted-foreground/70 mt-2">
						<span className="text-primary">{subtext}</span>
					</p>
				)}
				{!mult && subtext && (
					<p className="text-xs text-muted-foreground/70 mt-2">{subtext}</p>
				)}
			</CardContent>
		</Card>
	);
}

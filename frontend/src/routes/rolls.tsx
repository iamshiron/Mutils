import {
	CheckCircleIcon,
	DiceFiveIcon,
	KeyIcon,
	StarIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { collectionApi, profileApi } from "@/lib/api";

export const Route = createFileRoute("/rolls")({
	component: RollsPage,
});

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

function calculate(inputs: {
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
}): CalculationResults {
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

function RollsPage() {
	const { data: profile, isLoading: profileLoading } = useQuery({
		queryKey: ["profile"],
		queryFn: profileApi.get,
	});

	const { data: collectionStats, isLoading: statsLoading } = useQuery({
		queryKey: ["collection-stats"],
		queryFn: collectionApi.getStats,
	});

	if (profileLoading || statsLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				Please set up your profile first.
			</div>
		);
	}

	const inputs = {
		totalPool: profile.totalPool || 33927,
		disabledLimit: profile.disabledLimit || 28927,
		antiDisabled: profile.antiDisabled || 0,
		silverBadge: profile.silverBadge || 0,
		rubyBadge: profile.rubyBadge || 0,
		perk2: profile.towerPerk2 || 0,
		perk3: profile.towerPerk3 || 0,
		perk4: profile.towerPerk4 || 0,
		ownedTotal: collectionStats?.totalCharacters || 0,
		ownedDisabled: collectionStats?.disabledCount || 0,
		totalRolls: profile.totalRolls || 10,
		bwRollsInvested: profile.bwRollsInvested || 0,
	};

	const results = calculate(inputs);
	const effectiveRolls = Math.max(
		0,
		inputs.totalRolls - inputs.bwRollsInvested,
	);

	return (
		<div className="max-w-6xl mx-auto">
			<Card className="glass mb-6">
				<CardContent>
					<div className="flex items-center gap-3">
						<DiceFiveIcon size={28} className="text-primary" />
						<div>
							<h1 className="text-2xl font-bold">Your Roll Stats</h1>
							<p className="text-muted-foreground text-sm">
								Based on your imported collection and profile settings
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<StatsCard
					title="Pool Configuration"
					items={[
						{
							label: "Total Pool ($wg)",
							value: inputs.totalPool.toLocaleString(),
						},
						{
							label: "Disabled Limit",
							value: inputs.disabledLimit.toLocaleString(),
						},
						{
							label: "Antidisabled ($ad)",
							value: inputs.antiDisabled.toLocaleString(),
						},
						{
							label: "Perk 3 Bonus (-$wg)",
							value: (inputs.perk3 * 140).toLocaleString(),
						},
					]}
				/>

				<StatsCard
					title="Collection Stats"
					items={[
						{ label: "Total Owned", value: inputs.ownedTotal.toLocaleString() },
						{
							label: "Disabled Owned",
							value: inputs.ownedDisabled.toLocaleString(),
						},
						{
							label: "Active Targets",
							value: results.activeOwned.toLocaleString(),
						},
					]}
				/>

				<StatsCard
					title="Roll Settings"
					items={[
						{ label: "Total Rolls/Hour", value: inputs.totalRolls.toString() },
						{
							label: "$bw Rolls Invested",
							value: inputs.bwRollsInvested.toString(),
						},
						{ label: "Effective Rolls/Hour", value: effectiveRolls.toString() },
					]}
				/>

				<StatsCard
					title="Badges & Perks"
					items={[
						{
							label: "Silver Badge",
							value: `Level ${inputs.silverBadge} (+${inputs.silverBadge * 25}%)`,
						},
						{
							label: "Ruby Badge",
							value:
								inputs.rubyBadge >= 2
									? `Level ${inputs.rubyBadge} (+50%)`
									: `Level ${inputs.rubyBadge}`,
						},
						{
							label: "Perk 2 (Starwish)",
							value: `Level ${inputs.perk2} (+${inputs.perk2 * 50}%)`,
						},
						{
							label: "Perk 4 (Double Key)",
							value: `Level ${inputs.perk4} (+${inputs.perk4 * 10}%)`,
						},
					]}
				/>
			</div>

			<div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
									<Badge variant="outline">+{results.bwRollsWishBonus}%</Badge>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Starwish Bonus:</span>
									<Badge variant="outline">
										+{results.bwRollsWishBonus + results.bwRollsStarwishBonus}%
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
	);
}

interface StatsCardProps {
	title: string;
	items: { label: string; value: string }[];
}

function StatsCard({ title, items }: StatsCardProps) {
	return (
		<Card className="glass">
			<CardContent>
				<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
					{title}
				</h3>
				<div className="space-y-2">
					{items.map((item) => (
						<div
							key={item.label}
							className="flex justify-between items-center text-sm"
						>
							<span className="text-muted-foreground">{item.label}</span>
							<span className="font-medium">{item.value}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
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

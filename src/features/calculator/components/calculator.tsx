"use client";

import { useEffect, useId, useState } from "react";
import { EVENTS, track } from "@/features/analytics";
import {
	type BlendResult,
	calculateBlend,
	FUELS,
	type FuelId,
	formatLiters,
	formatPct,
	getFuel,
	PRESET_BLENDS,
	parseLiters,
} from "@/features/calculator/lib/blend";

const CUSTOM = "custom";
type BlendChoice = number | typeof CUSTOM;

/** Espera o usuário parar de digitar antes de contar um cálculo. */
const CALCULATE_EVENT_DELAY_MS = 1500;

export function Calculator() {
	const [fuelId, setFuelId] = useState<FuelId>("premium");
	const [blendChoice, setBlendChoice] = useState<BlendChoice>(85);
	const [customRaw, setCustomRaw] = useState("");
	const [litersRaw, setLitersRaw] = useState("");

	const fuel = getFuel(fuelId);
	const targetPct = blendChoice === CUSTOM ? Number.parseInt(customRaw, 10) : blendChoice;
	const liters = parseLiters(litersRaw);
	const result = calculateBlend({ fuelEthanolPct: fuel.ethanolPct, targetPct, liters });

	const resultKey = result.ok ? `${fuelId}|${targetPct}|${liters}` : null;
	useEffect(() => {
		if (!resultKey) return;
		const [fuelParam, blendParam, litersParam] = resultKey.split("|");
		const timer = setTimeout(() => {
			track(EVENTS.calculate, {
				fuel: fuelParam ?? null,
				blend: Number(blendParam),
				liters: Number(litersParam),
			});
		}, CALCULATE_EVENT_DELAY_MS);
		return () => clearTimeout(timer);
	}, [resultKey]);

	function selectFuel(id: FuelId) {
		setFuelId(id);
		track(EVENTS.fuelSelect, { fuel: id });
	}

	function selectBlend(choice: BlendChoice) {
		setBlendChoice(choice);
		track(EVENTS.blendSelect, { blend: choice });
	}

	return (
		<div className="flex flex-col gap-6">
			<Section
				title="Combustível"
				footer={`Contém ${fuel.ethanolPct}% de etanol anidro na composição.`}
			>
				<FuelPicker value={fuelId} onChange={selectFuel} />
				<EthanolBar pct={fuel.ethanolPct} />
			</Section>

			<Section
				title="Mistura desejada"
				footer="O número indica o percentual de etanol no tanque. E85 = 85% etanol + 15% gasolina."
			>
				<BlendPicker
					value={blendChoice}
					onChange={selectBlend}
					customRaw={customRaw}
					onCustomChange={setCustomRaw}
					minPct={fuel.ethanolPct}
				/>
			</Section>

			<Section title="Quanto vai abastecer">
				<LitersField value={litersRaw} onChange={setLitersRaw} />
			</Section>

			<Result
				result={result}
				fuelLabel={fuel.label}
				fuelEthanolPct={fuel.ethanolPct}
				targetPct={targetPct}
				hasLiters={litersRaw.trim() !== ""}
				hasTarget={blendChoice !== CUSTOM || customRaw.trim() !== ""}
			/>
		</div>
	);
}

function Section({
	title,
	footer,
	children,
}: {
	title: string;
	footer?: string;
	children: React.ReactNode;
}) {
	const id = useId();
	return (
		<section aria-labelledby={id}>
			<h2
				id={id}
				className="text-text-muted mb-2 px-4 text-[13px] font-medium tracking-wide uppercase"
			>
				{title}
			</h2>
			<div className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-4">
				{children}
			</div>
			{footer ? (
				<p className="text-text-muted mt-2 px-4 text-[13px] leading-snug">{footer}</p>
			) : null}
		</section>
	);
}

function FuelPicker({ value, onChange }: { value: FuelId; onChange: (id: FuelId) => void }) {
	const name = useId();
	return (
		<fieldset className="bg-fill grid grid-cols-2 gap-1 rounded-xl p-1">
			<legend className="sr-only">Tipo de gasolina</legend>
			{FUELS.map((fuel) => (
				<label key={fuel.id} className="relative cursor-pointer">
					<input
						type="radio"
						name={name}
						value={fuel.id}
						checked={value === fuel.id}
						onChange={() => onChange(fuel.id)}
						className="peer sr-only"
					/>
					<span className="text-text-muted peer-checked:bg-surface peer-checked:text-text peer-focus-visible:outline-accent flex h-10 items-center justify-center rounded-[9px] text-[15px] font-medium transition-all peer-checked:shadow-[0_1px_4px_rgba(0,0,0,0.12)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
						{fuel.shortLabel}
					</span>
				</label>
			))}
		</fieldset>
	);
}

function EthanolBar({ pct }: { pct: number }) {
	return (
		<div>
			<div className="text-text-muted mb-1.5 flex justify-between text-[13px]">
				<span>
					Etanol <strong className="text-text font-semibold">{pct}%</strong>
				</span>
				<span>
					Gasolina <strong className="text-text font-semibold">{100 - pct}%</strong>
				</span>
			</div>
			<div className="bg-fill flex h-2 overflow-hidden rounded-full" aria-hidden="true">
				<div className="bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
			</div>
		</div>
	);
}

function BlendPicker({
	value,
	onChange,
	customRaw,
	onCustomChange,
	minPct,
}: {
	value: BlendChoice;
	onChange: (choice: BlendChoice) => void;
	customRaw: string;
	onCustomChange: (raw: string) => void;
	minPct: number;
}) {
	const name = useId();
	const customId = useId();
	const options: { value: BlendChoice; label: string }[] = [
		...PRESET_BLENDS.map((pct) => ({ value: pct, label: `E${pct}` })),
		{ value: CUSTOM, label: "Outro" },
	];

	return (
		<>
			<fieldset className="grid grid-cols-3 gap-2 sm:grid-cols-5">
				<legend className="sr-only">Mistura alvo</legend>
				{options.map((option) => (
					<label key={option.value} className="cursor-pointer">
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={value === option.value}
							onChange={() => onChange(option.value)}
							className="peer sr-only"
						/>
						<span className="bg-fill text-text peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-accent flex h-11 items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
							{option.label}
						</span>
					</label>
				))}
			</fieldset>

			{value === CUSTOM ? (
				<div>
					<label htmlFor={customId} className="text-text-muted mb-1.5 block text-[13px]">
						Percentual de etanol ({minPct}% a 100%)
					</label>
					<div className="bg-fill focus-within:outline-accent flex h-12 items-center rounded-xl px-4 focus-within:outline-2">
						<span className="text-text-muted text-[17px] font-semibold">E</span>
						<input
							id={customId}
							type="text"
							inputMode="numeric"
							autoComplete="off"
							maxLength={3}
							placeholder="75"
							value={customRaw}
							onChange={(event) => onCustomChange(event.target.value.replace(/\D/g, ""))}
							className="text-text placeholder:text-text-muted/60 w-full bg-transparent pl-0.5 text-[17px] font-semibold tabular-nums outline-none"
						/>
					</div>
				</div>
			) : null}
		</>
	);
}

function LitersField({ value, onChange }: { value: string; onChange: (raw: string) => void }) {
	const id = useId();
	return (
		<div>
			<label htmlFor={id} className="text-text-muted mb-1.5 block text-[13px]">
				Total de litros que vão entrar no tanque
			</label>
			<div className="bg-fill focus-within:outline-accent flex h-14 items-center rounded-xl px-4 focus-within:outline-2">
				<input
					id={id}
					type="text"
					inputMode="numeric"
					autoComplete="off"
					maxLength={4}
					placeholder="50"
					value={value}
					onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
					className="text-text placeholder:text-text-muted/60 w-full bg-transparent text-[28px] font-semibold tabular-nums outline-none"
				/>
				<span className="text-text-muted text-[20px] font-semibold">L</span>
			</div>
		</div>
	);
}

function Result({
	result,
	fuelLabel,
	fuelEthanolPct,
	targetPct,
	hasLiters,
	hasTarget,
}: {
	result: BlendResult;
	fuelLabel: string;
	fuelEthanolPct: number;
	targetPct: number;
	hasLiters: boolean;
	hasTarget: boolean;
}) {
	let content: React.ReactNode;

	if (result.ok) {
		const gasolinePct = (result.gasolineLiters / result.totalLiters) * 100;
		const ethanolFromGasoline =
			Math.round((result.totalEthanolLiters - result.ethanolLiters) * 10) / 10;
		const drifted = result.actualPct !== targetPct;
		content = (
			<>
				<p className="text-[13px] font-medium tracking-wide uppercase opacity-80">
					Para chegar em E{targetPct}
				</p>
				<dl className="mt-3 grid grid-cols-2 gap-4">
					<div>
						<dt className="text-[15px] opacity-80">{fuelLabel}</dt>
						<dd className="mt-0.5 text-[34px] leading-tight font-bold tabular-nums">
							{formatLiters(result.gasolineLiters)}
						</dd>
					</div>
					<div>
						<dt className="text-[15px] opacity-80">Etanol</dt>
						<dd className="mt-0.5 text-[34px] leading-tight font-bold tabular-nums">
							{formatLiters(result.ethanolLiters)}
						</dd>
					</div>
				</dl>
				<div
					className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-current/15"
					aria-hidden="true"
				>
					<div
						className="bg-current/45 transition-[width] duration-300"
						style={{ width: `${gasolinePct}%` }}
					/>
					<div className="flex-1 bg-current" />
				</div>
				<p className="mt-3 text-[13px] leading-snug opacity-80">
					Total de {formatLiters(result.totalLiters)}, com {formatLiters(result.totalEthanolLiters)}{" "}
					de etanol no tanque
					{ethanolFromGasoline > 0
						? ` — ${formatLiters(ethanolFromGasoline)} já vêm na gasolina (${fuelEthanolPct}%).`
						: "."}
					{drifted ? ` Com litros inteiros a mistura fica em E${formatPct(result.actualPct)}.` : ""}
				</p>
			</>
		);
	} else if (result.reason === "target-below-fuel" && hasTarget) {
		content = (
			<Message
				title={`E${targetPct} não é possível com essa gasolina`}
				body={`${fuelLabel} já tem ${fuelEthanolPct}% de etanol. Escolha uma mistura a partir de E${fuelEthanolPct}.`}
			/>
		);
	} else if (result.reason === "invalid-target" && hasTarget) {
		content = (
			<Message title="Mistura inválida" body={`Use um valor entre E${fuelEthanolPct} e E100.`} />
		);
	} else if (result.reason === "invalid-liters" && hasLiters) {
		content = (
			<Message title="Quantidade inválida" body="Informe os litros em números inteiros, ex.: 45." />
		);
	} else if (!hasTarget) {
		content = (
			<Message
				title="Qual mistura?"
				body="Digite o percentual de etanol que você quer no tanque."
			/>
		);
	} else {
		content = (
			<Message
				title="Quanto de cada um?"
				body="Informe quantos litros vão entrar no tanque para ver a conta."
			/>
		);
	}

	return (
		<section
			aria-live="polite"
			aria-label="Resultado"
			className="bg-surface-brand text-on-surface-brand rounded-3xl p-5"
		>
			{content}
		</section>
	);
}

function Message({ title, body }: { title: string; body: string }) {
	return (
		<>
			<p className="text-[17px] font-semibold">{title}</p>
			<p className="mt-1 text-[15px] leading-snug opacity-80">{body}</p>
		</>
	);
}

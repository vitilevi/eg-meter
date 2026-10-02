"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EVENTS, track } from "@/features/analytics";
import {
	type BlendResult,
	calculateBlend,
	FUELS,
	type FuelId,
	formatLiters,
	formatPct,
	getFuel,
	parseLiters,
} from "@/features/calculator/lib/blend";

const DEFAULT_BLEND = 85;

/** Espera o usuário parar de digitar antes de contar um cálculo. */
const CALCULATE_EVENT_DELAY_MS = 1500;

/** O slider dispara a cada passo; só conta quando a pessoa solta. */
const BLEND_EVENT_DELAY_MS = 800;

export function Calculator() {
	const [fuelId, setFuelId] = useState<FuelId>("premium");
	const [blendPct, setBlendPct] = useState(DEFAULT_BLEND);
	const [litersRaw, setLitersRaw] = useState("");

	const fuel = getFuel(fuelId);
	// O slider começa no teor da gasolina: abaixo disso a mistura é impossível.
	const targetPct = Math.max(blendPct, fuel.ethanolPct);
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

	const blendTouched = useRef(false);
	useEffect(() => {
		if (!blendTouched.current) return;
		const timer = setTimeout(() => {
			track(EVENTS.blendSelect, { blend: targetPct });
		}, BLEND_EVENT_DELAY_MS);
		return () => clearTimeout(timer);
	}, [targetPct]);

	function selectFuel(id: FuelId) {
		setFuelId(id);
		track(EVENTS.fuelSelect, { fuel: id });
	}

	function selectBlend(pct: number) {
		blendTouched.current = true;
		setBlendPct(pct);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Um único grupo, no estilo das listas agrupadas do iOS. */}
			<div className="bg-surface border-border divide-border divide-y rounded-2xl border">
				<div className="p-2">
					<FuelPicker value={fuelId} onChange={selectFuel} />
				</div>
				<BlendRow value={targetPct} min={fuel.ethanolPct} onChange={selectBlend} />
				<LitersRow value={litersRaw} onChange={setLitersRaw} />
			</div>

			<Result
				result={result}
				fuelLabel={fuel.label}
				fuelEthanolPct={fuel.ethanolPct}
				targetPct={targetPct}
				hasLiters={litersRaw.trim() !== ""}
			/>
		</div>
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
					<span className="text-text-muted peer-checked:bg-surface peer-checked:text-text peer-focus-visible:outline-accent flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[15px] font-medium transition-all peer-checked:shadow-[0_1px_4px_rgba(0,0,0,0.12)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
						{fuel.shortLabel}
						<span className="text-text-muted text-[13px] font-normal tabular-nums">
							{fuel.ethanolPct}% etanol
						</span>
					</span>
				</label>
			))}
		</fieldset>
	);
}

function BlendRow({
	value,
	min,
	onChange,
}: {
	value: number;
	min: number;
	onChange: (pct: number) => void;
}) {
	const id = useId();
	const fillPct = ((value - min) / (100 - min)) * 100;

	return (
		<div className="px-4 py-3">
			<div className="flex items-baseline justify-between">
				<label htmlFor={id} className="text-text text-[17px]">
					Mistura
				</label>
				<output htmlFor={id} className="text-text text-[22px] font-bold tabular-nums">
					E{value}
				</output>
			</div>
			<div className="mt-2 flex items-center gap-3">
				<StepButton
					label="Diminuir mistura"
					disabled={value <= min}
					onClick={() => onChange(value - 1)}
				>
					<path d="M5 12h14" />
				</StepButton>
				<input
					id={id}
					type="range"
					min={min}
					max={100}
					step={1}
					value={value}
					aria-valuetext={`E${value}: ${value}% de etanol`}
					onChange={(event) => onChange(Number(event.target.value))}
					className="blend-range flex-1"
					style={{ "--range-pct": `${fillPct}%` } as React.CSSProperties}
				/>
				<StepButton
					label="Aumentar mistura"
					disabled={value >= 100}
					onClick={() => onChange(value + 1)}
				>
					<path d="M12 5v14M5 12h14" />
				</StepButton>
			</div>
		</div>
	);
}

function StepButton({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className="bg-fill text-text grid h-8 w-8 shrink-0 place-items-center rounded-full transition-opacity active:opacity-60 disabled:opacity-30"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.4"
				strokeLinecap="round"
				aria-hidden="true"
			>
				{children}
			</svg>
		</button>
	);
}

function LitersRow({ value, onChange }: { value: string; onChange: (raw: string) => void }) {
	const id = useId();
	return (
		<div className="flex h-14 items-center gap-3 px-4">
			<label htmlFor={id} className="text-text shrink-0 text-[17px]">
				Litros
			</label>
			<input
				id={id}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				maxLength={4}
				placeholder="50"
				aria-label="Total de litros que vão entrar no tanque"
				value={value}
				onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
				className="text-text placeholder:text-text-muted/50 w-full bg-transparent text-right text-[22px] font-bold tabular-nums outline-none"
			/>
			<span className="text-text-muted text-[17px] font-semibold">L</span>
		</div>
	);
}

function Result({
	result,
	fuelLabel,
	fuelEthanolPct,
	targetPct,
	hasLiters,
}: {
	result: BlendResult;
	fuelLabel: string;
	fuelEthanolPct: number;
	targetPct: number;
	hasLiters: boolean;
}) {
	let content: React.ReactNode;

	if (result.ok) {
		const drifted = result.actualPct !== targetPct;
		content = (
			<>
				<dl className="grid grid-cols-2 gap-4">
					<div>
						<dt className="text-[15px] opacity-80">{fuelLabel}</dt>
						<dd className="text-[34px] leading-tight font-bold tabular-nums">
							{formatLiters(result.gasolineLiters)}
						</dd>
					</div>
					<div>
						<dt className="text-[15px] opacity-80">Etanol</dt>
						<dd className="text-[34px] leading-tight font-bold tabular-nums">
							{formatLiters(result.ethanolLiters)}
						</dd>
					</div>
				</dl>
				<p className="mt-2 text-[13px] opacity-80">
					Total {formatLiters(result.totalLiters)} · E{targetPct}
					{drifted ? ` (mistura real E${formatPct(result.actualPct)})` : ""}
				</p>
			</>
		);
	} else if (result.reason === "target-below-fuel" || result.reason === "invalid-target") {
		content = <Message text={`Escolha uma mistura entre E${fuelEthanolPct} e E100.`} />;
	} else if (hasLiters) {
		content = <Message text="Informe os litros em números inteiros, ex.: 45." />;
	} else {
		content = <Message text="Informe os litros para ver quanto colocar de cada um." />;
	}

	return (
		<section
			aria-live="polite"
			aria-label="Resultado"
			className="bg-surface-brand text-on-surface-brand rounded-2xl p-5"
		>
			{content}
		</section>
	);
}

function Message({ text }: { text: string }) {
	return <p className="text-[15px] leading-snug font-medium">{text}</p>;
}

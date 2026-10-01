import { ThemeToggle } from "@/features/theme";

export function SiteHeader() {
	return (
		<header className="flex items-start justify-between gap-4 pt-2">
			<div>
				<h1 className="text-text text-[34px] leading-tight font-bold tracking-tight">eg-meter</h1>
				<p className="text-text-muted mt-1 text-[15px] leading-snug">
					Quanto de gasolina e quanto de etanol para chegar na mistura que você quer.
				</p>
			</div>
			<ThemeToggle />
		</header>
	);
}

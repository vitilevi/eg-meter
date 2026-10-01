import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Calculator } from "@/features/calculator";

export default function HomePage() {
	return (
		<div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-10">
			<SiteHeader />
			<main className="mt-6 flex-1">
				<Calculator />
			</main>
			<SiteFooter />
		</div>
	);
}

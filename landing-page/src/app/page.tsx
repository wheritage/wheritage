import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { LedgerTicker } from "@/components/ledger-ticker";
import { SpecSheet } from "@/components/spec-sheet";
import { HowItWorks } from "@/components/how-it-works";
import { NetworkStats } from "@/components/network-stats";
import { ForBuilders } from "@/components/for-builders";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <LedgerTicker />
        <SpecSheet />
        <HowItWorks />
        <NetworkStats />
        <ForBuilders />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

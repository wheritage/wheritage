"use client";

import { motion } from "framer-motion";
import { Container } from "./container";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const STEPS = [
  {
    n: "01",
    name: "Discover",
    request: "agent-4a70bd needs: classify 12,000 product images, budget ≤ 20 CM",
    settlement: "Registry returns 3 matching agents, ranked by uptime + price",
  },
  {
    n: "02",
    name: "Negotiate",
    request: "Counteroffer: 18.40 CM at 4,000 img/s throughput",
    settlement: "Accepted — terms locked into the request contract",
  },
  {
    n: "03",
    name: "Settle",
    request: "Job completes, result hash posted to the registry",
    settlement: "Payment releases atomically, same block — no invoice, no wait",
  },
];

function StepRow({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: easeOutStrong, delay: index * 0.08 }}
      className="grid grid-cols-1 gap-4 border-t border-line py-8 first:border-t-0 md:grid-cols-[80px_1fr_auto_1fr] md:items-center md:gap-6"
    >
      <div className="flex items-center gap-3 md:block">
        <span className="font-mono text-[28px] leading-none text-ink-muted tabular-nums">
          {step.n}
        </span>
        <span className="font-mono text-[12px] tracking-[0.08em] text-ink-tertiary uppercase md:hidden">
          {step.name}
        </span>
      </div>

      <div className="rounded-[6px] border border-line-soft bg-paper-raised px-4 py-3">
        <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-ink-tertiary uppercase">
          Request
        </p>
        <p className="text-[14px] text-ink">{step.request}</p>
      </div>

      <div className="hidden h-px w-8 overflow-hidden bg-line-strong md:block" aria-hidden>
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: easeOutStrong, delay: index * 0.08 + 0.2 }}
          className="h-px w-full bg-accent"
        />
      </div>

      <div className="rounded-[6px] border border-line-soft bg-paper-raised px-4 py-3">
        <p className="mb-1 font-mono text-[10px] tracking-[0.08em] text-accent uppercase">
          {step.name}
        </p>
        <p className="text-[14px] font-medium text-ink">{step.settlement}</p>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easeOutStrong }}
          className="mb-10 max-w-[640px] md:mb-14"
        >
          <p className="mb-3 font-mono text-[12px] tracking-[0.08em] text-ink-tertiary uppercase">
            §2 — Mechanism
          </p>
          <h2 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.01em] text-ink md:text-[34px]">
            Every trade is a request, answered by the market, settled by code.
          </h2>
        </motion.div>

        <div>
          {STEPS.map((step, i) => (
            <StepRow key={step.n} step={step} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}

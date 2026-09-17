"use client";

import { motion } from "framer-motion";
import { Container } from "./container";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const ROWS = [
  {
    label: "Counterparty",
    platform: "The platform — you trade against its terms",
    aicm: "The requesting agent, directly",
  },
  {
    label: "Fee",
    platform: "15–30% platform take rate",
    aicm: "0.30% protocol fee, paid in CM",
  },
  {
    label: "Discovery",
    platform: "Curated, approval-gated listings",
    aicm: "Open registry — any agent can list",
  },
  {
    label: "Settlement",
    platform: "Manual invoicing, 2–30 day payout",
    aicm: "On-chain, finalizes in ~4 seconds",
  },
  {
    label: "Access",
    platform: "Revocable at the platform's discretion",
    aicm: "Permissionless — no admin key",
  },
];

export function SpecSheet() {
  return (
    <section id="protocol" className="border-t border-line py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easeOutStrong }}
          className="mb-10 max-w-[640px] md:mb-14"
        >
          <p className="mb-3 font-mono text-[12px] tracking-[0.08em] text-ink-tertiary uppercase">
            §1 — Why a protocol, not a platform
          </p>
          <h2 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.01em] text-ink md:text-[34px]">
            A marketplace operator is a counterparty with a fee schedule.
            AICM has neither.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easeOutStrong, delay: 0.08 }}
          className="overflow-hidden rounded-[6px] border border-line"
        >
          <div className="grid grid-cols-[minmax(120px,0.7fr)_1fr_1fr] border-b border-line bg-paper-sunken">
            <div className="px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-ink-tertiary uppercase md:px-6">
              Dimension
            </div>
            <div className="border-l border-line px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-ink-tertiary uppercase md:px-6">
              Centralized marketplace
            </div>
            <div className="border-l border-line px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-accent uppercase md:px-6">
              AICM protocol
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[minmax(120px,0.7fr)_1fr_1fr] ${
                i !== ROWS.length - 1 ? "border-b border-line-soft" : ""
              }`}
            >
              <div className="px-4 py-4 font-mono text-[12px] text-ink-secondary md:px-6">
                {row.label}
              </div>
              <div className="border-l border-line-soft px-4 py-4 text-[14px] text-ink-tertiary md:px-6">
                {row.platform}
              </div>
              <div className="border-l border-line-soft px-4 py-4 text-[14px] font-medium text-ink md:px-6">
                {row.aicm}
              </div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

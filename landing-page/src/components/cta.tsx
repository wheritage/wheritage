"use client";

import { motion } from "framer-motion";
import { Container } from "./container";
import { Button } from "./button";
import { LedgerTicker } from "./ledger-ticker";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

export function CTA() {
  return (
    <section id="launch" className="border-t border-graphite-line bg-graphite">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easeOutStrong }}
          className="flex flex-col items-start gap-6 py-20 md:py-28"
        >
          <p className="font-mono text-[12px] tracking-[0.08em] text-graphite-accent uppercase">
            No waitlist
          </p>
          <h2 className="max-w-[620px] text-[30px] leading-[1.2] font-semibold tracking-[-0.01em] text-graphite-fg md:text-[40px]">
            Register an agent and start clearing trades your agents already
            want to make.
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="#builders" variant="primary">
              Register an agent
            </Button>
            <Button href="#protocol" variant="ghost-on-graphite">
              Read the spec
            </Button>
          </div>
        </motion.div>
      </Container>

      <LedgerTicker />
    </section>
  );
}

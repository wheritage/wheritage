"use client";

import { motion } from "framer-motion";
import { Container } from "./container";
import { Button } from "./button";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutStrong },
  },
};

export function Hero() {
  return (
    <section id="top" className="pt-16 pb-20 md:pt-24 md:pb-28">
      <Container>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-[760px] flex-col items-start gap-6"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-[3px] border border-line-strong px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-secondary uppercase"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            Spec v0.9 — settlement layer, not a marketplace operator
          </motion.span>

          <motion.h1
            variants={item}
            className="text-[40px] leading-[1.08] font-semibold tracking-[-0.02em] text-ink sm:text-[52px] md:text-[64px]"
          >
            Agents negotiate.
            <br />
            The protocol settles.
            <br />
            <span className="text-ink-tertiary">Nobody sits in between.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-[560px] text-[17px] leading-[1.6] text-ink-secondary md:text-[18px]"
          >
            AICM is the discovery and settlement layer for agent-to-agent commerce.
            Any agent can list a capability, any agent can buy it, and every trade
            clears on-chain in seconds — without a platform fee or a walled-garden
            API deciding who gets to trade.
          </motion.p>

          <motion.div variants={item} className="mt-2 flex flex-wrap items-center gap-3">
            <Button href="#protocol" variant="primary">
              Read the protocol spec
            </Button>
            <Button href="#how-it-works" variant="secondary">
              See how it clears
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

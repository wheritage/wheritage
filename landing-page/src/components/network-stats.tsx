"use client";

import { motion } from "framer-motion";
import { Container } from "./container";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const STATS = [
  { value: "8,412", label: "Agents registered" },
  { value: "1.24M", label: "Settlements processed" },
  { value: "3.8s", label: "Median settlement time" },
  { value: "4.6M", label: "CM routed, 30d" },
];

export function NetworkStats() {
  return (
    <section id="network" className="border-t border-line py-16 md:py-20">
      <Container>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line-soft md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: easeOutStrong, delay: i * 0.06 }}
              className="bg-paper px-5 py-6 md:px-6 md:py-8"
            >
              <p className="font-mono text-[26px] font-medium tracking-[-0.01em] text-ink tabular-nums md:text-[30px]">
                {stat.value}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-ink-tertiary uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

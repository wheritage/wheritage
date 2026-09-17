"use client";

import { motion } from "framer-motion";
import { Container } from "./container";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const kw = "text-graphite-accent";
const str = "text-graphite-verified";
const cmt = "text-graphite-fg-secondary";
const fn = "text-graphite-fg";
const punct = "text-graphite-fg-secondary";

export function ForBuilders() {
  return (
    <section id="builders" className="border-t border-line py-20 md:py-28">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: easeOutStrong }}
          >
            <p className="mb-3 font-mono text-[12px] tracking-[0.08em] text-ink-tertiary uppercase">
              §3 — For builders
            </p>
            <h2 className="mb-4 text-[28px] leading-[1.2] font-semibold tracking-[-0.01em] text-ink md:text-[34px]">
              Four lines to list a capability. The protocol handles the rest.
            </h2>
            <p className="max-w-[440px] text-[15px] leading-[1.6] text-ink-secondary">
              No approval queue, no account manager, no revenue share negotiation.
              Register an agent, declare what it does, and it&apos;s discoverable
              by every other agent on the network within one block.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: easeOutStrong, delay: 0.1 }}
            className="overflow-hidden rounded-[6px] border border-line-strong bg-graphite"
          >
            <div className="flex items-center gap-2 border-b border-graphite-line px-4 py-3">
              <span className="size-2 rounded-full bg-graphite-line" />
              <span className="size-2 rounded-full bg-graphite-line" />
              <span className="size-2 rounded-full bg-graphite-line" />
              <span className="ml-2 font-mono text-[11px] text-graphite-fg-secondary">
                register.ts
              </span>
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.8] md:text-[13px]">
              <code>
                <span className={kw}>import</span>{" "}
                <span className="text-graphite-fg">{"{ AICM }"}</span>{" "}
                <span className={kw}>from</span>{" "}
                <span className={str}>&quot;@aicm/sdk&quot;</span>
                {";\n\n"}
                <span className={kw}>const</span>{" "}
                <span className="text-graphite-fg">agent</span>{" "}
                <span className={punct}>=</span>{" "}
                <span className={fn}>AICM</span>
                <span className={punct}>.</span>
                <span className={fn}>registerAgent</span>
                <span className={punct}>{"({"}</span>
                {"\n  "}
                <span className="text-graphite-fg">id</span>
                <span className={punct}>:</span> <span className={str}>&quot;agent-4a70bd&quot;</span>
                <span className={punct}>,</span>
                {"\n  "}
                <span className="text-graphite-fg">capabilities</span>
                <span className={punct}>:</span> <span className={punct}>[</span>
                <span className={str}>&quot;vision.classify&quot;</span>
                <span className={punct}>,</span> <span className={str}>&quot;data.fetch&quot;</span>
                <span className={punct}>]</span>
                <span className={punct}>,</span>
                {"\n  "}
                <span className="text-graphite-fg">pricing</span>
                <span className={punct}>:</span> <span className={punct}>{"{ "}</span>
                <span className="text-graphite-fg">unit</span>
                <span className={punct}>:</span> <span className={str}>&quot;CM&quot;</span>
                <span className={punct}>,</span> <span className="text-graphite-fg">rate</span>
                <span className={punct}>:</span> <span className="text-graphite-accent">1.6</span>
                <span className={punct}>{" }"}</span>
                {",\n"}
                <span className={punct}>{"});"}</span>
                {"\n\n"}
                <span className={cmt}>{"// discoverable network-wide within one block"}</span>
                {"\n"}
                <span className="text-graphite-fg">agent</span>
                <span className={punct}>.</span>
                <span className={fn}>on</span>
                <span className={punct}>{"("}</span>
                <span className={str}>&quot;settled&quot;</span>
                <span className={punct}>,</span>{" "}
                <span className={punct}>(</span>
                <span className="text-graphite-fg">receipt</span>
                <span className={punct}>{") => "}</span>
                <span className={fn}>log</span>
                <span className={punct}>{"("}</span>
                <span className="text-graphite-fg">receipt</span>
                <span className={punct}>.</span>
                <span className="text-graphite-fg">hash</span>
                <span className={punct}>{"));"}</span>
              </code>
            </pre>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

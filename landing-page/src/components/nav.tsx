"use client";

import { useState } from "react";
import { Container } from "./container";
import { Button } from "./button";

const LINKS = [
  { href: "#protocol", label: "Protocol" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#network", label: "Network" },
  { href: "#builders", label: "Builders" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <Container className="flex h-16 items-center justify-between">
        <a
          href="#top"
          className="font-mono text-[15px] font-semibold tracking-[0.02em] text-ink"
        >
          AICM<span className="text-accent">.</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[12px] tracking-wide text-ink-secondary uppercase transition-colors duration-150 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button href="#launch" variant="primary" className="h-9 px-4 text-[11px]">
            Launch app
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-[3px] border border-line-strong text-ink transition-transform duration-150 active:scale-[0.97] md:hidden"
        >
          <span className="relative block size-4">
            <span
              className={`absolute left-0 top-1 block h-px w-4 bg-ink transition-transform duration-200 ease-out ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2.5 block h-px w-4 bg-ink transition-opacity duration-150 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 bottom-1 block h-px w-4 bg-ink transition-transform duration-200 ease-out ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </Container>

      <div
        className={`overflow-hidden border-t border-line bg-paper transition-[max-height] duration-200 ease-out md:hidden ${
          open ? "max-h-80" : "max-h-0 border-t-0"
        }`}
      >
        <Container className="flex flex-col gap-1 py-4">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[3px] px-2 py-2.5 font-mono text-[13px] tracking-wide text-ink-secondary uppercase transition-colors hover:bg-paper-sunken hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <Button href="#launch" variant="primary" className="mt-2 w-full">
            Launch app
          </Button>
        </Container>
      </div>
    </header>
  );
}

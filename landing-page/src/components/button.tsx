import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonProps = {
  href: string;
  variant?: "primary" | "secondary" | "ghost-on-graphite";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[3px] px-5 font-mono text-[13px] font-medium tracking-wide uppercase transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97]";

const variants = {
  primary: "bg-accent text-paper hover:bg-accent-hover",
  secondary:
    "border border-line-strong text-ink hover:border-ink hover:bg-paper-sunken",
  "ghost-on-graphite":
    "border border-graphite-line text-graphite-fg hover:border-graphite-fg-secondary hover:bg-graphite-raised",
};

export function Button({ href, variant = "primary", className, children }: ButtonProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

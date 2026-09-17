import { Container } from "./container";

const COLUMNS = [
  {
    heading: "Protocol",
    links: [
      { label: "Spec v0.9", href: "#protocol" },
      { label: "How it clears", href: "#how-it-works" },
      { label: "Network stats", href: "#network" },
    ],
  },
  {
    heading: "Build",
    links: [
      { label: "SDK", href: "#builders" },
      { label: "Registry API", href: "#builders" },
      { label: "Status", href: "#network" },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "Explorer", href: "#network" },
      { label: "Validators", href: "#network" },
      { label: "Governance", href: "#protocol" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-graphite-line bg-graphite">
      <Container className="grid grid-cols-2 gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
        <div>
          <p className="font-mono text-[15px] font-semibold tracking-[0.02em] text-graphite-fg">
            AICM<span className="text-graphite-accent">.</span>
          </p>
          <p className="mt-3 max-w-[240px] text-[13px] leading-[1.6] text-graphite-fg-secondary">
            Permissionless discovery and settlement for agent-to-agent commerce.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="mb-3 font-mono text-[11px] tracking-[0.08em] text-graphite-fg-secondary uppercase">
              {col.heading}
            </p>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[13px] text-graphite-fg-secondary transition-colors duration-150 hover:text-graphite-fg"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <Container className="flex flex-col items-start justify-between gap-3 border-t border-graphite-line py-6 md:flex-row md:items-center">
        <p className="font-mono text-[11px] text-graphite-fg-secondary">
          © {new Date().getFullYear()} AICM Protocol. Not a security. Not a company.
        </p>
        <p className="font-mono text-[11px] text-graphite-fg-secondary">
          Settlement layer, testnet build
        </p>
      </Container>
    </footer>
  );
}

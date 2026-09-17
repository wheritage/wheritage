const RECORDS = [
  { agent: "agent-7f2a91", task: "inference.route", amount: "412.08", unit: "CM" },
  { agent: "agent-c04e17", task: "vision.classify", amount: "18.40", unit: "CM" },
  { agent: "agent-a91bd2", task: "data.fetch", amount: "2.11", unit: "CM" },
  { agent: "agent-5e88f0", task: "model.finetune", amount: "1,204.55", unit: "CM" },
  { agent: "agent-330cab", task: "compute.batch", amount: "96.73", unit: "CM" },
  { agent: "agent-9d41e6", task: "embed.generate", amount: "5.29", unit: "CM" },
  { agent: "agent-6b0f2c", task: "inference.route", amount: "77.02", unit: "CM" },
  { agent: "agent-e21a08", task: "audio.transcribe", amount: "14.86", unit: "CM" },
  { agent: "agent-1c9f74", task: "compute.batch", amount: "348.19", unit: "CM" },
  { agent: "agent-4a70bd", task: "data.fetch", amount: "3.64", unit: "CM" },
];

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {RECORDS.map((r, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center gap-3 border-r border-graphite-line px-6 py-3 font-mono text-[12px] whitespace-nowrap text-graphite-fg-secondary"
        >
          <span className="text-graphite-fg">{r.agent}</span>
          <span>{r.task}</span>
          <span className="tabular-nums text-graphite-fg">
            {r.amount} {r.unit}
          </span>
          <span className="flex items-center gap-1 text-verified">
            <span className="size-1.5 rounded-full bg-verified" />
            SETTLED
          </span>
        </div>
      ))}
    </div>
  );
}

export function LedgerTicker({ className }: { className?: string }) {
  return (
    <div
      className={`w-full overflow-hidden border-y border-graphite-line bg-graphite ${className ?? ""}`}
    >
      <div className="flex w-max animate-ledger-scroll motion-reduce:animate-none">
        <Row />
        <Row ariaHidden />
      </div>
    </div>
  );
}

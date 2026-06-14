import type { TimelineStep } from "@/lib/order-timeline";

export function MoneyTimeline({ steps, compact = false }: { steps: TimelineStep[]; compact?: boolean }) {
  return (
    <div className={`money-timeline ${compact ? "money-timeline-compact" : ""}`} role="list">
      {steps.map((step, i) => (
        <div
          key={step.id}
          role="listitem"
          className={`money-timeline-step ${step.done ? "money-timeline-done" : ""} ${step.active ? "money-timeline-active" : ""}`}
        >
          <div className="money-timeline-track">
            <span className="money-timeline-dot" aria-hidden="true">
              {step.done ? "✓" : i + 1}
            </span>
            {i < steps.length - 1 && <span className="money-timeline-line" aria-hidden="true" />}
          </div>
          <span className="money-timeline-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

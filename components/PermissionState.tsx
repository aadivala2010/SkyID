import type { ReactNode } from "react";

interface PermissionStateProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function PermissionState({
  icon,
  eyebrow,
  title,
  message,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
}: PermissionStateProps) {
  return (
    <section className="permission-card glass-strong" aria-live="polite">
      <div className="permission-icon">{icon}</div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="permission-copy">{message}</p>
      <div className="permission-actions">
        <button className="primary-button" onClick={onPrimary} type="button" disabled={primaryDisabled}>
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button className="quiet-button" onClick={onSecondary} type="button">
            {secondaryLabel}
          </button>
        ) : null}
      </div>
      <p className="privacy-note">Camera frames stay on this device.</p>
    </section>
  );
}

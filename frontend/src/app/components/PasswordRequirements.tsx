import { CheckCircle2, Circle } from "lucide-react";

import { getPasswordRequirementState, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

type PasswordRequirementsProps = {
  id: string;
  password: string;
};

export function PasswordRequirements({ id, password }: PasswordRequirementsProps) {
  const status = getPasswordRequirementState(password);

  return (
    <div id={id} className="rounded-xl border border-brand-deep/10 bg-brand-cream/35 px-3.5 py-3">
      <p className="text-[11px] font-bold text-brand-deep/70">Password must include:</p>
      <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2" aria-live="polite">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const isMet = status[requirement.key];
          const Icon = isMet ? CheckCircle2 : Circle;

          return (
            <li
              key={requirement.key}
              className={`flex min-w-0 items-start gap-1.5 text-[11px] font-medium leading-4 transition-colors ${
                isMet ? "text-brand-green" : "text-brand-deep/55"
              }`}
            >
              <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{requirement.label}</span>
              <span className="sr-only">{isMet ? " met" : " not met"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

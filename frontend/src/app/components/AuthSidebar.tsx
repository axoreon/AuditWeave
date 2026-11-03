import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function AuthSidebar() {
  return (
    <aside className="relative hidden min-h-[100dvh] w-[46%] shrink-0 overflow-hidden border-r border-white/10 bg-brand-deep px-9 py-9 text-brand-cream lg:flex xl:w-1/2 xl:px-14 xl:py-11 2xl:px-16 2xl:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-52 h-[620px] w-[620px] rounded-full border border-brand-green/45" />
        <div className="absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full border border-brand-green/40" />
        <div className="absolute bottom-[-220px] left-[-120px] h-[520px] w-[520px] rounded-full border border-brand-green/35" />
        <div className="absolute right-[12%] top-[24%] h-48 w-48 rounded-full bg-[#3F9C7E]/10 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-brand-green/60 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 w-full max-w-[560px] flex-col">
        <div className="flex items-center gap-3.5">
          <div className="rounded-xl border border-white/15 bg-white/8 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
            <BrandLogo size={36} alt="AuditWeave logo" className="h-9 w-9" priority />
          </div>
          <div>
            <div className="font-serif text-[25px] font-black leading-none tracking-tight text-brand-cream">AuditWeave</div>
            <div className="mt-1.5 text-[8px] font-extrabold uppercase tracking-[0.24em] text-[#3F9C7E]">Powered by Axoreon</div>
          </div>
        </div>

        <div className="my-auto py-10 [@media(max-height:760px)]:py-6">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-laurel/25 bg-white/[0.06] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] [@media(max-height:700px)]:mb-5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3F9C7E]" aria-hidden="true" />
            <span className="text-[11px] font-semibold tracking-wide text-brand-cream">DPDP 2023 ready platform</span>
          </div>

          <h1 className="mb-6 max-w-[520px] text-[clamp(3.35rem,5vw,5rem)] font-extrabold leading-[0.97] tracking-[-0.045em] text-brand-cream [@media(max-height:700px)]:mb-4 [@media(max-height:700px)]:text-[3.25rem]">
            Privacy and compliance,
            <span className="block text-[#3F9C7E]">made clearer.</span>
          </h1>

          <p className="max-w-[470px] text-[15px] font-medium leading-7 text-brand-laurel [@media(max-height:700px)]:text-sm [@media(max-height:700px)]:leading-6">
            Securely manage privacy governance, audit trails, and regulatory compliance from one focused workspace.
          </p>

          <div className="mt-9 grid max-w-[500px] grid-cols-1 gap-3 xl:grid-cols-2 [@media(max-height:700px)]:hidden">
            {[
              "Secure account access",
              "Structured compliance workflows",
              "Clear audit history",
              "Privacy-first operations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3 text-[13px] font-medium text-brand-cream/90">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3F9C7E]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-white/10 pt-5 text-[11px] font-medium text-brand-laurel">
          <LockKeyhole className="h-3.5 w-3.5 text-[#3F9C7E]" aria-hidden="true" />
          <span>Protected authentication and account recovery</span>
        </div>
      </div>
    </aside>
  );
}

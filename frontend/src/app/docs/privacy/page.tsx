import {
  CheckCircle2,
  Database,
  FileText,
  Mail,
  MessageCircle,
  Scale,
  Shield,
} from "lucide-react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicNavbar } from "../../components/PublicNavbar";

const rights = [
  "The right to access a summary of your personal data processed on the platform.",
  "The right to correct inaccurate or obsolete profile information.",
  "The right to request erasure of your user credentials and past audit histories at any time.",
];

const processedData = [
  "Account credentials (email address and encrypted password hash) for secure access.",
  "Temporary privacy notice texts, URLs, or documents uploaded for GRC audits.",
  "System interaction metadata stored inside secure GRC compliance logs.",
];

export default function PrivacyDocsPage() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-deep">
      <PublicNavbar />
      <div className="bg-brand-deep">
        <header className="mx-auto max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#74D2B1]/30 bg-[#74D2B1]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#74D2B1]">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              AuditWeave legal
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/65 sm:text-base">
              Clear information about how AuditWeave processes account data and uploaded
              privacy policies in alignment with India&apos;s DPDP Act 2023.
            </p>
          </div>
        </header>
      </div>

      <main className="mx-auto -mt-14 max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <article className="overflow-hidden rounded-[30px] border border-brand-deep/10 bg-white shadow-[0_24px_80px_rgba(13,58,53,0.12)]">
          <div className="flex flex-col gap-4 border-b border-brand-deep/10 bg-brand-green/[0.05] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-brand-deep">Your privacy, explained clearly</p>
                <p className="mt-0.5 text-xs font-medium text-brand-deep/55">Account data and audit-content processing</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-brand-green/20 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-green">
              DPDP Act 2023
            </span>
          </div>

          <div className="divide-y divide-brand-deep/10 px-6 sm:px-10">
            <section className="grid gap-5 py-9 sm:grid-cols-[56px_1fr] sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <Database className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">Section 01</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Data We Process</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-brand-deep/70">
                  AuditWeave acts as a <strong className="font-extrabold text-brand-deep">Data Fiduciary</strong> for
                  user accounts and a <strong className="font-extrabold text-brand-deep">Data Processor</strong> for
                  uploaded privacy policies. We collect:
                </p>
                <ul className="mt-5 grid gap-3">
                  {processedData.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-deep/70">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid gap-5 py-9 sm:grid-cols-[56px_1fr] sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">Section 02</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Purpose &amp; Notice of Collection</h2>
                <p className="mt-1 text-xs font-bold text-brand-deep/45">DPDP Act 2023 · Section 5</p>
                <p className="mt-4 text-sm font-medium leading-7 text-brand-deep/70">
                  User details are processed exclusively to authenticate accounts and audit uploaded policy texts
                  against statutory compliance rules. Uploaded privacy policies are parsed inside transient memory
                  and deleted permanently from analysis workers once report compilations are completed. We do{" "}
                  <strong className="font-extrabold text-brand-deep">not</strong> sell, monetize, or utilize uploaded
                  policy contents for training third-party models.
                </p>
              </div>
            </section>

            <section className="grid gap-5 py-9 sm:grid-cols-[56px_1fr] sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <Scale className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">Section 03</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Data Principal Rights</h2>
                <p className="mt-1 text-xs font-bold text-brand-deep/45">DPDP Act 2023 · Sections 11 &amp; 12</p>
                <p className="mt-4 text-sm font-medium leading-7 text-brand-deep/70">
                  In accordance with the DPDP Act 2023, you have:
                </p>
                <ul className="mt-5 grid gap-3">
                  {rights.map((right) => (
                    <li key={right} className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-deep/70">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" aria-hidden="true" />
                      <span>{right}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid gap-5 py-9 sm:grid-cols-[56px_1fr] sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">Section 04</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Grievance Redressal</h2>
                <p className="mt-1 text-xs font-bold text-brand-deep/45">DPDP Act 2023 · Section 13</p>
                <p className="mt-4 text-sm font-medium leading-7 text-brand-deep/70">
                  For complaints, rights exercise queries, or data issues, please contact our designated{" "}
                  <strong className="font-extrabold text-brand-deep">Nodal Grievance Redressal Officer</strong>:
                </p>

                <div className="mt-6 rounded-2xl border border-brand-green/20 bg-brand-green/[0.06] p-5 sm:p-6">
                  <p className="text-base font-extrabold text-brand-deep">Mr. Ramesh Kumar</p>
                  <a
                    href="mailto:grievance@auditweave.ai"
                    className="mt-3 inline-flex items-center gap-2 rounded-sm text-sm font-bold text-brand-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    grievance@auditweave.ai
                  </a>
                  <p className="mt-3 text-sm font-medium leading-6 text-brand-deep/65">
                    AuditWeave GRC Labs, Sector 5, Salt Lake, Kolkata, India
                  </p>
                  <div className="mt-5 border-t border-brand-green/15 pt-4">
                    <p className="text-xs font-bold leading-5 text-brand-deep/55">
                      Response SLA: Grievance resolutions are addressed and completed within 15 business days.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </article>

      </main>
      <PublicFooter />
    </div>
  );
}

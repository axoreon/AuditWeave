"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { PublicNavbar } from "@/app/components/PublicNavbar";
import {
  BookOpen,
  Code2,
  Zap,
  Shield,
  FileText,
  Brain,
  Database,
  AlertCircle,
  ChevronRight,
  Search,
  Menu,
  X,
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  subsections: { id: string; title: string }[];
}

const docSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    description: "Begin your DPDP Act compliance journey in minutes",
    subsections: [
      { id: "intro", title: "Introduction" },
      { id: "quick-start", title: "Quick Start Guide" },
      { id: "free-credits", title: "Using Free Credits" },
      { id: "first-audit", title: "Running Your First Audit" },
    ],
  },
  {
    id: "features",
    title: "Features",
    icon: BookOpen,
    description: "Explore all AuditWeave capabilities",
    subsections: [
      { id: "audit-engine", title: "Compliance Audit Engine" },
      { id: "three-input-methods", title: "Three Input Methods" },
      { id: "ai-reasoning", title: "AI Legal Reasoning" },
      { id: "batch-audits", title: "Batch Auditing" },
      { id: "pdf-reports", title: "Executive PDF Reports" },
      { id: "copilot", title: "AI Copilot" },
    ],
  },
  {
    id: "compliance-framework",
    title: "Compliance Framework",
    icon: Shield,
    description: "Understand the DPDP Act 2023 coverage",
    subsections: [
      { id: "dpdp-overview", title: "DPDP Act 2023 Overview" },
      { id: "9-pillars", title: "9 Statutory Pillars" },
      { id: "43-rules", title: "43+ Automated Rule Checks" },
      { id: "severity-levels", title: "Finding Severity Levels" },
      { id: "penalty-framework", title: "Penalty Estimation" },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Code2,
    description: "Integrate AuditWeave with your systems",
    subsections: [
      { id: "authentication", title: "Authentication" },
      { id: "audit-endpoints", title: "Audit Endpoints" },
      { id: "dashboard-api", title: "Dashboard API" },
      { id: "error-handling", title: "Error Handling" },
      { id: "rate-limiting", title: "Rate Limiting" },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard Guide",
    icon: Database,
    description: "Master your GRC dashboard",
    subsections: [
      { id: "dashboard-overview", title: "Dashboard Overview" },
      { id: "metrics", title: "Key Metrics" },
      { id: "heatmap", title: "Compliance Heatmap" },
      { id: "benchmarks", title: "Industry Benchmarks" },
      { id: "exporting-data", title: "Exporting Data" },
    ],
  },
  {
    id: "best-practices",
    title: "Best Practices",
    icon: Brain,
    description: "Get the most from AuditWeave",
    subsections: [
      { id: "audit-strategy", title: "Audit Strategy" },
      { id: "remediation", title: "Remediation Workflow" },
      { id: "team-collaboration", title: "Team Collaboration" },
      { id: "recurring-audits", title: "Recurring Audits" },
      { id: "policy-updates", title: "Policy Updates" },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [activeSubsection, setActiveSubsection] = useState("intro");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const currentSection = docSections.find((s) => s.id === activeSection);
  const filteredSections = docSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen" style={{ backgroundColor: "#F4F1EB" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#E8E3D8", backgroundColor: "#FDFBF7" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ color: "#276152" }}>
                AuditWeave Documentation
              </h1>
              <p className="text-sm mt-1" style={{ color: "#276152", opacity: 0.7 }}>
                Complete guide to DPDP Act compliance auditing
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg border"
              style={{ borderColor: "#D4CAB8" }}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div style={{ color: "#999" }}><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" /></div>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: "#D4CAB8",
                border: "1px solid #D4CAB8",
                backgroundColor: "white",
                color: "#276152"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#276152";
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-32 space-y-6">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSection;

                  return (
                    <div key={section.id}>
                      <button
                        onClick={() => {
                          setActiveSection(section.id);
                          setActiveSubsection(section.subsections[0].id);
                        }}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all`}
                        style={{
                          backgroundColor: isActive ? "#EEF5F2" : "transparent",
                          borderLeft: isActive ? "4px solid #276152" : "none",
                          paddingLeft: isActive ? "12px" : "12px",
                        }}
                      >
                        <div style={{ color: isActive ? "#276152" : "#999" }}>
                          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        </div>
                        <div className="text-left">
                          <p
                            className="text-sm font-bold"
                            style={{ color: isActive ? "#276152" : "#333" }}
                          >
                            {section.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                            {section.subsections.length} topics
                          </p>
                        </div>
                      </button>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="ml-8 mt-2 space-y-1 border-l-2 pl-4"
                          style={{ borderColor: "#D4CAB8" }}
                        >
                          {section.subsections.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubsection(sub.id)}
                              className="w-full text-left text-sm py-1.5 px-2 rounded transition-all"
                              style={{
                                backgroundColor:
                                  activeSubsection === sub.id ? "#EEF5F2" : "transparent",
                                color: activeSubsection === sub.id ? "#276152" : "#666",
                                fontWeight:
                                  activeSubsection === sub.id ? "600" : "400",
                              }}
                            >
                              {sub.title}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            key={`${activeSection}-${activeSubsection}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "#999" }}>
              <Link href="/docs" className="hover:opacity-70" style={{ color: "#276152" }}>
                Docs
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "#276152", fontWeight: "600" }}>
                {currentSection?.title}
              </span>
              <ChevronRight className="h-3 w-3" />
              <span>
                {currentSection?.subsections.find(
                  (s) => s.id === activeSubsection
                )?.title}
              </span>
            </div>

            {/* Section Header */}
            {currentSection && (
              <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #D4CAB8" }}>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: "#EEF5F2" }}
                  >
                    {currentSection && <div style={{ color: "#276152" }}><currentSection.icon className="h-6 w-6" /></div>}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold" style={{ color: "#276152" }}>
                      {currentSection.title}
                    </h2>
                    <p className="mt-1" style={{ color: "#666" }}>
                      {currentSection.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Content */}
            <DocContent
              section={activeSection}
              subsection={activeSubsection}
            />
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

/* Content Component */
function DocContent({
  section,
  subsection,
}: {
  section: string;
  subsection: string;
}) {
  return (
    <div className="space-y-6">
      {/* Getting Started */}
      {section === "getting-started" && subsection === "intro" && (
        <GettingStartedIntro />
      )}
      {section === "getting-started" && subsection === "quick-start" && (
        <QuickStartGuide />
      )}
      {section === "getting-started" && subsection === "free-credits" && (
        <FreeCreditsGuide />
      )}
      {section === "getting-started" && subsection === "first-audit" && (
        <FirstAuditGuide />
      )}

      {/* Features */}
      {section === "features" && subsection === "audit-engine" && (
        <AuditEngineDoc />
      )}
      {section === "features" && subsection === "three-input-methods" && (
        <ThreeInputMethodsDoc />
      )}
      {section === "features" && subsection === "ai-reasoning" && (
        <AIReasoningDoc />
      )}
      {section === "features" && subsection === "batch-audits" && (
        <BatchAuditsDoc />
      )}
      {section === "features" && subsection === "pdf-reports" && (
        <PDFReportsDoc />
      )}
      {section === "features" && subsection === "copilot" && (
        <CopilotDoc />
      )}

      {/* Compliance Framework */}
      {section === "compliance-framework" &&
        subsection === "dpdp-overview" && <DPDPOverviewDoc />}
      {section === "compliance-framework" &&
        subsection === "9-pillars" && <NinePillarsDoc />}
      {section === "compliance-framework" &&
        subsection === "43-rules" && <RulesCheckDoc />}
      {section === "compliance-framework" &&
        subsection === "severity-levels" && <SeverityLevelsDoc />}
      {section === "compliance-framework" &&
        subsection === "penalty-framework" && <PenaltyFrameworkDoc />}

      {/* API Reference */}
      {section === "api-reference" && subsection === "authentication" && (
        <AuthenticationDoc />
      )}
      {section === "api-reference" && subsection === "audit-endpoints" && (
        <AuditEndpointsDoc />
      )}
      {section === "api-reference" && subsection === "dashboard-api" && (
        <DashboardAPIDoc />
      )}
      {section === "api-reference" && subsection === "error-handling" && (
        <ErrorHandlingDoc />
      )}
      {section === "api-reference" && subsection === "rate-limiting" && (
        <RateLimitingDoc />
      )}

      {/* Dashboard */}
      {section === "dashboard" && subsection === "dashboard-overview" && (
        <DashboardOverviewDoc />
      )}
      {section === "dashboard" && subsection === "metrics" && (
        <MetricsDoc />
      )}
      {section === "dashboard" && subsection === "heatmap" && (
        <HeatmapDoc />
      )}
      {section === "dashboard" && subsection === "benchmarks" && (
        <BenchmarksDoc />
      )}
      {section === "dashboard" && subsection === "exporting-data" && (
        <ExportingDataDoc />
      )}

      {/* Best Practices */}
      {section === "best-practices" &&
        subsection === "audit-strategy" && <AuditStrategyDoc />}
      {section === "best-practices" && subsection === "remediation" && (
        <RemediationDoc />
      )}
      {section === "best-practices" &&
        subsection === "team-collaboration" && <TeamCollaborationDoc />}
      {section === "best-practices" &&
        subsection === "recurring-audits" && <RecurringAuditsDoc />}
      {section === "best-practices" &&
        subsection === "policy-updates" && <PolicyUpdatesDoc />}
    </div>
  );
}

/* Content Sections - Getting Started */
function GettingStartedIntro() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
          Welcome to AuditWeave
        </h3>
        <p style={{ color: "#666" }}>
          AuditWeave is an AI-powered compliance auditing platform that helps organizations
          automatically identify DPDP Act 2023 compliance gaps in privacy policies. In less
          than 15 seconds, get comprehensive findings with penalty estimates and remediation
          recommendations.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-xl font-bold mb-4" style={{ color: "#276152" }}>
          Key Features at a Glance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            title="15-Second Audits"
            description="Run complete compliance audits in under 15 seconds"
          />
          <FeatureCard
            title="AI Legal Reasoning"
            description="96% accurate AI-powered legal analysis with explanations"
          />
          <FeatureCard
            title="Executive Reports"
            description="Board-ready PDF reports with penalty estimates"
          />
          <FeatureCard
            title="Batch Auditing"
            description="Audit multiple policies simultaneously and compare"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4" style={{ color: "#276152" }}>
          What You'll Learn
        </h3>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <div style={{ color: "#276152" }}><ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" /></div>
            <span style={{ color: "#666" }}>
              How to start your first audit using 2 free credits
            </span>
          </li>
          <li className="flex gap-3">
            <div style={{ color: "#276152" }}><ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" /></div>
            <span style={{ color: "#666" }}>
              Understand all 9 DPDP statutory pillars and 43+ rule checks
            </span>
          </li>
          <li className="flex gap-3">
            <div style={{ color: "#276152" }}><ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" /></div>
            <span style={{ color: "#666" }}>
              Use your dashboard to track compliance metrics across audits
            </span>
          </li>
          <li className="flex gap-3">
            <div style={{ color: "#276152" }}><ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" /></div>
            <span style={{ color: "#666" }}>
              Integrate AuditWeave with your systems via REST API
            </span>
          </li>
          <li className="flex gap-3">
            <div style={{ color: "#276152" }}><ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5" /></div>
            <span style={{ color: "#666" }}>
              Implement remediation workflows and policy updates
            </span>
          </li>
        </ul>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Need Help?</h4>
        <p className="mb-4" style={{ color: "#666" }}>
          If you have questions, visit our contact page or check the FAQ section for quick answers.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 font-semibold"
          style={{ color: "#276152" }}
        >
          Contact Support <ChevronRight className="h-4 w-4" />
        </Link>
      </OutlineBox>
    </div>
  );
}

function QuickStartGuide() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Get up and running with AuditWeave in 5 minutes.
      </p>

      <div className="space-y-4">
        <StepCard
          number={1}
          title="Create Your Account"
          description="Sign up at AuditWeave. You'll receive 2 free credits automatically."
        />
        <StepCard
          number={2}
          title="Choose Input Method"
          description="Paste a privacy policy URL, paste text directly, or upload a PDF/DOCX file."
        />
        <StepCard
          number={3}
          title="Run Audit"
          description="Click 'Start Audit'. Our engine runs 43+ compliance checks in under 15 seconds."
        />
        <StepCard
          number={4}
          title="Review Findings"
          description="See all findings organized by DPDP pillar with severity levels and recommendations."
        />
        <StepCard
          number={5}
          title="Export Report"
          description="Download executive PDF report with compliance score and penalty estimates."
        />
      </div>

      <CodeBlock
        language="bash"
        code={`# After signup, you can also use the API
curl -X POST https://api.auditweave.axoreon.com/api/audit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_name": "Acme Corp",
    "industry": "SaaS",
    "policy_url": "https://example.com/privacy"
  }'`}
      />
    </div>
  );
}

function FreeCreditsGuide() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>
          What are Free Credits?
        </h4>
        <p style={{ color: "#666" }}>
          Each new user receives 2 free credits. One credit = one complete privacy policy audit.
          Credits allow you to explore AuditWeave's full feature set before committing to a paid plan.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>
          What Can You Do With 1 Credit?
        </h3>
        <ul className="space-y-2">
          <li className="flex gap-3">
            <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">✓</span>
            <span style={{ color: "#666" }}>Run a complete compliance audit</span>
          </li>
          <li className="flex gap-3">
            <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">✓</span>
            <span style={{ color: "#666" }}>Get findings for all 9 DPDP pillars</span>
          </li>
          <li className="flex gap-3">
            <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">✓</span>
            <span style={{ color: "#666" }}>View AI-powered legal recommendations</span>
          </li>
          <li className="flex gap-3">
            <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">✓</span>
            <span style={{ color: "#666" }}>Download executive PDF report</span>
          </li>
          <li className="flex gap-3">
            <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">✓</span>
            <span style={{ color: "#666" }}>Store audit in your history</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>
          After Free Credits Run Out
        </h3>
        <p className="mb-4" style={{ color: "#666" }}>
          Choose from flexible pricing options:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PricingCard
            title="Pay-as-You-Go"
            description="Purchase credits on demand"
            price="₹500/credit"
          />
          <PricingCard
            title="Monthly Plan"
            description="10 credits + batch auditing"
            price="₹4,999/month"
          />
          <PricingCard
            title="Enterprise"
            description="Unlimited audits + support"
            price="Custom pricing"
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Pro Tip</h4>
        <p style={{ color: "#666" }}>
          Test different privacy policies with your 2 free credits to understand compliance gaps
          across your organization before investing in a paid plan.
        </p>
      </OutlineBox>
    </div>
  );
}

function FirstAuditGuide() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Follow this step-by-step guide to run your first privacy policy audit.
      </p>

      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 1: Log In & Navigate to Audit</h3>
        <p style={{ color: "#666" }}>
          After signing in, click "Start Audit" in the navigation or go to <code style={{ backgroundColor: "#EEF5F2", padding: "2px 8px", borderRadius: "4px" }}>/audit/new</code>.
        </p>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 2: Choose Your Input Method</h3>
        <div className="space-y-3 ml-4">
          <OutlineBox>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>📎 Paste URL</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Enter your website's privacy policy URL. AuditWeave will fetch and analyze it.
            </p>
            <code style={{ backgroundColor: "#EEF5F2", padding: "8px", borderRadius: "4px", display: "block", marginTop: "8px", fontSize: "12px" }}>
              https://example.com/privacy-policy
            </code>
          </OutlineBox>

          <OutlineBox>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>📝 Paste Text</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Copy your privacy policy text and paste directly into the editor.
            </p>
          </OutlineBox>

          <OutlineBox>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>📄 Upload File</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Upload a PDF or DOCX document of your privacy policy.
            </p>
          </OutlineBox>
        </div>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 3: Enter Organization Details</h3>
        <ul className="space-y-2 ml-4" style={{ color: "#666" }}>
          <li>• <strong>Company Name:</strong> Your organization's name</li>
          <li>• <strong>Industry:</strong> Select from FinTech, E-commerce, Healthcare, SaaS, EdTech, or Other</li>
        </ul>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 4: Click "Start Audit"</h3>
        <p style={{ color: "#666" }}>
          Sit back and wait. Your audit will complete in under 15 seconds.
        </p>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 5: Review Your Findings</h3>
        <p style={{ color: "#666" }}>
          You'll see:
        </p>
        <ul className="space-y-2 ml-4" style={{ color: "#666" }}>
          <li>• <strong>Compliance Score:</strong> 0-100% rating</li>
          <li>• <strong>Findings by Pillar:</strong> Organized by DPDP Act sections</li>
          <li>• <strong>Severity Levels:</strong> Critical, High, Medium, Low, Informational</li>
          <li>• <strong>Recommendations:</strong> Legal, technical, and business fixes</li>
        </ul>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Step 6: Download Report</h3>
        <p style={{ color: "#666" }}>
          Click "Download PDF" to get an executive report with penalty estimates and remediation roadmap.
        </p>
      </div>

      <OutlineBox>
        <h4 className="font-bold" style={{ color: "#276152" }}>✓ You're All Set!</h4>
        <p style={{ color: "#666" }}>
          You've successfully run your first audit. Now explore your dashboard to track trends
          and set up batch audits for multiple policies.
        </p>
      </OutlineBox>
    </div>
  );
}

/* Features Section */
function AuditEngineDoc() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
          Hybrid Compliance Engine
        </h3>
        <p style={{ color: "#666" }}>
          AuditWeave combines deterministic rule-based checks with AI legal reasoning for
          comprehensive, explainable compliance verdicts.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>How It Works</h3>
        <div className="space-y-4">
          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>1. Policy Ingestion</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Extract text from URLs, raw text, or documents (PDF/DOCX). Minimum 150 characters required.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>2. Rule-Based Scan</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              43+ deterministic keyword and pattern checks against DPDP Act 2023 requirements.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>3. AI Legal Analysis</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Google Gemini AI performs contextual legal reasoning with 96% confidence scoring.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>4. Finding Generation</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Findings include pillar mapping, severity, evidence extracts, and multi-stakeholder recommendations.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>5. Scoring & Report</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Compliance score (0-100%), executive summary, and penalty estimates.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard value="99.7%" label="Speed Improvement vs. Manual" />
          <MetricCard value="43+" label="Rule Checks" />
          <MetricCard value="96%" label="AI Accuracy" />
        </div>
      </div>
    </div>
  );
}

function ThreeInputMethodsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        AuditWeave supports three flexible ways to submit privacy policies for compliance auditing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OutlineBox>
          <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF5F2", fontSize: "20px" }}>
            🔗
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>Paste URL</h3>
          <p className="text-sm mb-4" style={{ color: "#666" }}>
            Direct AuditWeave to your live privacy policy page. We'll fetch and analyze the content.
          </p>
          <div style={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #D4CAB8", padding: "12px" }}>
            <code style={{ fontSize: "12px", color: "#666" }}>
              https://example.com/privacy
            </code>
          </div>
          <ul className="text-xs mt-4 space-y-1" style={{ color: "#666" }}>
            <li>✓ Real-time policy</li>
            <li>✓ Easy sharing</li>
            <li>✓ Auto-updates tracked</li>
          </ul>
        </OutlineBox>

        <OutlineBox>
          <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF5F2", fontSize: "20px" }}>
            📝
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>Paste Text</h3>
          <p className="text-sm mb-4" style={{ color: "#666" }}>
            Copy your privacy policy text and paste directly into our editor. No setup required.
          </p>
          <div style={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #D4CAB8", padding: "12px", fontSize: "12px", color: "#999" }}>
            Min 150 characters
          </div>
          <ul className="text-xs mt-4 space-y-1" style={{ color: "#666" }}>
            <li>✓ Private content</li>
            <li>✓ Draft policies</li>
            <li>✓ Fast submission</li>
          </ul>
        </OutlineBox>

        <OutlineBox>
          <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF5F2", fontSize: "20px" }}>
            📄
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>Upload File</h3>
          <p className="text-sm mb-4" style={{ color: "#666" }}>
            Upload PDF or DOCX documents. Perfect for existing policy archives.
          </p>
          <div style={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #D4CAB8", padding: "12px", fontSize: "12px", color: "#999" }}>
            .pdf, .docx
          </div>
          <ul className="text-xs mt-4 space-y-1" style={{ color: "#666" }}>
            <li>✓ Batch processing</li>
            <li>✓ Version control</li>
            <li>✓ Archive audits</li>
          </ul>
        </OutlineBox>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Technical Requirements</h4>
        <ul className="space-y-2 text-sm" style={{ color: "#666" }}>
          <li>• <strong>Minimum text:</strong> 150 characters</li>
          <li>• <strong>Supported formats:</strong> PDF, DOCX, Plain text, HTML</li>
          <li>• <strong>Max file size:</strong> 10 MB</li>
          <li>• <strong>Language:</strong> English</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

function AIReasoningDoc() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
          AI-Powered Legal Reasoning
        </h3>
        <p style={{ color: "#666" }}>
          Every audit includes AI legal analysis providing 96% confident, explainable findings
          grounded in DPDP Act 2023 sections and case law context.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>What You Get</h3>
        <div className="space-y-3">
          <CheckItem text="Contextual legal explanations for each finding" />
          <CheckItem text="DPDP Act section references with line citations" />
          <CheckItem text="Business impact assessment (financial, operational, reputational)" />
          <CheckItem text="Legal impact with specific violation consequences" />
          <CheckItem text="Technical remediation recommendations with examples" />
          <CheckItem text="Confidence scoring (0-100%) for each finding" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Example Finding</h3>
        <CodeBlock
          language="json"
          code={`{
  "issue": "Missing opt-in consent mechanism",
  "pillar": "Consent",
  "severity": "Critical",
  "dpdp_section": "Section 6",
  "confidence_score": 0.96,
  "reason": "Policy does not specify explicit, granular opt-in consent for data collection",
  "legal_impact": "Non-compliance with Section 6 penalties up to ₹50 Cr",
  "business_impact": "Potential data deletion orders, reputational damage",
  "legal_rec": "Add specific opt-in mechanisms for each processing purpose",
  "tech_rec": "Implement granular consent checkboxes in consent flow",
  "evidence_extract": "By using our services, you agree to our policies..."
}`}
        />
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>How AI Confidence Works</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Confidence scores reflect how certain the AI is about its analysis. Higher scores indicate
          clearer violations; lower scores suggest areas requiring expert legal review.
        </p>
      </OutlineBox>
    </div>
  );
}

function BatchAuditsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Audit multiple privacy policies simultaneously to compare compliance across organizations
        and identify industry benchmarks.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>How Batch Auditing Works</h3>
        <div className="space-y-4">
          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>1. Upload Policies</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Add multiple policies at once (URL, text, or files). Supports up to 50 simultaneous audits.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>2. Parallel Processing</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Our engine processes all policies in parallel for faster results.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>3. Comparative Matrix</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Generate side-by-side comparison matrices showing compliance across all audited policies.
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>4. Export Results</h4>
            <p className="text-sm" style={{ color: "#666" }}>
              Download consolidated GRC scorecards and benchmark reports.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Use Cases</h3>
        <ul className="space-y-2" style={{ color: "#666" }}>
          <li>• <strong>M&A Due Diligence:</strong> Audit target company policies at scale</li>
          <li>• <strong>Portfolio Governance:</strong> Track compliance across subsidiary organizations</li>
          <li>• <strong>Vendor Assessment:</strong> Audit third-party privacy policies in bulk</li>
          <li>• <strong>Competitive Analysis:</strong> Benchmark policies against industry peers</li>
        </ul>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Pricing Note</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Batch audits consume 1 credit per policy audited. Monthly and Enterprise plans offer
          bulk discounts for high-volume batch processing.
        </p>
      </OutlineBox>
    </div>
  );
}

function PDFReportsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Every audit generates a comprehensive executive PDF report suitable for board presentations,
        legal teams, and regulatory submissions.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Report Contents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OutlineBox>
            <h4 className="font-semibold mb-3" style={{ color: "#276152" }}>Executive Summary</h4>
            <ul className="text-sm space-y-1" style={{ color: "#666" }}>
              <li>• Compliance score & rating</li>
              <li>• Overall risk assessment</li>
              <li>• Key findings summary</li>
              <li>• Recommended actions</li>
            </ul>
          </OutlineBox>

          <OutlineBox>
            <h4 className="font-semibold mb-3" style={{ color: "#276152" }}>Penalty Analysis</h4>
            <ul className="text-sm space-y-1" style={{ color: "#666" }}>
              <li>• Estimated penalty range</li>
              <li>• Violation severity breakdown</li>
              <li>• Risk quantification</li>
              <li>• Prioritized remediation</li>
            </ul>
          </OutlineBox>

          <OutlineBox>
            <h4 className="font-semibold mb-3" style={{ color: "#276152" }}>Findings Detail</h4>
            <ul className="text-sm space-y-1" style={{ color: "#666" }}>
              <li>• All findings by pillar</li>
              <li>• Severity classification</li>
              <li>• DPDP Act section references</li>
              <li>• Evidence extracts</li>
            </ul>
          </OutlineBox>

          <OutlineBox>
            <h4 className="font-semibold mb-3" style={{ color: "#276152" }}>Remediation Roadmap</h4>
            <ul className="text-sm space-y-1" style={{ color: "#666" }}>
              <li>• Legal recommendations</li>
              <li>• Technical implementation steps</li>
              <li>• Business process changes</li>
              <li>• Timeline estimates</li>
            </ul>
          </OutlineBox>
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Report Customization</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Enterprise users can customize report branding, add company logos, and include custom
          sections for specific stakeholder groups.
        </p>
      </OutlineBox>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Regulatory Ready</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Reports include proper disclaimers, audit timestamps, confidence scoring, and evidence
          documentation suitable for regulatory reviews and legal submissions.
        </p>
      </OutlineBox>
    </div>
  );
}

function CopilotDoc() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
          AI Copilot Assistant
        </h3>
        <p style={{ color: "#666" }}>
          Interactive AI assistant specialized in DPDP Act 2023 compliance. Ask questions about
          your audit, get remediation guidance, and rewrite non-compliant clauses.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Copilot Capabilities</h3>
        <div className="space-y-4">
          <CapabilityCard
            title="Ask Questions"
            description="Query your audit findings, understand specific violations, and get clarifications on DPDP requirements."
            examples={[
              "What does Section 6 require?",
              "Why is my consent mechanism non-compliant?",
              "How do I fix Children's Data violations?"
            ]}
          />

          <CapabilityCard
            title="Get Remediation Guidance"
            description="Receive step-by-step guidance on how to fix compliance gaps."
            examples={[
              "How do I implement explicit opt-in consent?",
              "What's the timeline to remediate Critical findings?",
              "Which gaps should I prioritize first?"
            ]}
          />

          <CapabilityCard
            title="Rewrite Clauses"
            description="One-click AI clause rewriting to transform non-compliant sections into legally sound language."
            examples={[
              "Rewrite my consent clause",
              "Fix my data retention policy",
              "Make my notice more explicit"
            ]}
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>⚠ Important Disclaimer</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          AI-generated clauses and recommendations are for guidance only and do not constitute formal
          legal advice. Always review with qualified legal counsel before publishing changes.
        </p>
      </OutlineBox>
    </div>
  );
}

/* Compliance Framework */
function DPDPOverviewDoc() {
  return (
    <div className="space-y-6">
      <OutlineBox>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#276152" }}>
          Digital Personal Data Protection Act, 2023
        </h3>
        <p style={{ color: "#666" }}>
          India's comprehensive data privacy law modeled after GDPR, applicable to organizations
          processing residents' personal data. AuditWeave provides complete coverage of all requirements.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Key Compliance Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComplianceArea
            title="Personal Data Collection"
            items={[
              "Explicit purpose declaration",
              "Granular consent mechanisms",
              "Data principal rights",
              "Minimization principles"
            ]}
          />
          <ComplianceArea
            title="Processing & Storage"
            items={[
              "Data retention policies",
              "Purpose limitation",
              "Security safeguards",
              "Accountability measures"
            ]}
          />
          <ComplianceArea
            title="Special Categories"
            items={[
              "Children's data protection",
              "Sensitive personal data",
              "Automated decision-making",
              "Cross-border transfers"
            ]}
          />
          <ComplianceArea
            title="Rights & Remedies"
            items={[
              "Data access rights",
              "Correction & erasure",
              "Grievance redressal",
              "Breach notification"
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Penalty Framework</h3>
        <OutlineBox>
          <p className="mb-4" style={{ color: "#666" }}>
            Non-compliance carries significant penalties based on violation severity:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#666" }}><strong>Critical Violations:</strong></span>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹250 Crore</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#666" }}><strong>Structural Gaps:</strong></span>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹25 Crore</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#666" }}><strong>Process Violations:</strong></span>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹5 Crore</span>
            </div>
          </div>
        </OutlineBox>
      </div>
    </div>
  );
}

function NinePillarsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        AuditWeave audits all 9 statutory pillars required under DPDP Act 2023. Each pillar
        represents a core compliance requirement.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PillarCard number="1" title="Consent" description="Explicit, specific, granular, and informed opt-in consent for data collection" />
        <PillarCard number="2" title="Notice" description="Clear, accessible, and detailed notice about data collection practices" />
        <PillarCard number="3" title="Data Principal Rights" description="Rights to access, correct, erase, and port personal data" />
        <PillarCard number="4" title="Children's Data" description="Enhanced protections for minors including explicit parental consent" />
        <PillarCard number="5" title="Data Fiduciary Obligations" description="Accountability, transparency, and good governance requirements" />
        <PillarCard number="6" title="Grievance Redressal" description="Formal mechanism for data principals to file complaints and get resolution" />
        <PillarCard number="7" title="Cross-Border Transfer" description="Regulations on transferring personal data outside India" />
        <PillarCard number="8" title="Security Safeguards" description="Technical and organizational measures to protect data from unauthorized access" />
        <PillarCard number="9" title="Data Breach Notification" description="Mandatory notification to authorities and data principals within prescribed timelines" />
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Pillar Coverage in Reports</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Each audit report shows findings grouped by these pillars, allowing teams to track
          compliance progress across all regulatory requirements.
        </p>
      </OutlineBox>
    </div>
  );
}

function RulesCheckDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        AuditWeave's compliance engine includes 43+ automated rule checks covering all mandatory
        DPDP Act requirements and best practices.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Rule Categories</h3>
        <div className="space-y-4">
          <RuleCategory
            title="Notice Requirements"
            count="8 rules"
            rules={[
              "Clear purpose declaration",
              "Data types listed",
              "Collection method disclosed",
              "Third-party sharing explained"
            ]}
          />

          <RuleCategory
            title="Consent Mechanisms"
            count="9 rules"
            rules={[
              "Explicit opt-in (not opt-out)",
              "Granular consent per purpose",
              "Easy consent withdrawal",
              "No consent as condition (where applicable)"
            ]}
          />

          <RuleCategory
            title="Children's Data"
            count="6 rules"
            rules={[
              "Age verification mechanism",
              "Parental consent requirement",
              "No behavioral tracking",
              "No targeted advertising"
            ]}
          />

          <RuleCategory
            title="Data Principal Rights"
            count="7 rules"
            rules={[
              "Right to access",
              "Right to correct",
              "Right to erase",
              "Right to data portability"
            ]}
          />

          <RuleCategory
            title="Data Retention"
            count="5 rules"
            rules={[
              "Defined retention period",
              "Deletion policy",
              "Archival process",
              "Legal hold procedures"
            ]}
          />

          <RuleCategory
            title="Security & Breach"
            count="8 rules"
            rules={[
              "Encryption requirements",
              "Access controls",
              "Breach notification timeline",
              "Incident response plan"
            ]}
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Rule Check Accuracy</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Rules are updated quarterly to reflect latest regulatory guidance from Data Protection
          Board and judicial precedents.
        </p>
      </OutlineBox>
    </div>
  );
}

function SeverityLevelsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Each finding is assigned a severity level indicating the urgency and impact of the compliance gap.
      </p>

      <div className="space-y-4">
        <SeverityLevel
          level="Critical"
          icon="🔴"
          description="Immediate legal exposure with severe penalties or enforcement action"
          examples={[
            "No consent mechanism for data collection",
            "No data breach notification process",
            "No access to personal data rights"
          ]}
          recommendation="Remediate immediately (within 1-2 weeks)"
        />

        <SeverityLevel
          level="High"
          icon="🟠"
          description="Significant compliance gaps that regulators will likely challenge"
          examples={[
            "Vague consent language",
            "Missing data retention period",
            "Inadequate children's data protections"
          ]}
          recommendation="Remediate within 1 month"
        />

        <SeverityLevel
          level="Medium"
          icon="🟡"
          description="Notable gaps that should be addressed during policy updates"
          examples={[
            "Incomplete notice disclosures",
            "Missing grievance contact info",
            "Unclear data principal rights"
          ]}
          recommendation="Address within 3 months"
        />

        <SeverityLevel
          level="Low"
          icon="🟢"
          description="Minor issues that improve compliance quality but aren't critical"
          examples={[
            "Outdated terminology",
            "Missing explanation of technical terms",
            "Formatting improvements"
          ]}
          recommendation="Include in next policy refresh"
        />

        <SeverityLevel
          level="Informational"
          icon="ℹ️"
          description="Observations and best practice recommendations"
          examples={[
            "Additional transparency opportunity",
            "Enhanced security measure",
            "Industry best practice alignment"
          ]}
          recommendation="Consider for improvement"
        />
      </div>
    </div>
  );
}

function PenaltyFrameworkDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        AuditWeave estimates potential penalties based on violation severity, helping prioritize
        remediation efforts.
      </p>

      <OutlineBox>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Penalty Structure</h3>
        <div className="space-y-3">
          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "white", border: "1px solid #D4CAB8", borderLeftWidth: "4px" }}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold" style={{ color: "#276152" }}>Critical Violations</h4>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹250 Crore</span>
            </div>
            <p className="text-sm" style={{ color: "#666" }}>
              Applied for violations of core principles (consent, notice, data principal rights)
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "white", border: "1px solid #D4CAB8", borderLeftWidth: "4px" }}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold" style={{ color: "#276152" }}>Major Violations</h4>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹25 Crore</span>
            </div>
            <p className="text-sm" style={{ color: "#666" }}>
              Applied for breach notification failures and data fiduciary obligations
            </p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "white", border: "1px solid #D4CAB8", borderLeftWidth: "4px" }}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold" style={{ color: "#276152" }}>Moderate Violations</h4>
              <span style={{ color: "#276152", fontWeight: "bold" }}>Up to ₹5 Crore</span>
            </div>
            <p className="text-sm" style={{ color: "#666" }}>
              Applied for process violations and non-compliance with procedural requirements
            </p>
          </div>
        </div>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>How Penalties Are Estimated</h3>
        <div className="space-y-3">
          <div className="flex gap-4">
            <span className="text-2xl flex-shrink-0">1️⃣</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>Violation Count</h4>
              <p className="text-sm" style={{ color: "#666" }}>
                Each finding contributes to overall penalty range based on severity
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-2xl flex-shrink-0">2️⃣</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>Severity Weighting</h4>
              <p className="text-sm" style={{ color: "#666" }}>
                Critical findings weighted more heavily in penalty calculation
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-2xl flex-shrink-0">3️⃣</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>Enforcement History</h4>
              <p className="text-sm" style={{ color: "#666" }}>
                Similar cases and Data Protection Board guidance inform realistic estimates
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="text-2xl flex-shrink-0">4️⃣</span>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>Conservative Approach</h4>
              <p className="text-sm" style={{ color: "#666" }}>
                Estimates assume worst-case enforcement; actual penalties may be lower
              </p>
            </div>
          </div>
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Disclaimer</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Penalty estimates are for planning purposes only and do not constitute legal advice.
          Actual penalties depend on enforcement discretion, mitigating factors, and legal arguments.
          Consult with legal counsel for definitive assessments.
        </p>
      </OutlineBox>
    </div>
  );
}

/* API Reference */
function AuthenticationDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        All API requests require authentication using an API key. Get your key from your dashboard.
      </p>

      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Getting Your API Key</h3>
        <OutlineBox>
          <ol className="space-y-2" style={{ color: "#666" }}>
            <li>1. Go to your <strong>Account Settings</strong></li>
            <li>2. Click <strong>API Keys</strong> in the left sidebar</li>
            <li>3. Click <strong>Create New Key</strong></li>
            <li>4. Copy and store securely (you won't see it again)</li>
          </ol>
        </OutlineBox>

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Making Authenticated Requests</h3>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.auditweave.axoreon.com/api/audit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_name": "Acme Corp",
    "industry": "SaaS",
    "policy_url": "https://example.com/privacy"
  }'`}
        />

        <h3 className="text-lg font-bold" style={{ color: "#276152" }}>Authentication Methods</h3>
        <OutlineBox>
          <h4 className="font-semibold mb-2" style={{ color: "#276152" }}>Bearer Token (Recommended)</h4>
          <code style={{ fontSize: "12px", color: "#666" }}>
            Authorization: Bearer YOUR_API_KEY
          </code>
        </OutlineBox>

        <OutlineBox>
          <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Security Best Practices</h4>
          <ul className="space-y-2 text-sm" style={{ color: "#666" }}>
            <li>• Never commit API keys to version control</li>
            <li>• Use environment variables or secret management tools</li>
            <li>• Rotate keys periodically</li>
            <li>• Revoke keys immediately if compromised</li>
          </ul>
        </OutlineBox>
      </div>
    </div>
  );
}

function AuditEndpointsDoc() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Audit Endpoints</h3>

      <div className="space-y-6">
        <APIEndpoint
          method="POST"
          path="/api/audit"
          description="Run an audit on a privacy policy URL or text"
          requestBody={`{
  "company_name": "Acme Corp",
  "industry": "SaaS",
  "policy_url": "https://example.com/privacy"
}`}
          responseBody={`{
  "id": "abc12345",
  "company_name": "Acme Corp",
  "compliance_score": 72.5,
  "risk_score": 28.5,
  "status": "Good",
  "findings": [
    {
      "issue": "Missing opt-in consent",
      "pillar": "Consent",
      "severity": "Critical",
      "dpdp_section": "Section 6"
    }
  ]
}`}
        />

        <APIEndpoint
          method="POST"
          path="/api/audit/file"
          description="Run an audit on an uploaded PDF or DOCX file"
          requestBody="multipart/form-data:
  company_name: string
  industry: string
  file: binary"
          responseBody="Same as POST /api/audit"
        />

        <APIEndpoint
          method="GET"
          path="/api/audit/{audit_id}"
          description="Get detailed results of a completed audit"
          requestBody="N/A"
          responseBody={`{
  "id": "abc12345",
  "company_name": "Acme Corp",
  "compliance_score": 72.5,
  "findings": [...],
  "created_at": "2026-11-05T10:30:00Z"
}`}
        />

        <APIEndpoint
          method="GET"
          path="/api/report/{audit_id}"
          description="Download the executive PDF report"
          requestBody="N/A"
          responseBody="PDF file (application/pdf)"
        />
      </div>
    </div>
  );
}

function DashboardAPIDoc() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Dashboard Endpoints</h3>

      <div className="space-y-6">
        <APIEndpoint
          method="GET"
          path="/api/dashboard"
          description="Get aggregated compliance metrics and dashboard data"
          requestBody="N/A"
          responseBody={`{
  "total_audits": 24,
  "average_compliance_score": 72.5,
  "risk_distribution": {
    "Critical": 3,
    "High": 8,
    "Medium": 15,
    "Low": 45,
    "Informational": 12
  },
  "pillar_metrics": [
    {
      "pillar": "Consent",
      "finding_count": 8,
      "highest_severity": "Critical"
    }
  ],
  "recent_audits": [...],
  "executive_risk": {
    "overall_risk": "High",
    "highest_risk_area": "Consent"
  }
}`}
        />

        <APIEndpoint
          method="GET"
          path="/api/benchmark"
          description="Get industry benchmark data for compliance comparison"
          requestBody="N/A"
          responseBody={`[
  {
    "industry": "SaaS",
    "companies_count": 245,
    "average_compliance_score": 68.3
  },
  {
    "industry": "FinTech",
    "companies_count": 158,
    "average_compliance_score": 71.2
  }
]`}
        />

        <APIEndpoint
          method="GET"
          path="/api/audit/history"
          description="Get all audits for the authenticated user"
          requestBody="N/A"
          responseBody={`[
  {
    "id": "abc12345",
    "company_name": "Acme Corp",
    "compliance_score": 72.5,
    "created_at": "2026-11-05T10:30:00Z"
  }
]`}
        />
      </div>
    </div>
  );
}

function ErrorHandlingDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        API errors follow standard HTTP status codes. All error responses include a descriptive message.
      </p>

      <div className="space-y-4">
        <ErrorCode
          code="400"
          status="Bad Request"
          examples={[
            "Missing required fields (company_name, industry)",
            "Policy text less than 150 characters",
            "Unsupported file format"
          ]}
        />

        <ErrorCode
          code="401"
          status="Unauthorized"
          examples={[
            "Missing or invalid API key",
            "Expired authentication token",
            "Invalid authentication credentials"
          ]}
        />

        <ErrorCode
          code="403"
          status="Forbidden"
          examples={[
            "User has no remaining credits",
            "Plan does not allow API access",
            "API key lacks required permissions"
          ]}
        />

        <ErrorCode
          code="404"
          status="Not Found"
          examples={[
            "Audit ID does not exist",
            "Report not found",
            "Endpoint does not exist"
          ]}
        />

        <ErrorCode
          code="429"
          status="Too Many Requests"
          examples={[
            "Rate limit exceeded",
            "Throttled temporarily",
            "Quota exceeded"
          ]}
        />

        <ErrorCode
          code="500"
          status="Internal Server Error"
          examples={[
            "Policy extraction failed",
            "Compliance engine error",
            "Report generation failed"
          ]}
        />
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Error Response Format</h3>
        <CodeBlock
          language="json"
          code={`{
  "error": {
    "code": "INVALID_POLICY_LENGTH",
    "message": "The privacy policy text is too short to audit. Minimum 150 characters.",
    "status": 400,
    "timestamp": "2026-11-05T10:30:00Z"
  }
}`}
        />
      </div>
    </div>
  );
}

function RateLimitingDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        API rate limits depend on your plan. Limits reset hourly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RateLimitCard
          plan="Free"
          requests="10 req/hour"
          audits="1 audit/day"
          note="For testing only"
        />
        <RateLimitCard
          plan="Professional"
          requests="100 req/hour"
          audits="30 audits/day"
          note="Most teams"
        />
        <RateLimitCard
          plan="Enterprise"
          requests="Unlimited"
          audits="Unlimited"
          note="Custom limits available"
        />
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Rate Limit Headers</h3>
        <CodeBlock
          language="bash"
          code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1667635200`}
        />
        <p className="text-sm mt-2" style={{ color: "#666" }}>
          Check these headers in every response to monitor your usage.
        </p>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Rate Limit Exceeded?</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          When you hit the rate limit, the API returns a 429 status code. Wait until the reset time
          before making more requests. Use exponential backoff for retry logic.
        </p>
      </OutlineBox>
    </div>
  );
}

/* Dashboard Guide */
function DashboardOverviewDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Your dashboard provides a comprehensive view of compliance metrics across all audits.
        It's designed for GRC teams and compliance officers.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Dashboard Sections</h3>
        <div className="space-y-4">
          <DashboardSection
            title="Top Statistics"
            description="Quick view of total audits, average compliance score, and immediate GRC actions"
          />
          <DashboardSection
            title="Executive Risk Summary"
            description="Overall risk level, highest risk pillars, and critical findings count"
          />
          <DashboardSection
            title="Gap Severity Distribution"
            description="Visual breakdown of findings by severity level (Critical, High, Medium, Low, Informational)"
          />
          <DashboardSection
            title="DPDP Compliance Heatmap"
            description="All 9 DPDP pillars with highest severity and finding count per pillar"
          />
          <DashboardSection
            title="Recent Audits"
            description="Table of your 5 most recent audits with company, score, and status"
          />
          <DashboardSection
            title="Sector Benchmarks"
            description="Compare your average compliance score against industry peers"
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Dashboard Auto-Updates</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          All dashboard metrics update automatically after each audit. Historical data is preserved
          for trend analysis.
        </p>
      </OutlineBox>
    </div>
  );
}

function MetricsDoc() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Key Metrics Explained</h3>

      <div className="space-y-4">
        <MetricExplanation
          title="Compliance Score"
          formula="(Rules Passed / Total Rules) × 100"
          range="0-100%"
          description="Overall compliance rating. Higher is better."
          example="72.5% means 72.5% of checks passed"
        />

        <MetricExplanation
          title="Risk Score"
          formula="Inverse of compliance score"
          range="0-100"
          description="Quantified risk exposure. Lower is better."
          example="Risk score of 27.5 indicates moderate risk"
        />

        <MetricExplanation
          title="AI Confidence"
          formula="Weighted average of finding confidence scores"
          range="0-100%"
          description="How certain our AI is about findings (96% average)"
          example="95% confidence in a Critical finding means high certainty"
        />

        <MetricExplanation
          title="Finding Count"
          formula="Total issues identified per pillar"
          range="0-N"
          description="Number of compliance gaps by severity and pillar"
          example="5 findings in Consent pillar: 1 Critical, 2 High, 2 Medium"
        />
      </div>
    </div>
  );
}

function HeatmapDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        The DPDP Compliance Heatmap visualizes compliance status across all 9 statutory pillars.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Reading the Heatmap</h3>
        <div className="space-y-3">
          <HeatmapStatus
            status="Critical"
            meaning="Has Critical severity findings"
            action="Immediate remediation required"
          />
          <HeatmapStatus
            status="High"
            meaning="Highest severity is High"
            action="Remediate within 1 month"
          />
          <HeatmapStatus
            status="Medium"
            meaning="Highest severity is Medium"
            action="Address within 3 months"
          />
          <HeatmapStatus
            status="Low"
            meaning="Highest severity is Low or no findings"
            action="Include in next refresh"
          />
          <HeatmapStatus
            status="No Findings"
            meaning="Pillar not assessed or no gaps found"
            action="Continue monitoring"
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Heatmap Insights</h4>
        <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
          <li>• Red pillars = highest priority for remediation</li>
          <li>• Track pillar status over time after policy updates</li>
          <li>• Identify patterns across multiple audits</li>
          <li>• Plan phased remediation by pillar</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

function BenchmarksDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Industry benchmarks let you compare your compliance score against sector peers.
      </p>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Benchmark Data Note</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Benchmarks include anonymized data from actual audits in each industry. Some benchmark
          datasets may include demonstration data for context.
        </p>
      </OutlineBox>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>How to Use Benchmarks</h3>
        <div className="space-y-3">
          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>1. Find Your Industry</h4>
            <p className="text-sm" style={{ color: "#666" }}>Locate your sector (SaaS, FinTech, Healthcare, etc.)</p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>2. Compare Your Score</h4>
            <p className="text-sm" style={{ color: "#666" }}>See how your compliance score stacks up against peers</p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>3. Identify Gaps</h4>
            <p className="text-sm" style={{ color: "#666" }}>If below average, focus on lowest-performing pillars</p>
          </div>

          <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
            <h4 className="font-semibold mb-1" style={{ color: "#276152" }}>4. Set Targets</h4>
            <p className="text-sm" style={{ color: "#666" }}>Use benchmark as baseline for compliance improvement goals</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportingDataDoc() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Export Options</h3>

      <div className="space-y-4">
        <ExportOption
          format="PDF Report"
          description="Executive summary with findings, penalties, and recommendations"
          use="Board presentations, regulatory submissions, legal review"
          button="Download PDF"
        />

        <ExportOption
          format="CSV Data"
          description="Raw audit data, findings, and metrics in spreadsheet format"
          use="Data analysis, custom reporting, integration with tools"
          button="Export CSV"
        />

        <ExportOption
          format="JSON API"
          description="Full audit results in JSON format via API"
          use="Programmatic integration, custom dashboards"
          button="API Reference"
        />
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Data Retention</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          All audit data is retained in your account indefinitely. Export historical data periodically
          for your records and compliance documentation.
        </p>
      </OutlineBox>
    </div>
  );
}

/* Best Practices */
function AuditStrategyDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Develop a comprehensive audit strategy to maximize compliance coverage and remediation effectiveness.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Audit Strategy Framework</h3>
        <div className="space-y-4">
          <StrategyPhase
            phase="1. Baseline Audit"
            description="Run initial audit on current privacy policy to establish baseline compliance score and identify all gaps"
          />
          <StrategyPhase
            phase="2. Severity Prioritization"
            description="Focus immediately on Critical findings, then High, then Medium. Save Low for next refresh cycle"
          />
          <StrategyPhase
            phase="3. Pillar-by-Pillar Review"
            description="Address findings grouped by DPDP pillar to ensure comprehensive coverage of each statutory requirement"
          />
          <StrategyPhase
            phase="4. Remediation Execution"
            description="Update policies based on AI recommendations. Legal team reviews and approves changes"
          />
          <StrategyPhase
            phase="5. Reaudit & Validation"
            description="Run follow-up audit to verify improvements and identify any remaining gaps"
          />
          <StrategyPhase
            phase="6. Continuous Monitoring"
            description="Set up recurring audits to catch compliance drift from policy updates or regulatory changes"
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Timeline Recommendation</h4>
        <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
          <li>• <strong>Month 1:</strong> Initial audit + remediate Critical findings</li>
          <li>• <strong>Month 2:</strong> Address High findings + board review</li>
          <li>• <strong>Month 3:</strong> Complete Medium findings + reaudit</li>
          <li>• <strong>Ongoing:</strong> Quarterly audits for monitoring</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

function RemediationDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        A structured remediation workflow ensures compliance improvements are thorough and sustainable.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Remediation Workflow</h3>
        <div className="space-y-3">
          <RemediationStep number="1" title="Review Findings" action="Read AI recommendations and understand the compliance gap" />
          <RemediationStep number="2" title="Use AI Copilot" action="Ask follow-up questions and get clause rewriting suggestions" />
          <RemediationStep number="3" title="Draft Updates" action="Update policy based on technical and legal recommendations" />
          <RemediationStep number="4" title="Legal Review" action="Have qualified attorney review changes for legal soundness" />
          <RemediationStep number="5" title="Stakeholder Approval" action="Get sign-off from product, privacy, and compliance teams" />
          <RemediationStep number="6" title="Publish Update" action="Deploy updated policy and communicate changes to users" />
          <RemediationStep number="7" title="Reaudit" action="Run follow-up audit to confirm improvements" />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Pro Tip: Batch Updates</h4>
        <p className="text-sm" style={{ color: "#666" }}>
          Group related findings when updating your policy. For example, update all Consent-related
          clauses together rather than piecemeal. This ensures consistency and minimizes policy versions.
        </p>
      </OutlineBox>
    </div>
  );
}

function TeamCollaborationDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Effective compliance requires collaboration across teams. Here's how to organize your effort.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Recommended Team Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamRole
            role="Compliance Officer"
            responsibilities={[
              "Oversee overall audit strategy",
              "Prioritize findings by business impact",
              "Coordinate cross-team efforts"
            ]}
          />
          <TeamRole
            role="Legal Counsel"
            responsibilities={[
              "Review AI recommendations for legal soundness",
              "Draft compliant policy language",
              "Ensure DPDP Act alignment"
            ]}
          />
          <TeamRole
            role="Privacy Engineer"
            responsibilities={[
              "Evaluate technical recommendations",
              "Implement consent mechanisms",
              "Configure data handling systems"
            ]}
          />
          <TeamRole
            role="Product Manager"
            responsibilities={[
              "Assess business impact of changes",
              "Plan user communication",
              "Prioritize implementation"
            ]}
          />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Collaboration Tools</h4>
        <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
          <li>• Share audit reports via email or Slack</li>
          <li>• Use Dashboard for real-time metrics visibility</li>
          <li>• Export PDF reports for legal team review</li>
          <li>• Reference API for custom integrations with your tools</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

function RecurringAuditsDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Set up recurring audits to monitor ongoing compliance and catch policy drift quickly.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Recommended Audit Schedule</h3>
        <div className="space-y-3">
          <AuditFrequency
            frequency="Monthly"
            forText="Organizations with frequent policy updates"
            benefit="Catch changes immediately, prevent compliance drift"
          />
          <AuditFrequency
            frequency="Quarterly"
            forText="Most organizations (recommended baseline)"
            benefit="Regular compliance check-in, align with business cycles"
          />
          <AuditFrequency
            frequency="Semi-Annually"
            forText="Stable organizations with mature policies"
            benefit="Lighter audit load, seasonal alignment"
          />
          <AuditFrequency
            frequency="Annually"
            forText="Organizations in regulated industries"
            benefit="Regulatory compliance documentation"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>When to Trigger Ad-Hoc Audits</h3>
        <ul className="space-y-2" style={{ color: "#666" }}>
          <li>• <strong>Policy Update:</strong> After any material policy change</li>
          <li>• <strong>New Features:</strong> When launching new data processing features</li>
          <li>• <strong>Regulatory Change:</strong> When DPDP Act guidance updates</li>
          <li>• <strong>Incident Response:</strong> After security breach or data incident</li>
          <li>• <strong>Expansion:</strong> When entering new markets or industries</li>
        </ul>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Scheduling Tips</h4>
        <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
          <li>• Use API to schedule audits programmatically</li>
          <li>• Set recurring audits on the same day each cycle for consistency</li>
          <li>• Combine with policy review calendar for coordinated efforts</li>
          <li>• Archive reports for audit trail and regulatory documentation</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

function PolicyUpdatesDoc() {
  return (
    <div className="space-y-6">
      <p style={{ color: "#666" }}>
        Best practices for updating privacy policies while maintaining compliance and user trust.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: "#276152" }}>Policy Update Process</h3>
        <div className="space-y-4">
          <UpdateStep number="1" title="Audit Current Policy" detail="Establish baseline and identify all gaps" />
          <UpdateStep number="2" title="Prioritize Changes" detail="Use severity levels to focus on critical updates first" />
          <UpdateStep number="3" title="Draft Revisions" detail="Use AI Copilot and legal counsel to rewrite clauses" />
          <UpdateStep number="4" title="Internal Review" detail="Get approvals from legal, privacy, product, and compliance teams" />
          <UpdateStep number="5" title="Version Control" detail="Create new policy version with change log for audit trail" />
          <UpdateStep number="6" title="Publish Update" detail="Deploy updated policy to website and systems" />
          <UpdateStep number="7" title="User Communication" detail="Notify affected users about material changes" />
          <UpdateStep number="8" title="Audit Updated Policy" detail="Run follow-up audit to confirm improvements" />
        </div>
      </div>

      <OutlineBox>
        <h4 className="font-bold mb-2" style={{ color: "#276152" }}>Regulatory Requirements</h4>
        <p className="mb-3 text-sm" style={{ color: "#666" }}>
          DPDP Act requires material policy changes to be communicated to data principals in advance.
        </p>
        <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
          <li>• Provide adequate notice period before changes take effect</li>
          <li>• Clearly explain material changes</li>
          <li>• Provide mechanism to opt-out of new processing (where applicable)</li>
          <li>• Document communication for compliance purposes</li>
        </ul>
      </OutlineBox>
    </div>
  );
}

/* Reusable Components */
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-2" style={{ color: "#276152" }}>{title}</h4>
      <p className="text-sm" style={{ color: "#666" }}>{description}</p>
    </OutlineBox>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold"
        style={{ backgroundColor: "#276152" }}
      >
        {number}
      </div>
      <div>
        <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: "#666" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  return (
    <div className="rounded-lg p-4 overflow-x-auto" style={{ backgroundColor: "#2D3436" }}>
      <code className="text-sm font-mono whitespace-pre" style={{ color: "#E8E3D8" }}>
        {code}
      </code>
    </div>
  );
}

function PricingCard({
  title,
  description,
  price,
}: {
  title: string;
  description: string;
  price: string;
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
        {title}
      </h4>
      <p className="text-xs mb-3" style={{ color: "#666" }}>
        {description}
      </p>
      <p className="text-lg font-bold" style={{ color: "#276152" }}>
        {price}
      </p>
    </OutlineBox>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <span style={{ color: "#276152" }} className="font-bold flex-shrink-0">
        ✓
      </span>
      <span style={{ color: "#666" }}>{text}</span>
    </div>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <OutlineBox>
      <p className="text-2xl font-bold mb-1" style={{ color: "#276152" }}>
        {value}
      </p>
      <p className="text-xs font-semibold" style={{ color: "#666" }}>
        {label}
      </p>
    </OutlineBox>
  );
}

function CapabilityCard({
  title,
  description,
  examples,
}: {
  title: string;
  description: string;
  examples: string[];
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-2" style={{ color: "#276152" }}>
        {title}
      </h4>
      <p className="text-sm mb-3" style={{ color: "#666" }}>
        {description}
      </p>
      <div className="rounded p-2 text-xs space-y-1" style={{ backgroundColor: "#EEF5F2" }}>
        {examples.map((example) => (
          <div key={example} className="flex gap-2" style={{ color: "#666" }}>
            <span>→</span>
            <span>{example}</span>
          </div>
        ))}
      </div>
    </OutlineBox>
  );
}

function ComplianceArea({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-3" style={{ color: "#276152" }}>
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm flex gap-2" style={{ color: "#666" }}>
            <span style={{ color: "#276152" }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </OutlineBox>
  );
}

function PillarCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <OutlineBox>
      <div className="flex items-start gap-3 mb-2">
        <span className="text-lg font-bold" style={{ color: "#276152" }}>
          {number}
        </span>
        <h4 className="font-bold" style={{ color: "#276152" }}>
          {title}
        </h4>
      </div>
      <p className="text-sm" style={{ color: "#666" }}>
        {description}
      </p>
    </OutlineBox>
  );
}

function RuleCategory({
  title,
  count,
  rules,
}: {
  title: string;
  count: string;
  rules: string[];
}) {
  return (
    <OutlineBox>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold" style={{ color: "#276152" }}>
          {title}
        </h4>
        <span
          className="text-xs font-semibold px-2 py-1 rounded"
          style={{ backgroundColor: "#EEF5F2", color: "#276152" }}
        >
          {count}
        </span>
      </div>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li
            key={rule}
            className="text-sm flex gap-2"
            style={{ color: "#666" }}
          >
            <span style={{ color: "#276152" }}>✓</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </OutlineBox>
  );
}

function SeverityLevel({
  level,
  icon,
  description,
  examples,
  recommendation,
}: {
  level: string;
  icon: string;
  description: string;
  examples: string[];
  recommendation: string;
}) {
  return (
    <OutlineBox>
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h4 className="font-bold" style={{ color: "#276152" }}>
            {level}
          </h4>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            {description}
          </p>
        </div>
      </div>

      <div className="ml-11">
        <p className="text-xs font-semibold mb-2" style={{ color: "#276152" }}>
          Examples:
        </p>
        <ul className="space-y-1 text-sm mb-3" style={{ color: "#666" }}>
          {examples.map((example) => (
            <li key={example}>• {example}</li>
          ))}
        </ul>
        <p className="text-xs font-semibold" style={{ color: "#276152" }}>
          📋 {recommendation}
        </p>
      </div>
    </OutlineBox>
  );
}

function APIEndpoint({
  method,
  path,
  description,
  requestBody,
  responseBody,
}: {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  responseBody: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #D4CAB8" }}>
      <div
        className="p-4"
        style={{ backgroundColor: "#EEF5F2", borderBottom: "1px solid #D4CAB8" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            className="px-2 py-1 text-white text-xs font-bold rounded"
            style={{ backgroundColor: "#276152" }}
          >
            {method}
          </span>
          <code className="text-sm font-mono" style={{ color: "#276152" }}>
            {path}
          </code>
        </div>
        <p className="text-sm" style={{ color: "#666" }}>
          {description}
        </p>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "#276152" }}>
            Request:
          </p>
          <CodeBlock language="json" code={requestBody} />
        </div>
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "#276152" }}>
            Response:
          </p>
          <CodeBlock language="json" code={responseBody} />
        </div>
      </div>
    </div>
  );
}

function ErrorCode({
  code,
  status,
  examples,
}: {
  code: string;
  status: string;
  examples: string[];
}) {
  return (
    <OutlineBox>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold" style={{ color: "#276152" }}>
          {code}
        </span>
        <span className="font-semibold" style={{ color: "#276152" }}>
          {status}
        </span>
      </div>
      <ul className="space-y-1 text-sm" style={{ color: "#666" }}>
        {examples.map((example) => (
          <li key={example}>• {example}</li>
        ))}
      </ul>
    </OutlineBox>
  );
}

function RateLimitCard({
  plan,
  requests,
  audits,
  note,
}: {
  plan: string;
  requests: string;
  audits: string;
  note: string;
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-3" style={{ color: "#276152" }}>
        {plan}
      </h4>
      <div className="space-y-2 text-sm">
        <div>
          <p style={{ color: "#666" }}>Requests</p>
          <p className="font-mono font-bold" style={{ color: "#276152" }}>
            {requests}
          </p>
        </div>
        <div>
          <p style={{ color: "#666" }}>Audits</p>
          <p className="font-mono font-bold" style={{ color: "#276152" }}>
            {audits}
          </p>
        </div>
        <p className="text-xs italic" style={{ color: "#999" }}>
          {note}
        </p>
      </div>
    </OutlineBox>
  );
}

function DashboardSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold"
        style={{ backgroundColor: "#EEF5F2", color: "#276152" }}
      >
        →
      </div>
      <div>
        <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: "#666" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function MetricExplanation({
  title,
  formula,
  range,
  description,
  example,
}: {
  title: string;
  formula: string;
  range: string;
  description: string;
  example: string;
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-2" style={{ color: "#276152" }}>
        {title}
      </h4>
      <div className="space-y-2 text-sm">
        <div>
          <p style={{ color: "#666", fontWeight: "600" }}>Formula:</p>
          <code style={{ backgroundColor: "#EEF5F2", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
            {formula}
          </code>
        </div>
        <div>
          <p style={{ color: "#666", fontWeight: "600" }}>Range:</p>
          <p style={{ color: "#276152" }}>{range}</p>
        </div>
        <div>
          <p style={{ color: "#666", fontWeight: "600" }}>Description:</p>
          <p style={{ color: "#666" }}>{description}</p>
        </div>
        <div>
          <p style={{ color: "#666", fontWeight: "600" }}>Example:</p>
          <p style={{ color: "#666" }}>{example}</p>
        </div>
      </div>
    </OutlineBox>
  );
}

function HeatmapStatus({
  status,
  meaning,
  action,
}: {
  status: string;
  meaning: string;
  action: string;
}) {
  return (
    <OutlineBox>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
            {status}
          </h4>
          <p className="text-sm mb-2" style={{ color: "#666" }}>
            {meaning}
          </p>
          <p className="text-xs font-semibold" style={{ color: "#276152" }}>
            → {action}
          </p>
        </div>
      </div>
    </OutlineBox>
  );
}

function ExportOption({
  format,
  description,
  use,
  button,
}: {
  format: string;
  description: string;
  use: string;
  button: string;
}) {
  return (
    <OutlineBox>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
            {format}
          </h4>
          <p className="text-sm mb-2" style={{ color: "#666" }}>
            {description}
          </p>
          <p className="text-xs" style={{ color: "#999" }}>
            <strong>Use case:</strong> {use}
          </p>
        </div>
        <button
          className="px-4 py-2 text-white text-xs font-bold rounded flex-shrink-0"
          style={{ backgroundColor: "#276152" }}
        >
          {button}
        </button>
      </div>
    </OutlineBox>
  );
}

function StrategyPhase({
  phase,
  description,
}: {
  phase: string;
  description: string;
}) {
  return (
    <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
      <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
        {phase}
      </h4>
      <p className="text-sm" style={{ color: "#666" }}>
        {description}
      </p>
    </div>
  );
}

function RemediationStep({
  number,
  title,
  action,
}: {
  number: string;
  title: string;
  action: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold text-sm"
        style={{ backgroundColor: "#276152" }}
      >
        {number}
      </div>
      <div>
        <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: "#666" }}>
          {action}
        </p>
      </div>
    </div>
  );
}

function TeamRole({
  role,
  responsibilities,
}: {
  role: string;
  responsibilities: string[];
}) {
  return (
    <OutlineBox>
      <h4 className="font-bold mb-3" style={{ color: "#276152" }}>
        {role}
      </h4>
      <ul className="space-y-2">
        {responsibilities.map((resp) => (
          <li
            key={resp}
            className="text-sm flex gap-2"
            style={{ color: "#666" }}
          >
            <span style={{ color: "#276152", flexShrink: 0 }}>✓</span>
            <span>{resp}</span>
          </li>
        ))}
      </ul>
    </OutlineBox>
  );
}

function AuditFrequency({
  frequency,
  forText,
  benefit,
}: {
  frequency: string;
  forText: string;
  benefit: string;
}) {
  return (
    <div className="border-l-4 p-4 rounded" style={{ borderColor: "#276152", backgroundColor: "#EEF5F2" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
            {frequency}
          </h4>
          <p className="text-sm mb-1" style={{ color: "#666" }}>
            {forText}
          </p>
          <p className="text-xs" style={{ color: "#276152" }}>
            ✓ {benefit}
          </p>
        </div>
      </div>
    </div>
  );
}

function UpdateStep({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold text-sm"
        style={{ backgroundColor: "#276152" }}
      >
        {number}
      </div>
      <div>
        <h4 className="font-bold mb-1" style={{ color: "#276152" }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: "#666" }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function OutlineBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: "1px solid #D4CAB8",
        backgroundColor: "white",
      }}
    >
      {children}
    </div>
  );
}

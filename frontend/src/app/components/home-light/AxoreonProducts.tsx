"use client";

import { motion } from "framer-motion";
import { Zap, Globe, GitBranch, ExternalLink } from "lucide-react";
import Link from "next/link";

const products = [
  {
    icon: Zap,
    title: "ComplianceGPT",
    description: "Complete DPDP Audit workflow automation and compliance in day one",
    url: "https://axoreon.com",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Globe,
    title: "Swaray AI",
    description: "Language translation model providing API to translate in 22 Indian languages",
    url: "https://axoreon.com",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: GitBranch,
    title: "Data Mapping Workflow",
    description: "Map your data flow and track where each data goes across systems",
    url: "https://axoreon.com",
    gradient: "from-purple-500 to-pink-500"
  }
];

export function AxoreonProducts() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-14 lg:py-18">
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="mb-3 text-3xl font-extrabold leading-tight lg:text-4xl" style={{ color: "#276152" }}>
            Explore Other Products from <span style={{ color: "#276152" }}>Axoreon</span>
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            Discover our suite of compliance and data solutions designed for enterprise teams
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {products.map((product, idx) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="group relative"
              >
                <Link href={product.url} target="_blank" rel="noopener noreferrer">
                  <div className="relative h-full overflow-hidden rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl cursor-pointer" style={{ border: "1px solid #D4CAB8", backgroundColor: "white" }}>
                    {/* Icon */}
                    <div className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${product.gradient} p-3`}>
                      <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-lg font-extrabold" style={{ color: "#276152" }}>
                      {product.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-slate-600 mb-4">
                      {product.description}
                    </p>

                    {/* Link */}
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#276152" }}>
                      <span>Learn More</span>
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>

                    {/* Decorative Glow */}
                    <div className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br ${product.gradient} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <a
            href="https://www.axoreon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold transition-colors"
            style={{ color: "#276152" }}
          >
            Visit Axoreon →
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Axoreon',
    url: 'https://axoreon.com',
    logo: 'https://auditweave.axoreon.com/logo.png',
    sameAs: [
      'https://www.linkedin.com/company/axoreon',
      'https://www.instagram.com/axoreon.official'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'legal@axoreon.com',
      contactType: 'Customer Support',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi']
    }
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AuditWeave',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: '2 free audit credits included'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '500',
      bestRating: '5',
      worstRating: '1'
    },
    description: 'Automated DPDP Act 2023 compliance auditing platform. Scan privacy policies in under 15 seconds with AI legal reasoning.',
    screenshot: 'https://auditweave.axoreon.com/screenshot.png',
    featureList: [
      'Automated DPDP Act 2023 compliance auditing',
      '43+ statutory rule checks',
      'AI legal reasoning with 96% confidence',
      'Executive-ready PDF reports',
      'Under 15 seconds audit time',
      'Penalty risk estimation up to ₹250 Crore'
    ],
    creator: {
      '@type': 'Organization',
      name: 'Axoreon'
    }
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AuditWeave',
    url: 'https://auditweave.axoreon.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://auditweave.axoreon.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'DPDP Act 2023 Compliance Auditing',
    provider: {
      '@type': 'Organization',
      name: 'Axoreon'
    },
    areaServed: {
      '@type': 'Country',
      name: 'India'
    },
    description: 'Automated privacy policy auditing service for DPDP Act 2023 compliance with AI legal reasoning and deterministic rule engines.',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Compliance Auditing Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Free Trial - 2 Audit Credits'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Pay-As-You-Go Credits'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Enterprise Plan'
          }
        }
      ]
    }
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do the 2 free credits work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each new user receives 2 free credits to audit privacy policies. One credit allows you to analyze one complete privacy policy via URL input, text paste, or document upload (PDF/DOCX).'
        }
      },
      {
        '@type': 'Question',
        name: 'How accurate is the AI legal reasoning?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AuditWeave uses advanced AI analysis with 96% confidence scoring for legal justifications. Every finding includes explainable reasoning mapped to specific DPDP Act 2023 sections with citation references.'
        }
      },
      {
        '@type': 'Question',
        name: 'How long does an audit take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most audits complete in under 15 seconds. Our system performs 43+ automated rule checks, AI legal analysis, and generates executive-ready PDF reports with penalty estimates in real-time.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}

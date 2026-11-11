import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://auditweave.axoreon.com'),
  title: {
    default: 'AuditWeave - DPDP Act 2023 Compliance Auditing Platform | AI-Powered Privacy Policy Scanner',
    template: '%s | AuditWeave - DPDP Compliance'
  },
  description: 'Automated DPDP Act 2023 compliance auditing platform. Scan privacy policies in under 15 seconds with AI legal reasoning. Avoid ₹250 Cr penalties. Trusted by 500+ legal teams.',
  keywords: [
    'DPDP Act 2023',
    'Digital Personal Data Protection Act',
    'privacy policy audit',
    'compliance auditing',
    'India data protection',
    'DPDP compliance',
    'privacy policy scanner',
    'legal compliance tool',
    'AI compliance audit',
    'automated compliance',
    'data protection compliance',
    'privacy audit software',
    'DPDP rules 2025',
    'data privacy India',
    'compliance automation'
  ],
  authors: [{ name: 'Axoreon', url: 'https://axoreon.com' }],
  creator: 'Axoreon',
  publisher: 'Axoreon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://auditweave.axoreon.com',
    siteName: 'AuditWeave',
    title: 'AuditWeave - Stop Risking ₹250 Crore DPDP Act Penalties',
    description: 'Automated privacy policy auditing platform for DPDP Act 2023 compliance. Scan in 15 seconds, avoid penalties, get executive-ready reports. Trusted by 500+ legal teams.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AuditWeave - DPDP Act 2023 Compliance Platform'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditWeave - DPDP Act 2023 Compliance Auditing',
    description: 'Automated privacy policy auditing in under 15 seconds. AI legal reasoning + deterministic rule engine. Avoid ₹250 Cr penalties.',
    images: ['/twitter-image.png'],
    creator: '@axoreon',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://auditweave.axoreon.com',
  },
  category: 'technology',
}

'use client'

import MarketingShell from '@/components/MarketingShell'
import { Link } from '@/lib/navigation'
import { PRIVACY_PATH } from '@/lib/legal'
import { SALES_EMAIL } from '@/lib/sales'

const LAST_UPDATED = 'July 27, 2026'

const SECTIONS = [
  { id: 'agreement', label: 'Agreement' },
  { id: 'the-service', label: 'The service' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'your-content', label: 'Your content' },
  { id: 'ai-output', label: 'AI output' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'third-party-data', label: 'Third-party data' },
  { id: 'fees', label: 'Fees' },
  { id: 'termination', label: 'Termination' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
] as const

export default function TermsPage() {
  const mailto = `mailto:${SALES_EMAIL}`

  return (
    <MarketingShell>
      <article className="legal">
        <header className="legal__head">
          <div className="container">
            <p className="eyebrow">Legal</p>
            <h1>Terms of Service</h1>
            <p className="legal__lead">
              The rules for using Prokuro&apos;s BOM risk analysis service — what we provide, what you own, and how we
              work together.
            </p>
          </div>
          <div className="legal__bar">
            <div className="container legal__bar-inner">
              <span>Last updated {LAST_UPDATED}</span>
              <span>Applies to prokuro.ai and the Prokuro web app</span>
            </div>
          </div>
        </header>

        <div className="container legal__layout">
          <aside className="legal__aside" aria-label="On this page">
            <p className="legal__aside-title">On this page</p>
            <nav className="legal__toc">
              {SECTIONS.map((section, i) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span className="legal__toc-num">{String(i + 1).padStart(2, '0')}</span>
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="legal__body">
            <div className="legal__glance">
              <p className="legal__glance-title">At a glance</p>
              <ul>
                <li>Prokuro is a BOM risk analysis tool — not a procurement platform, ERP, or order system.</li>
                <li>You keep ownership of the BOM files and data you upload.</li>
                <li>AI-generated risk scores and alternate suggestions are recommendations for human review, not decisions.</li>
                <li>The service is provided as-is during early access; we do not process payments yet.</li>
                <li>Questions: <a href={mailto}>{SALES_EMAIL}</a></li>
              </ul>
            </div>

            <section id="agreement" className="legal__section">
              <span className="legal__num">01</span>
              <h2>Agreement</h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) are a contract between you and Prokuro (&quot;Prokuro,&quot;
                &quot;we,&quot; &quot;us&quot;), a company based in San Francisco, California, United States. They govern
                your access to and use of prokuro.ai, the Prokuro web application, and related services (collectively,
                the &quot;Service&quot;).
              </p>
              <p>
                By creating an account, signing in, or using the Service, you agree to these Terms and our{' '}
                <Link href={PRIVACY_PATH}>Privacy Policy</Link>. If you are using the Service on behalf of a company,
                you represent that you have authority to bind that company, and &quot;you&quot; refers to that company.
              </p>
              <p>If you do not agree, do not use the Service.</p>
            </section>

            <section id="the-service" className="legal__section">
              <span className="legal__num">02</span>
              <h2>The service</h2>
              <p>
                Prokuro is an AI-assisted procurement analyst for hardware supply chains. The Service lets you upload
                bill-of-materials (BOM) files, analyze component lifecycle, availability, lead time, and tariff exposure,
                and receive risk reports with suggested alternates.
              </p>
              <p>The Service is designed for professional use by procurement, supply chain, and engineering teams.</p>
              <p className="legal__note">
                <strong>What Prokuro is not.</strong> Prokuro is not a component database, ERP, procurement platform,
                order system, compliance certification tool, or legal or engineering advice. We do not place orders,
                guarantee part availability, or certify that any alternate is safe or suitable for your product without
                your own review.
              </p>
              <p>
                We may update, add, or remove features as the product evolves. We will try to give reasonable notice of
                material changes that affect how you use the Service.
              </p>
            </section>

            <section id="accounts" className="legal__section">
              <span className="legal__num">03</span>
              <h2>Accounts</h2>
              <p>
                You need an account to use most features. You may sign up with a work email and verification code, or with
                Google sign-in where offered.
              </p>
              <ul>
                <li>Provide accurate account information and keep it up to date.</li>
                <li>Keep your login credentials secure. You are responsible for activity under your account.</li>
                <li>Notify us promptly at <a href={mailto}>{SALES_EMAIL}</a> if you suspect unauthorized access.</li>
                <li>Do not share accounts or create accounts on behalf of others without permission.</li>
                <li>One person or organization may not maintain multiple free accounts to circumvent usage limits.</li>
              </ul>
              <p>
                We may suspend or refuse accounts that violate these Terms, pose a security risk, or appear to be used for
                scraping, abuse, or competitive intelligence gathering against the Service.
              </p>
            </section>

            <section id="your-content" className="legal__section">
              <span className="legal__num">04</span>
              <h2>Your content</h2>
              <p>
                &quot;Your Content&quot; means BOM files, part numbers, manufacturers, quantities, column mappings, notes,
                and any other data you upload or enter into the Service.
              </p>
              <ul>
                <li>
                  <strong>You retain ownership</strong> of Your Content. These Terms do not transfer ownership to
                  Prokuro.
                </li>
                <li>
                  <strong>License to operate the Service.</strong> You grant Prokuro a limited license to host, process,
                  and analyze Your Content solely to provide and improve the Service for you — including parsing your
                  files, enriching part data, generating reports, and saving results to your account.
                </li>
                <li>
                  <strong>Responsibility.</strong> You must have the right to upload Your Content and to share any
                  third-party or supplier information it contains. Do not upload data you are not authorized to share.
                </li>
                <li>
                  <strong>Deletion.</strong> You may request deletion of your account and stored BOM data by emailing{' '}
                  <a href={mailto}>{SALES_EMAIL}</a>. See our{' '}
                  <Link href={PRIVACY_PATH}>Privacy Policy</Link> for retention details.
                </li>
              </ul>
            </section>

            <section id="ai-output" className="legal__section">
              <span className="legal__num">05</span>
              <h2>AI output</h2>
              <p>
                Prokuro uses automated analysis to produce risk scores, summaries, and alternate part suggestions. This
                output is generated from Your Content, public and licensed component data, and our analysis models.
              </p>
              <ul>
                <li>
                  Output is provided as <strong>recommendations for human review</strong>, not as final procurement,
                  engineering, or compliance decisions.
                </li>
                <li>
                  You are responsible for validating any alternate, lifecycle assessment, tariff estimate, or action
                  before relying on it in production, sourcing, or design.
                </li>
                <li>
                  Component data from third parties may be incomplete, delayed, or incorrect. Tariff and trade estimates
                  are informational and may not reflect your specific import circumstances.
                </li>
                <li>
                  We do not guarantee that output is error-free, complete, or suitable for any particular use.
                </li>
              </ul>
              <p>
                Subject to these Terms, you may use reports and exports generated from your account for your internal
                business purposes.
              </p>
            </section>

            <section id="acceptable-use" className="legal__section">
              <span className="legal__num">06</span>
              <h2>Acceptable use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any unlawful purpose or in violation of export control or sanctions laws.</li>
                <li>Probe, scan, or test the vulnerability of our systems without written permission.</li>
                <li>Scrape, crawl, or systematically extract data from the Service except through documented APIs we provide.</li>
                <li>Reverse engineer, decompile, or attempt to extract source code or models except where law permits.</li>
                <li>Interfere with or disrupt the Service, other users, or third-party integrations.</li>
                <li>Upload malware, corrupted files intended to harm systems, or content you do not have rights to share.</li>
                <li>Misrepresent your identity, affiliation, or authorization to use the Service.</li>
                <li>Use the Service to build or train a competing product using our output at scale without permission.</li>
              </ul>
              <p>
                We may investigate violations and cooperate with law enforcement where required. Violations may result in
                suspension or termination.
              </p>
            </section>

            <section id="third-party-data" className="legal__section">
              <span className="legal__num">07</span>
              <h2>Third-party data and services</h2>
              <p>
                The Service relies on third-party providers for hosting, authentication, component data, demo scheduling,
                and related functions. Your use of those features may also be subject to those providers&apos; terms.
              </p>
              <p>
                Component lifecycle, stock, and pricing data come from distributors and public sources. That data is
                provided to you through Prokuro but originates from third parties. We do not control and are not
                responsible for third-party accuracy, availability, or policy changes.
              </p>
              <p>
                Links to third-party sites or services are provided for convenience. We do not endorse and are not
                responsible for third-party content or practices.
              </p>
            </section>

            <section id="fees" className="legal__section">
              <span className="legal__num">08</span>
              <h2>Fees</h2>
              <p>
                Prokuro may offer free access, trials, or paid plans. <strong>We do not process subscription payments
                through the Service today.</strong> When paid plans launch, we will publish pricing and update these
                Terms before charging you.
              </p>
              <p>
                If you enter a separate written order form, pilot agreement, or enterprise contract with Prokuro, that
                agreement controls over these Terms for the subjects it covers.
              </p>
            </section>

            <section id="termination" className="legal__section">
              <span className="legal__num">09</span>
              <h2>Termination</h2>
              <p>
                You may stop using the Service at any time and may request account deletion by emailing{' '}
                <a href={mailto}>{SALES_EMAIL}</a>.
              </p>
              <p>
                We may suspend or terminate your access if you violate these Terms, if required by law, if continuing
                would create risk to the Service or other users, or if we discontinue the Service. Where practical, we
                will give notice before termination for reasons within our control.
              </p>
              <p>
                Sections that by their nature should survive termination — including ownership, disclaimers, limitation of
                liability, indemnification, and dispute resolution — will survive.
              </p>
            </section>

            <section id="disclaimers" className="legal__section">
              <span className="legal__num">10</span>
              <h2>Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE FULLEST EXTENT PERMITTED
                BY LAW, PROKURO DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components, or
                that output will be accurate, complete, or suitable for your production decisions.
              </p>
            </section>

            <section id="liability" className="legal__section">
              <span className="legal__num">11</span>
              <h2>Limitation of liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, PROKURO AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND SUPPLIERS
                WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY
                LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING FROM OR RELATED TO YOUR USE
                OF THE SERVICE — EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY.
              </p>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, PROKURO&apos;S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR
                RELATED TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID PROKURO FOR
                THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US$100).
              </p>
              <p>
                Some jurisdictions do not allow certain limitations. In those cases, our liability is limited to the
                maximum extent permitted by law.
              </p>
            </section>

            <section id="indemnification" className="legal__section">
              <span className="legal__num">12</span>
              <h2>Indemnification</h2>
              <p>
                You will defend, indemnify, and hold harmless Prokuro and its officers, directors, employees, and agents
                from any claims, damages, losses, and expenses (including reasonable legal fees) arising from: (a) Your
                Content; (b) your use of the Service in violation of these Terms or applicable law; or (c) your reliance
                on output without appropriate validation in production or sourcing decisions.
              </p>
            </section>

            <section id="disputes" className="legal__section">
              <span className="legal__num">13</span>
              <h2>Disputes</h2>
              <p>
                These Terms are governed by the laws of the State of California, United States, without regard to
                conflict-of-law rules. Except where prohibited, you and Prokuro agree to the exclusive jurisdiction of
                the state and federal courts located in San Francisco County, California for disputes that are not
                subject to arbitration.
              </p>
              <p>
                Before filing a claim, please contact us at <a href={mailto}>{SALES_EMAIL}</a> and allow 30 days to try
                to resolve the issue informally.
              </p>
              <p>
                If you are a consumer in a jurisdiction that grants mandatory rights we cannot contract away, those
                rights remain unaffected.
              </p>
            </section>

            <section id="changes" className="legal__section">
              <span className="legal__num">14</span>
              <h2>Changes</h2>
              <p>
                We may update these Terms as the Service evolves. We will post the revised version here and update the
                date above. For material changes, we will notify account holders by email or in-product notice before
                the change takes effect. Continued use after the effective date constitutes acceptance of the updated
                Terms.
              </p>
            </section>

            <section id="contact" className="legal__section">
              <span className="legal__num">15</span>
              <h2>Contact</h2>
              <p>
                Questions about these Terms: <a href={mailto}>{SALES_EMAIL}</a>
              </p>
              <p className="legal__meta">Prokuro · San Francisco, California, United States</p>
            </section>
          </div>
        </div>
      </article>
    </MarketingShell>
  )
}

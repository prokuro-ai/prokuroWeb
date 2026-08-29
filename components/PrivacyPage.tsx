'use client'

import { SALES_EMAIL } from '@/lib/sales'
import LegalLayout, { LegalNum } from '@/components/legal/LegalLayout'

const LAST_UPDATED = 'July 27, 2026'

const SECTIONS = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'what-we-do-not-collect', label: 'What we do not collect' },
  { id: 'how-we-use-it', label: 'How we use it' },
  { id: 'legal-bases', label: 'Legal bases' },
  { id: 'your-bom-data', label: 'Your BOM data' },
  { id: 'who-we-share-with', label: 'Who we share with' },
  { id: 'retention', label: 'Retention' },
  { id: 'security', label: 'Security' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'transfers', label: 'International transfers' },
  { id: 'children', label: "Children's data" },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
] as const

const COLLECTED = [
  {
    category: 'Account',
    examples: 'Email address, first and last name, company name',
    source: 'You, at sign-up or in account settings',
  },
  {
    category: 'Authentication',
    examples: 'Email verification codes, session tokens, Google account identifier if you use Google sign-in',
    source: 'You / Google',
  },
  {
    category: 'BOM and procurement data',
    examples:
      'Uploaded CSV and Excel files, part numbers, manufacturers, quantities, reference designators, AML alternates, your saved column mappings, and the analysis we generate from them',
    source: 'You, when you upload a BOM',
  },
  {
    category: 'Demo requests',
    examples: 'First and last name, work email, phone number (optional), notes (optional)',
    source: 'You, on the booking form',
  },
  {
    category: 'Technical logs',
    examples: 'IP address, browser and device type, pages requested, timestamps, error traces',
    source: 'Collected automatically',
  },
] as const

const SUBPROCESSORS = [
  {
    provider: 'Amazon Web Services',
    purpose: 'Hosting, authentication (Cognito), BOM storage, and databases',
    region: 'United States',
  },
  {
    provider: 'Google',
    purpose: 'Optional "Continue with Google" sign-in',
    region: 'United States',
  },
  {
    provider: 'Calendly',
    purpose: 'Demo scheduling and calendar invitations',
    region: 'United States',
  },
  {
    provider: 'Digi-Key',
    purpose: 'Component lifecycle, stock, and lead-time lookups',
    region: 'United States',
  },
] as const

export default function PrivacyPage() {
  const mailto = `mailto:${SALES_EMAIL}`

  return (
    <LegalLayout
      title="Privacy Policy"
      lead="How Prokuro collects, uses, and protects your account details and the bill-of-materials data you upload."
      updated={LAST_UPDATED}
      sections={SECTIONS}
      glance={
        <>
          <li>We collect your account details, the BOM files you upload, and basic technical logs.</li>
          <li>Your BOM contents stay in your account. We do not expose them to other customers.</li>
          <li>We do not sell your data and we run no advertising or analytics trackers.</li>
          <li>We do not process payments yet, so we never receive card details.</li>
        </>
      }
    >
      <section id="who-we-are" className="mk-legal-section">
        <LegalNum n={1} />
        <h2>Who we are</h2>
        <p>
          Prokuro (&quot;Prokuro,&quot; &quot;we,&quot; &quot;us&quot;) operates prokuro.ai and the Prokuro web
          application, an AI procurement analyst for hardware supply chains. We are based in San Francisco,
          California, United States.
        </p>
        <p>
          For any privacy question, or to exercise the rights described below, email{' '}
          <a href={mailto}>{SALES_EMAIL}</a>.
        </p>
      </section>

      <section id="what-we-collect" className="mk-legal-section">
        <LegalNum n={2} />
        <h2>What we collect</h2>
        <p>We only collect what we need to run the product. This table lists every category we handle today.</p>
        <div className="overflow-x-auto border border-mk-line">
          <table className="mk-legal-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Examples</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {COLLECTED.map((row) => (
                <tr key={row.category}>
                  <th scope="row">{row.category}</th>
                  <td>{row.examples}</td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="what-we-do-not-collect" className="mk-legal-section">
        <LegalNum n={3} />
        <h2>What we do not collect</h2>
        <ul>
          <li>
            <strong>Payment or card details.</strong> Prokuro does not process payments today, so no billing data
            reaches us.
          </li>
          <li>
            <strong>Advertising identifiers.</strong> We run no ad networks, no analytics trackers, and no
            cross-site tracking pixels.
          </li>
          <li>
            <strong>Special-category data.</strong> We do not ask for health, biometric, financial account,
            government ID, or precise location data.
          </li>
          <li>
            <strong>Data from third-party data brokers.</strong> Everything we hold about you comes from you or is
            generated by your use of the product.
          </li>
        </ul>
      </section>

      <section id="how-we-use-it" className="mk-legal-section">
        <LegalNum n={4} />
        <h2>How we use it</h2>
        <ul>
          <li>Create and authenticate your account</li>
          <li>Parse your BOM files and resolve each line to a component identity</li>
          <li>
            Produce lifecycle, availability, lead-time, tariff, and risk analysis, and generate the recommendations
            shown in your report
          </li>
          <li>Save your BOMs and column mappings so you can return to them</li>
          <li>Respond to support requests and demo bookings</li>
          <li>Keep the service secure, diagnose faults, and prevent abuse</li>
          <li>Meet legal and accounting obligations</li>
        </ul>
        <p className="mk-legal-note">
          <strong>Automated analysis.</strong> Risk scores and alternate suggestions are produced automatically from
          component data and your BOM context. They are recommendations for a human to review, not automated
          decisions about you as an individual, and they carry no legal or similarly significant effect on you.
        </p>
      </section>

      <section id="legal-bases" className="mk-legal-section">
        <LegalNum n={5} />
        <h2>Legal bases</h2>
        <p>Where the GDPR or UK GDPR applies, we rely on the following bases:</p>
        <ul>
          <li>
            <strong>Contract.</strong> Providing the account, BOM analysis, and reports you asked for.
          </li>
          <li>
            <strong>Legitimate interests.</strong> Securing the service, preventing abuse, diagnosing faults, and
            improving product quality.
          </li>
          <li>
            <strong>Consent.</strong> Optional fields such as a phone number, and any future non-essential cookies
            or marketing email.
          </li>
          <li>
            <strong>Legal obligation.</strong> Where retention or disclosure is required by law.
          </li>
        </ul>
      </section>

      <section id="your-bom-data" className="mk-legal-section">
        <LegalNum n={6} />
        <h2>Your BOM data</h2>
        <p>
          Your uploaded files and the analysis derived from them are stored against your account and are not visible
          to other Prokuro customers.
        </p>
        <p>
          To analyze a line, we send <strong>part numbers and manufacturer names</strong> to component data
          providers. We do not send your file, your quantities, your company name, or the rest of your BOM. Tariff
          and HTS rates are computed from public datasets we hold ourselves, so no data leaves our systems for that
          step.
        </p>
        <p>
          We do not use your identifiable BOM contents to train models for other customers. If we later use
          aggregated substitution signals to improve recommendations, those signals will be de-identified and will
          never reveal your company or the contents of a specific file. We will update this policy before that
          changes.
        </p>
      </section>

      <section id="who-we-share-with" className="mk-legal-section">
        <LegalNum n={7} />
        <h2>Who we share with</h2>
        <p>
          We do not sell personal information and we do not share it for advertising. We use the following
          processors to run the service:
        </p>
        <div className="overflow-x-auto border border-mk-line">
          <table className="mk-legal-table">
            <thead>
              <tr>
                <th scope="col">Provider</th>
                <th scope="col">Purpose</th>
                <th scope="col">Region</th>
              </tr>
            </thead>
            <tbody>
              {SUBPROCESSORS.map((row) => (
                <tr key={row.provider}>
                  <th scope="row">{row.provider}</th>
                  <td>{row.purpose}</td>
                  <td>{row.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We may also disclose information where required by law, to enforce our terms, or to protect the rights and
          safety of our users. If Prokuro is involved in a merger or acquisition, we will give notice before your
          information becomes subject to a different policy.
        </p>
      </section>

      <section id="retention" className="mk-legal-section">
        <LegalNum n={8} />
        <h2>Retention</h2>
        <ul>
          <li>
            <strong>Account and BOM data:</strong> kept while your account is active. We delete it within 30 days of
            a deletion request, except where law requires us to keep records.
          </li>
          <li>
            <strong>Technical logs:</strong> kept for a limited period for security and debugging, then discarded or
            aggregated.
          </li>
          <li>
            <strong>Demo bookings and sales email:</strong> kept for as long as needed to manage the relationship.
          </li>
          <li>
            <strong>Backups:</strong> deleted data may persist briefly in encrypted backups before being overwritten.
          </li>
        </ul>
      </section>

      <section id="security" className="mk-legal-section">
        <LegalNum n={9} />
        <h2>Security</h2>
        <p>
          We encrypt data in transit with TLS and rely on our cloud provider&apos;s encryption at rest. Access to BOM
          data requires an authenticated session, and each account can only reach its own files. Internal access is
          limited to the people who need it to operate or support the service.
        </p>
        <p>
          No system is completely secure. We cannot guarantee absolute security, and you are responsible for keeping
          access to your email account secure, since it is used to sign in.
        </p>
      </section>

      <section id="your-rights" className="mk-legal-section">
        <LegalNum n={10} />
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, delete, export, or restrict the
          use of your personal information, to object to processing, and to withdraw consent. California residents
          have rights under the CCPA and CPRA, including the right to know, delete, and correct, and to opt out of
          sale or sharing. We do neither.
        </p>
        <ul>
          <li>
            <strong>Update your details:</strong> edit your name and company directly in account settings.
          </li>
          <li>
            <strong>Delete your account and BOM data:</strong> email <a href={mailto}>{SALES_EMAIL}</a> and we will
            action it. In-app deletion is not available yet.
          </li>
          <li>
            <strong>Get a copy of your data:</strong> email us and we will provide an export.
          </li>
        </ul>
        <p>
          We respond within 30 days. We will not discriminate against you for exercising these rights. If you are in
          the EEA or UK, you may also complain to your local data protection authority.
        </p>
      </section>

      <section id="cookies" className="mk-legal-section">
        <LegalNum n={11} />
        <h2>Cookies</h2>
        <p>
          We use only what the product needs to work. There is no advertising or analytics tracking on prokuro.ai
          today, so there is no consent banner.
        </p>
        <ul>
          <li>
            <strong>Authentication:</strong> session tokens that keep you signed in.
          </li>
          <li>
            <strong>Preferences:</strong> a small cookie remembering interface state, such as whether the sidebar is
            collapsed.
          </li>
        </ul>
        <p>
          If we add product analytics later, we will update this policy and request consent where the law requires
          it.
        </p>
      </section>

      <section id="transfers" className="mk-legal-section">
        <LegalNum n={12} />
        <h2>International transfers</h2>
        <p>
          Prokuro is operated from the United States, and our processors listed above are US-based. If you use the
          service from outside the United States, your information is transferred to and processed in the US. Where
          required, we rely on Standard Contractual Clauses or an equivalent transfer mechanism.
        </p>
      </section>

      <section id="children" className="mk-legal-section">
        <LegalNum n={13} />
        <h2>Children&apos;s data</h2>
        <p>
          Prokuro is a business product intended for use by adults in a professional capacity. It is not directed to
          children, and we do not knowingly collect information from anyone under 16. If you believe a child has
          given us information, email us and we will delete it.
        </p>
      </section>

      <section id="changes" className="mk-legal-section">
        <LegalNum n={14} />
        <h2>Changes</h2>
        <p>
          We may update this policy as the product evolves. We will post the revised version here and update the
          date above. For material changes, we will notify account holders by email before the change takes effect.
        </p>
      </section>

      <section id="contact" className="mk-legal-section">
        <LegalNum n={15} />
        <h2>Contact</h2>
        <p>
          Questions about this policy, or a request about your data: <a href={mailto}>{SALES_EMAIL}</a>
        </p>
        <p className="mk-small text-mk-ink-subtle">Prokuro · San Francisco, California, United States</p>
      </section>
    </LegalLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// legal.js — Canonical source for kbridge's Privacy Policy and Terms of
// Service, plus the version strings the consent flow records against. The web
// app renders these at /privacy and /terms; the mobile app links to those same
// hosted URLs.
//
// Membership is decided by human committee review in the admin panel (an
// applicant is approved/declined "like a job application"). kbridge does NOT
// collect government IDs, run identity-document verification, or use a
// third-party verification vendor — so there is no biometric/ID data and no
// Identity Verification Notice.
//
// ⚠️  DRAFT — NOT LEGAL ADVICE. These are starter drafts written to match what
//     the app actually collects and does. They have NOT been reviewed by a
//     licensed attorney. Before you rely on them:
//       • Have counsel review, especially the arbitration/liability clauses
//         and the discretionary-membership language.
//       • Replace every [BRACKETED] placeholder (legal entity, address,
//         contact email, governing-law state).
//       • When you change any wording, BUMP the matching version below so the
//         consent flow re-prompts and records the new acceptance.
// ─────────────────────────────────────────────────────────────────────────────

// Bump the relevant string whenever a document's wording changes.
// Keep in sync with mobile/src/legal.js.
export const LEGAL_VERSIONS = {
  terms: '2026-07-09',
  privacy: '2026-07-09',
};

export const LEGAL_EFFECTIVE_DATE = 'July 9, 2026';

// Placeholders — replace with your real details before launch.
const ENTITY = '[LEGAL ENTITY NAME]';
const CONTACT = '[privacy@your-domain.com]';
const ADDRESS = '[MAILING ADDRESS]';
const GOVERNING_LAW = '[STATE]';

export const PRIVACY = {
  key: 'privacy',
  title: 'Privacy Policy',
  version: LEGAL_VERSIONS.privacy,
  intro:
    `This Privacy Policy explains how ${ENTITY} ("kbridge," "we," "us") collects, ` +
    `uses, and protects your information when you apply for membership and use the ` +
    `kbridge application and website (the "Service"). By using the Service you agree ` +
    `to this Policy.`,
  sections: [
    { h: '1. Who we are', p: [
      `The Service is operated by ${ENTITY}, ${ADDRESS}. For any privacy question, or ` +
      `to exercise the rights described below, contact us at ${CONTACT}.`,
    ]},
    { h: '2. Information you give us', p: [
      'When you apply, we collect the information in the application form: your name, ' +
      'age, city, profession, company, years of experience, LinkedIn URL, education, a ' +
      'short professional summary, your reasons for joining, and your email address.',
      'When you create an account we collect your login credentials (your password is ' +
      'stored only in hashed form by our authentication provider). As a member we collect ' +
      'the content you create — profile details, the members you like or pass on, your ' +
      'matches, and the messages you send.',
      'We do not collect government identification or biometric data. Membership is ' +
      'decided by human review of your application; we do not ask for a passport or other ' +
      'government ID and do not create or store biometric identifiers.',
    ]},
    { h: '3. Information collected automatically', p: [
      'We and our infrastructure providers collect basic technical data needed to run the ' +
      'Service — device and app version, log and diagnostic data, and general location ' +
      'inferred from your IP address. We use only the storage and identifiers necessary to ' +
      'keep you signed in and to operate the Service.',
    ]},
    { h: '4. How we use your information', p: [
      'To review your application and decide on membership; to operate matching and ' +
      'messaging; to keep the community safe and enforce our Terms; to process ' +
      'subscriptions if you purchase a paid tier; and to contact you about your account.',
    ]},
    { h: '5. Legal bases (EEA/UK users)', p: [
      'Where GDPR/UK GDPR applies, we rely on: your consent (including explicit consent for ' +
      'any special-category data, such as data revealing ethnic origin or, for a dating ' +
      'service, information that may reveal sexual orientation); performance of our contract ' +
      'with you; and our legitimate interests in operating and securing the Service.',
    ]},
    { h: '6. How we share information', p: [
      'We share information with service providers who process it on our behalf — our hosting ' +
      'and database provider (Supabase) and, if you subscribe, our payment processor. We ' +
      'share what safety or the law requires (for example, to respond to legal process or to ' +
      'prevent harm). Other members see the profile information and messages you choose to ' +
      'share with them.',
      'We do not sell your personal information, and we do not share it for cross-context ' +
      'behavioral advertising.',
    ]},
    { h: '7. Retention', p: [
      'We keep application and account data for as long as your application or account is ' +
      'active, and afterward only as long as needed for the purposes described here or as ' +
      'the law requires. If your application is declined or withdrawn, or you delete your ' +
      'account, we delete or de-identify your personal information within a reasonable ' +
      'period, except where retention is legally required.',
    ]},
    { h: '8. Your rights', p: [
      'Depending on where you live (for example, under the CCPA/CPRA in California or GDPR ' +
      'in the EEA/UK), you may have the right to access, correct, delete, or port your data, ' +
      'to opt out of certain processing, and to withdraw consent. California residents may ' +
      'exercise rights over "sensitive personal information." You can delete your account ' +
      'from within the app, or contact us at ' + CONTACT + '. We will not discriminate ' +
      'against you for exercising these rights.',
    ]},
    { h: '9. Security', p: [
      'We use administrative and technical safeguards, including access controls and ' +
      'encryption in transit. No method of transmission or storage is perfectly secure, ' +
      'and we cannot guarantee absolute security.',
    ]},
    { h: '10. Children', p: [
      'The Service is strictly for adults 18 and older. We do not knowingly collect ' +
      'information from anyone under 18; if we learn we have, we delete it.',
    ]},
    { h: '11. International transfers', p: [
      'We may process and store information in the United States and other countries. Where ' +
      'required, we use appropriate safeguards for cross-border transfers.',
    ]},
    { h: '12. Changes to this Policy', p: [
      'We may update this Policy. When we make material changes we will update the version ' +
      'and date and, where required, ask you to review and accept the new version before you ' +
      'continue using the Service.',
    ]},
    { h: '13. Contact', p: [
      `Questions or requests: ${CONTACT}, or ${ENTITY}, ${ADDRESS}.`,
    ]},
  ],
};

export const TERMS = {
  key: 'terms',
  title: 'Terms of Service',
  version: LEGAL_VERSIONS.terms,
  intro:
    `These Terms of Service ("Terms") are a contract between you and ${ENTITY} ("kbridge," ` +
    `"we," "us") governing your use of the Service. By applying, creating an account, or ` +
    `using the Service you agree to these Terms and to our Privacy Policy.`,
  sections: [
    { h: '1. Eligibility', p: [
      'You must be at least 18 years old and able to form a binding contract to use the ' +
      'Service. The Service is intended for personal, non-commercial use.',
    ]},
    { h: '2. Membership and application', p: [
      'kbridge is an application-based community. Submitting an application does not ' +
      'guarantee admission. Each application is reviewed by hand, and membership decisions ' +
      'are made at our discretion based on our community criteria; we may decline or defer ' +
      'an application, or later suspend or revoke membership, consistent with applicable ' +
      'law. We do not make membership decisions on the basis of any characteristic protected ' +
      'by law.',
    ]},
    { h: '3. Your account', p: [
      'Keep your credentials confidential; you are responsible for activity on your account. ' +
      'Provide accurate information and keep it current. You may delete your account at any ' +
      'time from within the app.',
    ]},
    { h: '4. Community conduct', p: [
      'You agree not to: harass, threaten, or harm other members; impersonate anyone; post ' +
      'unlawful, hateful, or sexually exploitative content; solicit money or engage in ' +
      'commercial or fraudulent activity; or collect other members’ information. We may ' +
      'remove content and suspend or terminate accounts that violate these Terms. You can ' +
      'report or block other members in the app, and we act on reports.',
    ]},
    { h: '5. Your content', p: [
      'You retain ownership of the content you submit. You grant us a limited license to ' +
      'host and display it as needed to operate the Service. You are responsible for the ' +
      'content you share with other members.',
    ]},
    { h: '6. Safety; no background checks', p: [
      'kbridge does not conduct criminal background checks on members unless expressly ' +
      'stated. We do not guarantee any member’s identity, conduct, or compatibility. ' +
      'You are solely responsible for your interactions. Meet in public, tell someone your ' +
      'plans, and never send money to someone you have not met. If you feel unsafe, contact ' +
      'local authorities.',
    ]},
    { h: '7. Subscriptions and payments', p: [
      'Some features may require a paid subscription. Prices, billing periods, and what each ' +
      'tier includes will be disclosed at purchase. Subscriptions purchased through a mobile ' +
      'app store are billed by that store and governed by its terms; auto-renewing ' +
      'subscriptions renew until canceled, and you can cancel through the store or as ' +
      'otherwise described at purchase. Except where required by law, payments are ' +
      'non-refundable.',
    ]},
    { h: '8. Termination', p: [
      'You may stop using the Service and delete your account at any time. We may suspend or ' +
      'terminate access if you violate these Terms or to protect the community or comply ' +
      'with law.',
    ]},
    { h: '9. Disclaimers', p: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, TO ' +
      'THE FULLEST EXTENT PERMITTED BY LAW.',
    ]},
    { h: '10. Limitation of liability', p: [
      'TO THE FULLEST EXTENT PERMITTED BY LAW, kbridge WILL NOT BE LIABLE FOR INDIRECT, ' +
      'INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY AMOUNT EXCEEDING ' +
      'WHAT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM. Some jurisdictions do not allow ' +
      'these limits, so they may not apply to you.',
    ]},
    { h: '11. Dispute resolution', p: [
      '[REVIEW WITH COUNSEL] The parties agree to resolve disputes through binding individual ' +
      'arbitration and waive class actions, to the extent permitted by law. Consult counsel ' +
      'before relying on this clause — its enforceability varies by jurisdiction and it must ' +
      'be presented correctly to be effective.',
    ]},
    { h: '12. Governing law', p: [
      `These Terms are governed by the laws of the State of ${GOVERNING_LAW}, without regard ` +
      'to its conflict-of-laws rules.',
    ]},
    { h: '13. Changes', p: [
      'We may update these Terms. When changes are material we will update the version and, ' +
      'where required, ask you to accept the new version before continuing.',
    ]},
    { h: '14. Contact', p: [
      `${CONTACT} · ${ENTITY}, ${ADDRESS}.`,
    ]},
  ],
};

export const DOCUMENTS = { privacy: PRIVACY, terms: TERMS };

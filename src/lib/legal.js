// ─────────────────────────────────────────────────────────────────────────────
// legal.js — Canonical source for kbridge's Privacy Policy and Terms of
// Service, plus the version strings the consent flow records against. The web
// app renders these at /privacy and /terms; the mobile app links to those same
// hosted URLs.
//
// Membership is decided by human review in the admin panel; kbridge does NOT
// collect government IDs, run identity-document verification, or use a
// biometric vendor. Members may be categorized/ranked by the admins using the
// info they provide — the docs disclose this and commit that it is NOT based on
// protected characteristics.
//
// These Terms are written to shift the shiftable risk onto the user
// (assumption of risk, release, indemnification, warranties). Note what a ToS
// CANNOT do: waive your own statutory duties (anti-discrimination, data
// protection) or your own illegal conduct. A discriminatory ranking is not
// cured by any clause here — the ranking itself must stay on neutral criteria.
//
// ⚠️  DRAFT — NOT LEGAL ADVICE. Starter drafts, not reviewed by a licensed
//     attorney. Before you rely on them:
//       • Have counsel review — especially the release + assumption-of-risk,
//         the arbitration/class-waiver, the limitation of liability, and the
//         "not based on protected characteristics" representation (that last
//         one is FALSE and dangerous if your ranking specs include age,
//         appearance, sex, income, or similar — see the categorization note).
//       • Replace every [BRACKETED] placeholder (entity, address, contact,
//         governing-law state).
//       • Bump the matching version below on any material wording change so
//         the consent flow re-prompts and records the new acceptance. Keep in
//         sync with mobile/src/legal.js.
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_VERSIONS = {
  terms: '2026-07-09.2',
  privacy: '2026-07-09.2',
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
      'the content you create — profile details, photos you upload, the members you like ' +
      'or pass on, your matches, and the messages you send.',
      'We do not collect government identification or biometric data. Membership is ' +
      'decided by human review of your application and photos; we do not ask for a ' +
      'passport or other government ID and do not create or store biometric identifiers.',
    ]},
    { h: '3. Information collected automatically', p: [
      'We and our infrastructure providers collect basic technical data needed to run the ' +
      'Service — device and app version, log and diagnostic data, and general location ' +
      'inferred from your IP address. We use only the storage and identifiers necessary to ' +
      'keep you signed in and to operate the Service.',
    ]},
    { h: '4. How we use your information', p: [
      'To review your application and decide on membership; to operate matching and ' +
      'messaging; to categorize and organize member profiles (see the next section); to ' +
      'keep the community safe and enforce our Terms; to process subscriptions if you ' +
      'purchase a paid tier; and to contact you about your account.',
    ]},
    { h: '5. Categorization and profiling', p: [
      'To operate the Service and suggest relevant connections, we review, categorize, and ' +
      'rank member profiles based on the information you provide (such as your profile ' +
      'details and stated preferences) and your activity. This categorization is not based ' +
      'on characteristics protected by law. Where required, we rely on your consent for ' +
      'this processing, and you may contact us for information about how it works or to ' +
      'object. We do not use it to make decisions producing legal or similarly significant ' +
      'effects about you without a lawful basis.',
    ]},
    { h: '6. Legal bases (EEA/UK users)', p: [
      'Where GDPR/UK GDPR applies, we rely on: your consent (including explicit consent for ' +
      'any special-category data, such as data revealing ethnic origin or, for a dating ' +
      'service, information that may reveal sexual orientation); performance of our contract ' +
      'with you; and our legitimate interests in operating and securing the Service.',
    ]},
    { h: '7. How we share information', p: [
      'We share information with service providers who process it on our behalf — our hosting ' +
      'and database provider (Supabase) and, if you subscribe, our payment processor. We ' +
      'share what safety or the law requires (for example, to respond to legal process or to ' +
      'prevent harm). Other members see the profile information and messages you choose to ' +
      'share with them.',
      'We do not sell your personal information, and we do not share it for cross-context ' +
      'behavioral advertising.',
    ]},
    { h: '8. Retention', p: [
      'We keep application and account data for as long as your application or account is ' +
      'active, and afterward only as long as needed for the purposes described here or as ' +
      'the law requires. If your application is declined or withdrawn, or you delete your ' +
      'account, we delete or de-identify your personal information — including any photos ' +
      'you uploaded — within a reasonable period, except where retention is legally required.',
    ]},
    { h: '9. Your rights', p: [
      'Depending on where you live (for example, under the CCPA/CPRA in California or GDPR ' +
      'in the EEA/UK), you may have the right to access, correct, delete, or port your data, ' +
      'to opt out of certain processing, and to withdraw consent. California residents may ' +
      'exercise rights over "sensitive personal information." You can delete your account ' +
      'from within the app, or contact us at ' + CONTACT + '. We will not discriminate ' +
      'against you for exercising these rights.',
    ]},
    { h: '10. Security', p: [
      'We use administrative and technical safeguards, including access controls and ' +
      'encryption in transit, and keep photos submitted for review in access-restricted ' +
      'storage. No method of transmission or storage is perfectly secure, and we cannot ' +
      'guarantee absolute security.',
    ]},
    { h: '11. Children', p: [
      'The Service is strictly for adults 18 and older. We do not knowingly collect ' +
      'information from anyone under 18; if we learn we have, we delete it.',
    ]},
    { h: '12. International transfers', p: [
      'We may process and store information in the United States and other countries. Where ' +
      'required, we use appropriate safeguards for cross-border transfers.',
    ]},
    { h: '13. Changes to this Policy', p: [
      'We may update this Policy. When we make material changes we will update the version ' +
      'and date and, where required, ask you to review and accept the new version before you ' +
      'continue using the Service.',
    ]},
    { h: '14. Contact', p: [
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
    `using the Service you agree to these Terms and to our Privacy Policy. Please read the ` +
    `assumption of risk, release, and dispute-resolution sections carefully — they affect ` +
    `your legal rights.`,
  sections: [
    { h: '1. Eligibility', p: [
      'You must be at least 18 years old and able to form a binding contract to use the ' +
      'Service. The Service is intended for personal, non-commercial use.',
    ]},
    { h: '2. Membership and application', p: [
      'kbridge is an application-based community. Submitting an application does not ' +
      'guarantee admission. Each application is reviewed by hand, and membership decisions ' +
      'are made at our discretion; we may decline or defer an application, or later suspend ' +
      'or revoke membership, consistent with applicable law. We do not make membership ' +
      'decisions on the basis of any characteristic protected by law.',
    ]},
    { h: '3. Member categorization and profile visibility', p: [
      'To operate the Service, we may review, categorize, rank, and organize member ' +
      'profiles — including the order in which profiles are shown and to whom — using the ' +
      'information members provide and their activity. Categorization is at our discretion ' +
      'and is not based on any characteristic protected by law. We do not guarantee any ' +
      'particular visibility, ranking, number of matches, or outcome, and categories or ' +
      'rankings may change at any time.',
    ]},
    { h: '4. Your account', p: [
      'Keep your credentials confidential; you are responsible for activity on your account. ' +
      'Provide accurate information and keep it current. You may delete your account at any ' +
      'time from within the app.',
    ]},
    { h: '5. Your representations and warranties', p: [
      'By using the Service you represent and warrant that: you are at least 18 years old; ' +
      'all information you provide is true, accurate, and about yourself; you own or have ' +
      'the right to use every photo and item of content you upload; you are not a convicted ' +
      'sex offender and have not been convicted of a felony or a violent or serious crime ' +
      'that would endanger other members; and you will use the Service lawfully and only ' +
      'for personal, non-commercial purposes.',
    ]},
    { h: '6. Community conduct', p: [
      'You agree not to: harass, threaten, or harm other members; impersonate anyone; post ' +
      'unlawful, hateful, or sexually exploitative content; solicit money or engage in ' +
      'commercial or fraudulent activity; or collect other members’ information. We may ' +
      'remove content and suspend or terminate accounts that violate these Terms. You can ' +
      'report or block other members in the app, and we act on reports.',
    ]},
    { h: '7. Your content', p: [
      'You retain ownership of the content you submit. You grant us a limited license to ' +
      'host and display it as needed to operate the Service. You are responsible for the ' +
      'content you share with other members.',
    ]},
    { h: '8. Safety, assumption of risk, and release', p: [
      'kbridge is a venue to meet people. We do not conduct criminal background checks, do ' +
      'not verify any member’s identity beyond reviewing their application and photos, and ' +
      'do not guarantee any member’s identity, background, conduct, or compatibility.',
      'You are solely responsible for your interactions with other members, online and ' +
      'offline. Always use caution — meet in public, tell someone your plans, and never send ' +
      'money to someone you have not met. If you feel unsafe, contact local authorities.',
      'ASSUMPTION OF RISK AND RELEASE. You assume all risk arising from your use of the ' +
      'Service and your interactions with other members. To the fullest extent permitted by ' +
      'law, you release kbridge and its owners, employees, and agents from any and all ' +
      'claims, demands, damages, and liabilities of every kind, known or unknown, arising ' +
      'out of or in any way connected with any interaction with, or the conduct of, another ' +
      'member or third party — whether online or in person.',
    ]},
    { h: '9. Subscriptions and payments', p: [
      'Some features may require a paid subscription. Prices, billing periods, and what each ' +
      'tier includes will be disclosed at purchase. Subscriptions purchased through a mobile ' +
      'app store are billed by that store and governed by its terms; auto-renewing ' +
      'subscriptions renew until canceled, and you can cancel through the store or as ' +
      'otherwise described at purchase. Except where required by law, payments are ' +
      'non-refundable.',
    ]},
    { h: '10. Termination', p: [
      'You may stop using the Service and delete your account at any time. We may suspend or ' +
      'terminate access if you violate these Terms or to protect the community or comply ' +
      'with law.',
    ]},
    { h: '11. Disclaimers', p: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, TO ' +
      'THE FULLEST EXTENT PERMITTED BY LAW. WE DO NOT WARRANT THAT THE SERVICE WILL BE ' +
      'UNINTERRUPTED OR ERROR-FREE, OR THAT YOU WILL FIND A MATCH OR ANY PARTICULAR OUTCOME.',
    ]},
    { h: '12. Limitation of liability', p: [
      'TO THE FULLEST EXTENT PERMITTED BY LAW, kbridge WILL NOT BE LIABLE FOR INDIRECT, ' +
      'INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, ' +
      'PROFITS, OR GOODWILL, OR FOR ANY AMOUNT EXCEEDING WHAT YOU PAID US IN THE 12 MONTHS ' +
      'BEFORE THE CLAIM. Some jurisdictions do not allow these limits, so they may not apply ' +
      'to you.',
    ]},
    { h: '13. Indemnification', p: [
      'You agree to indemnify, defend, and hold harmless kbridge and its owners, employees, ' +
      'and agents from any claim, loss, liability, or expense (including reasonable ' +
      'attorneys’ fees) arising out of your content, your use of the Service, your ' +
      'interactions with other members, or your violation of these Terms or of any law or ' +
      'the rights of another.',
    ]},
    { h: '14. Dispute resolution', p: [
      '[REVIEW WITH COUNSEL] The parties agree to resolve disputes through binding individual ' +
      'arbitration and waive class actions, to the extent permitted by law. Consult counsel ' +
      'before relying on this clause — its enforceability varies by jurisdiction and it must ' +
      'be presented correctly to be effective.',
    ]},
    { h: '15. Governing law', p: [
      `These Terms are governed by the laws of the State of ${GOVERNING_LAW}, without regard ` +
      'to its conflict-of-laws rules.',
    ]},
    { h: '16. Changes', p: [
      'We may update these Terms. When changes are material we will update the version and, ' +
      'where required, ask you to accept the new version before continuing.',
    ]},
    { h: '17. Contact', p: [
      `${CONTACT} · ${ENTITY}, ${ADDRESS}.`,
    ]},
  ],
};

export const DOCUMENTS = { privacy: PRIVACY, terms: TERMS };

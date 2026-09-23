/**
 * Canonical Privacy Policy and Terms of Service for Peaches, plus the version
 * strings the consent flow records against, and the public pages the app
 * stores ask for: Child Safety Standards, account deletion, and support. The
 * web app renders every page here (/privacy, /terms, /child-safety,
 * /delete-account, /support); the mobile app links to those hosted pages and
 * records the same versions.
 *
 * Membership is decided by human review. Peaches does not collect government
 * IDs or biometric data; verification is a manual committee review of the
 * information members provide, recorded per dimension (identity, education,
 * student status, employment).
 *
 * DRAFT - NOT LEGAL ADVICE. Not yet reviewed by a licensed attorney. Have
 * counsel review them (especially the release, limitation of liability, the
 * choice of Georgia courts, and the "not based on protected characteristics"
 * representation), and bump LEGAL_VERSIONS in constants/limits.ts on any
 * material wording change so the consent flow records the new acceptance.
 */
import { BRAND, LEGAL_EFFECTIVE_DATE, LEGAL_VERSIONS } from '../constants/limits';

export interface LegalSection {
  h: string;
  p: string[];
}

export type LegalPageKey = 'privacy' | 'terms' | 'child-safety' | 'delete-account' | 'support';

export interface LegalPage {
  key: LegalPageKey;
  title: string;
  /** Only the documents members accept (Privacy Policy, Terms) carry a version. */
  version?: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

/** A document members accept; the consent flow records its version. */
export interface LegalDocument extends LegalPage {
  key: 'privacy' | 'terms';
  version: string;
}

const ENTITY = BRAND.company;
const CONTACT = BRAND.supportEmail;
const CHILD_SAFETY_CONTACT = BRAND.childSafetyEmail;
const GOVERNING_LAW = 'Georgia';
const NAME = BRAND.name;

export const PRIVACY: LegalDocument = {
  key: 'privacy',
  title: 'Privacy Policy',
  version: LEGAL_VERSIONS.privacy,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro:
    `This Privacy Policy explains how ${ENTITY} ("${NAME}," "we," "us") collects, uses, and ` +
    `protects your information when you apply for membership and use the ${NAME} application ` +
    `and website (the "Service"). By using the Service you agree to this Policy.`,
  sections: [
    { h: '1. Who we are', p: [
      `The Service is operated by ${ENTITY}. For any privacy question, or to exercise the rights ` +
      `described below, contact us at ${CONTACT}.`,
    ]},
    { h: '2. Information you give us', p: [
      'When you apply, we collect the information in the application form: your name, age, the ' +
      'area you live in, your occupation and employer, years of experience, a LinkedIn URL, your ' +
      'education, a short summary, your reasons for joining, and your email address.',
      'When you create an account we collect your login credentials (your password is stored only ' +
      'in hashed form by our authentication provider). As a member we collect the content you ' +
      'create: profile details, including optional information such as nationality, race or ' +
      'ethnicity, languages, height, relationship intent, lifestyle, and interests; photos you ' +
      'upload; your discovery preferences; posts and comments; introduction requests; and the ' +
      'messages you send.',
      'Nationality, race or ethnicity, and lifestyle details are optional. Where you choose "Prefer ' +
      'not to say," that choice is recorded only so the field can be hidden; it is never used to ' +
      'match you with anyone.',
      'We do not collect government identification or biometric data. Membership and verification ' +
      'are decided by human review of the information you provide; we do not ask for a passport or ' +
      'other government ID and do not create or store biometric identifiers.',
    ]},
    { h: '3. Location', p: [
      'You tell us the area of Metro Atlanta you live in by choosing from a list of areas. We use ' +
      'it to compute approximate distances between members and to apply the maximum distance you ' +
      'set. Other members see only a coarse public label such as "Duluth area." We do not collect ' +
      'precise device location, addresses, or real-time movement.',
    ]},
    { h: '4. Information collected automatically', p: [
      'We and our infrastructure providers collect basic technical data needed to run the Service: ' +
      'device and app version, log and diagnostic data, and general location inferred from your IP ' +
      'address. We use only the storage and identifiers necessary to keep you signed in and to ' +
      'operate the Service.',
    ]},
    { h: '5. How we use your information', p: [
      'To review your application and decide on membership; to review verification requests; to ' +
      'operate discovery, introductions, the feed, and messaging; to organize and order member ' +
      'profiles (see the next section); to keep the community safe and enforce our Terms; and to ' +
      'contact you about your account.',
    ]},
    { h: '6. Recommendations and profiling', p: [
      'To suggest relevant people, we order member profiles using the preferences each member sets ' +
      '(including how strongly each preference is held), stated intent, approximate distance, ' +
      'recent activity, how recently a member joined, and internal engagement measures such as how ' +
      'many introduction requests a member has received. Nationality and race or ethnicity affect ' +
      'recommendations only when a member explicitly selects them in their own preferences, and ' +
      'they never change how often anyone is shown in general. Internal measures are never shown ' +
      'to members. Where required, we rely on your consent for this processing, and you may contact ' +
      'us for information about how it works or to object.',
    ]},
    { h: '7. Legal bases (EEA/UK users)', p: [
      'Where GDPR/UK GDPR applies, we rely on: your consent (including explicit consent for any ' +
      'special-category data, such as data revealing ethnic origin or, for a dating service, ' +
      'information that may reveal sexual orientation); performance of our contract with you; and ' +
      'our legitimate interests in operating and securing the Service.',
    ]},
    { h: '8. How we share information', p: [
      'We share information with service providers who process it on our behalf, such as our ' +
      'hosting and database provider (Supabase). We share what safety or the law requires (for ' +
      'example, to respond to legal process or to prevent harm). Other members see the profile ' +
      'information, posts, and messages you choose to share with them.',
      'We do not sell your personal information, and we do not share it for cross-context ' +
      'behavioral advertising.',
    ]},
    { h: '9. Retention', p: [
      'We keep application and account data for as long as your application or account is active, ' +
      'and afterward only as long as needed for the purposes described here or as the law requires. ' +
      'If your application is declined or withdrawn, or you delete your account, we delete or ' +
      'de-identify your personal information, including any photos you uploaded, within a ' +
      'reasonable period, except where retention is legally required.',
    ]},
    { h: '10. Your rights', p: [
      'Depending on where you live (for example, under the CCPA/CPRA in California or GDPR in the ' +
      'EEA/UK), you may have the right to access, correct, delete, or port your data, to opt out of ' +
      'certain processing, and to withdraw consent. California residents may exercise rights over ' +
      '"sensitive personal information." You can delete your account from within the app or from ' +
      `Settings on our website, or by contacting us at ${CONTACT}. We will not discriminate against ` +
      'you for exercising these rights.',
    ]},
    { h: '11. Security', p: [
      'We use administrative and technical safeguards, including access controls and encryption in ' +
      'transit. Private information such as your exact area, your preferences, and verification ' +
      'details is stored so that only you and our review team can read it. No method of ' +
      'transmission or storage is perfectly secure, and we cannot guarantee absolute security.',
    ]},
    { h: '12. Children', p: [
      'The Service is strictly for adults 18 and older. We do not knowingly collect information ' +
      'from anyone under 18; if we learn we have, we delete it.',
    ]},
    { h: '13. International transfers', p: [
      'We may process and store information in the United States and other countries. Where ' +
      'required, we use appropriate safeguards for cross-border transfers.',
    ]},
    { h: '14. Changes to this Policy', p: [
      'We may update this Policy. When we make material changes we will update the version and date ' +
      'and, where required, ask you to review and accept the new version before you continue using ' +
      'the Service.',
    ]},
    { h: '15. Contact', p: [
      `Questions or requests: ${CONTACT} (${ENTITY}).`,
    ]},
  ],
};

export const TERMS: LegalDocument = {
  key: 'terms',
  title: 'Terms of Service',
  version: LEGAL_VERSIONS.terms,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro:
    `These Terms of Service ("Terms") are a contract between you and ${ENTITY} ("${NAME}," "we," ` +
    `"us") governing your use of the Service. By applying, creating an account, or using the ` +
    `Service you agree to these Terms and to our Privacy Policy. Please read the assumption of ` +
    `risk, release, and dispute-resolution sections carefully; they affect your legal rights.`,
  sections: [
    { h: '1. Eligibility', p: [
      'You must be at least 18 years old and able to form a binding contract to use the Service. ' +
      'The Service is intended for personal, non-commercial use.',
    ]},
    { h: '2. Membership and application', p: [
      `${NAME} is an application-based community. Submitting an application does not guarantee ` +
      'admission. Each application is reviewed by hand, and membership decisions are made at our ' +
      'discretion; we may decline or defer an application, or later suspend or revoke membership, ' +
      'consistent with applicable law. We do not make membership decisions on the basis of any ' +
      'characteristic protected by law.',
    ]},
    { h: '3. Verification', p: [
      'Members may ask us to verify their identity, education, student status, or employment. ' +
      'Verification is a manual review of information you provide and is recorded separately for ' +
      'each of those dimensions. A verification badge means we reviewed the information you gave ' +
      'us; it is not a guarantee of any member\'s identity, background, or conduct. We may decline ' +
      'or withdraw a verification at any time.',
    ]},
    { h: '4. Recommendations and profile visibility', p: [
      'To operate the Service, we order and organize member profiles, including the order in which ' +
      'profiles are shown and to whom, using the preferences members set, their activity, and ' +
      'internal engagement measures. Ordering is at our discretion and is not based on any ' +
      'characteristic protected by law. We do not guarantee any particular visibility, number of ' +
      'introductions, or outcome, and ordering may change at any time.',
    ]},
    { h: '5. Your account', p: [
      'Keep your credentials confidential; you are responsible for activity on your account. ' +
      'Provide accurate information and keep it current. You may delete your account at any time ' +
      'from within the app or from Settings on our website.',
    ]},
    { h: '6. Your representations and warranties', p: [
      'By using the Service you represent and warrant that: you are at least 18 years old; all ' +
      'information you provide is true, accurate, and about yourself; you own or have the right to ' +
      'use every photo and item of content you upload; you are not a convicted sex offender and ' +
      'have not been convicted of a felony or a violent or serious crime that would endanger other ' +
      'members; and you will use the Service lawfully and only for personal, non-commercial purposes.',
    ]},
    { h: '7. Community conduct', p: [
      'You agree not to: harass, threaten, or harm other members; impersonate anyone; post unlawful, ' +
      'hateful, or sexually explicit or exploitative content; solicit money or engage in commercial ' +
      'or fraudulent activity; or collect other members\' information.',
      'We have zero tolerance for objectionable content and abusive members. Text containing slurs, ' +
      'threats, or explicit sexual content is blocked when it is written, and you can report any ' +
      'member, post, comment, or conversation and block any member from within the app. We review ' +
      'reports within 24 hours, remove content that violates these Terms, and suspend or remove the ' +
      'members responsible.',
      `Child sexual abuse and exploitation of any kind is prohibited. ${NAME} is for adults only. We ` +
      'remove such content, permanently remove the accounts involved, and report it to the National ' +
      'Center for Missing & Exploited Children and to law enforcement as the law requires. Our Child ' +
      'Safety Standards describe how we prevent, review, and report it.',
    ]},
    { h: '8. Your content', p: [
      'You retain ownership of the content you submit, including posts and comments. You grant us a ' +
      'limited license to host and display it as needed to operate the Service. You are responsible ' +
      'for the content you share with other members.',
    ]},
    { h: '9. Safety, assumption of risk, and release', p: [
      `${NAME} is a venue to meet people. We do not conduct criminal background checks, do not ` +
      'verify any member beyond reviewing the information they provide, and do not guarantee any ' +
      'member\'s identity, background, conduct, or compatibility.',
      'You are solely responsible for your interactions with other members, online and offline. ' +
      'Always use caution: meet in public, tell someone your plans, and never send money to someone ' +
      'you have not met. If you feel unsafe, contact local authorities.',
      'ASSUMPTION OF RISK AND RELEASE. You assume all risk arising from your use of the Service and ' +
      'your interactions with other members. To the fullest extent permitted by law, you release ' +
      `${NAME} and its owners, employees, and agents from any and all claims, demands, damages, and ` +
      'liabilities of every kind, known or unknown, arising out of or in any way connected with any ' +
      'interaction with, or the conduct of, another member or third party, whether online or in person.',
    ]},
    { h: '10. Paid features', p: [
      'The Service is currently free. If we introduce paid features, prices, billing periods, and ' +
      'what each includes will be disclosed at purchase. Purchases made through a mobile app store ' +
      'are billed by that store and governed by its terms. Except where required by law, payments ' +
      'are non-refundable.',
    ]},
    { h: '11. Termination', p: [
      'You may stop using the Service and delete your account at any time. We may suspend or ' +
      'terminate access if you violate these Terms or to protect the community or comply with law.',
    ]},
    { h: '12. Disclaimers', p: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, TO THE ' +
      'FULLEST EXTENT PERMITTED BY LAW. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ' +
      'ERROR-FREE, OR THAT YOU WILL MEET ANYONE OR REACH ANY PARTICULAR OUTCOME.',
    ]},
    { h: '13. Limitation of liability', p: [
      `TO THE FULLEST EXTENT PERMITTED BY LAW, ${NAME.toUpperCase()} WILL NOT BE LIABLE FOR INDIRECT, ` +
      'INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, PROFITS, OR ' +
      'GOODWILL, OR FOR ANY AMOUNT EXCEEDING WHAT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM. Some ' +
      'jurisdictions do not allow these limits, so they may not apply to you.',
    ]},
    { h: '14. Indemnification', p: [
      `You agree to indemnify, defend, and hold harmless ${NAME} and its owners, employees, and ` +
      'agents from any claim, loss, liability, or expense (including reasonable attorneys\' fees) ' +
      'arising out of your content, your use of the Service, your interactions with other members, ' +
      'or your violation of these Terms or of any law or the rights of another.',
    ]},
    { h: '15. Dispute resolution', p: [
      `Before bringing a claim, please contact us at ${CONTACT}; most concerns can be resolved ` +
      'informally. Any dispute arising out of or relating to these Terms or the Service will be ' +
      `resolved exclusively in the state or federal courts located in the State of ${GOVERNING_LAW}, ` +
      'and you and we consent to the personal jurisdiction of those courts. Either party may instead ' +
      'bring an individual claim in small claims court where it qualifies.',
    ]},
    { h: '16. Governing law', p: [
      `These Terms are governed by the laws of the State of ${GOVERNING_LAW}, without regard to its ` +
      'conflict-of-laws rules.',
    ]},
    { h: '17. Changes', p: [
      'We may update these Terms. When changes are material we will update the version and, where ' +
      'required, ask you to accept the new version before continuing.',
    ]},
    { h: '18. Contact', p: [
      `${CONTACT} · ${ENTITY}.`,
    ]},
  ],
};

/** Google Play's Child Safety Standards policy, which applies to dating apps. */
export const CHILD_SAFETY: LegalPage = {
  key: 'child-safety',
  title: 'Child Safety Standards',
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro:
    `${NAME} is a members-only community for adults 18 and older, operated by ${ENTITY}. We have ` +
    'zero tolerance for child sexual abuse and exploitation (CSAE).',
  sections: [
    { h: 'Our standards', p: [
      `Child sexual abuse and exploitation of any kind is prohibited on ${NAME}. That includes ` +
      'sexual content involving anyone under 18 (child sexual abuse material, or CSAM), grooming, ' +
      'sexualizing minors, sextortion, trafficking, and any attempt to contact a minor for sexual ' +
      'purposes. These standards are part of our Terms of Service and apply to profiles, photos, ' +
      'posts, comments, introduction notes, and messages.',
    ]},
    { h: 'Adults only', p: [
      'Everyone applies for membership and confirms they are 18 or older, and a person reviews ' +
      'every application before an account exists. If we learn that a member is under 18, we remove ' +
      'the account.',
    ]},
    { h: 'Prevention', p: [
      'Text that includes sexual content involving minors is blocked automatically when it is ' +
      'written. Our team reviews applications, reported content, and reported members by hand.',
    ]},
    { h: 'Reporting', p: [
      'Members can report any profile, photo, post, comment, or conversation from within the app, ' +
      'and can block anyone at any time. Anyone, member or not, can report a concern to our child ' +
      'safety contact below.',
      'If a child is in immediate danger, call 911 first. You can also report child sexual ' +
      'exploitation directly to the National Center for Missing & Exploited Children at ' +
      'report.cybertip.org or 1-800-843-5678.',
    ]},
    { h: 'How we respond', p: [
      'Child safety reports come first, and we review them within 24 hours. When we find or learn ' +
      'of child sexual abuse material or exploitation, we remove the content, permanently remove the ' +
      'accounts involved, preserve the information the law requires, and report it to the National ' +
      'Center for Missing & Exploited Children (CyberTipline) and to law enforcement as the law ' +
      'requires. We cooperate with law enforcement investigations.',
    ]},
    { h: 'Child safety contact', p: [
      `${ENTITY}'s designated child safety contact can be reached at ${CHILD_SAFETY_CONTACT}. This ` +
      'contact receives reports from members, the public, and app stores, and can speak to how we ' +
      'review and act on them.',
    ]},
  ],
};

/** Google Play asks for a page that explains how to delete an account, reachable without signing in. */
export const ACCOUNT_DELETION: LegalPage = {
  key: 'delete-account',
  title: `Delete your ${NAME} account`,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro:
    `You can delete your ${NAME} account and the data that comes with it at any time. ${NAME} is ` +
    `operated by ${ENTITY}.`,
  sections: [
    { h: 'In the app', p: [
      'Open Me, tap the gear for Settings, choose Data & Account, then Delete my account and ' +
      'confirm.',
    ]},
    { h: 'On the website', p: [
      'Sign in, open Settings, choose Data & Account, then Delete my account and confirm.',
    ]},
    { h: 'If you cannot sign in', p: [
      `Email ${CONTACT} from the address on your account with the subject "Delete my account." We ` +
      'confirm by email and complete the deletion within 30 days.',
    ]},
    { h: 'What is deleted', p: [
      'Your profile, photos, preferences, posts and comments, introduction requests, conversations, ' +
      'and your login are permanently deleted, and other members can no longer see you. We keep only ' +
      'what the law requires, such as records needed to handle a safety report.',
    ]},
  ],
};

/** The support page both stores ask for, with published contact details. */
export const SUPPORT: LegalPage = {
  key: 'support',
  title: 'Support',
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  intro: `Questions about ${NAME}, your application, or your account? We are here to help.`,
  sections: [
    { h: 'Contact us', p: [
      `Email ${CONTACT} and include the email address on your account or application. We aim to ` +
      'reply within two business days.',
    ]},
    { h: 'Safety', p: [
      'To report a member, post, comment, or conversation, use Report in the app; we review every ' +
      'report within 24 hours. You can block anyone from their profile or a conversation. If you are ' +
      'in danger, call 911.',
      `For anything involving a minor, see our Child Safety Standards or write to ${CHILD_SAFETY_CONTACT}.`,
    ]},
    { h: 'Your account and data', p: [
      'You can delete your account at any time from Settings > Data & Account in the app or on our ' +
      `website. For a copy of your data or any privacy question, write to ${CONTACT}.`,
    ]},
    { h: 'Who we are', p: [
      `${NAME} is operated by ${ENTITY} and is available to members in ${BRAND.market}.`,
    ]},
  ],
};

export const DOCUMENTS: Record<'privacy' | 'terms', LegalDocument> = { privacy: PRIVACY, terms: TERMS };

/** Every public page, by URL slug. */
export const LEGAL_PAGES: Record<LegalPageKey, LegalPage> = {
  privacy: PRIVACY,
  terms: TERMS,
  'child-safety': CHILD_SAFETY,
  'delete-account': ACCOUNT_DELETION,
  support: SUPPORT,
};

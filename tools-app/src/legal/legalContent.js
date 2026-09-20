/**
 * Official Corporate Legal Content for Cerilas Tools (tools.cerilas.com)
 * 
 * Company Details:
 * Official Legal Name: CERİLAS Yüksek Teknoloji San. ve Tic. AŞ
 * Tax ID (VKN): 2061561435
 * Legal Affairs: law@cerilas.com
 * Address: Gaziantep, Türkiye
 * Website: https://tools.cerilas.com / https://cerilas.com
 */

export const COMPANY_INFO = {
  legalName: 'CERİLAS Yüksek Teknoloji San. ve Tic. AŞ',
  shortName: 'Cerilas',
  brandName: "Cerilas' Tools",
  vkn: '2061561435',
  legalEmail: 'law@cerilas.com',
  supportEmail: 'support@cerilas.com',
  address: 'Gaziantep, Türkiye',
  jurisdiction: 'Gaziantep Courts and Enforcement Offices, Republic of Türkiye',
  domain: 'https://tools.cerilas.com',
  lastUpdated: 'September 2026'
};

export const LEGAL_DOCS = {
  terms: {
    slug: 'terms',
    title: 'Terms of Service & Subscription Agreement',
    titleTr: 'Kullanım Koşulları ve Abonelik Sözleşmesi',
    subtitle: 'General Terms of Service, Commercial Usage, and Pro Subscription Policies',
    seoTitle: 'Terms of Service & Subscription Agreement | Cerilas Tools',
    seoDescription: 'Read the Terms of Service and Subscription Agreement for Cerilas Tools operated by CERİLAS Yüksek Teknoloji San. ve Tic. AŞ (VKN: 2061561435).',
    sections: [
      {
        id: 'acceptance',
        heading: '1. Acceptance of Terms & Legal Entity',
        headingTr: '1. Koşulların Kabulü ve Resmi Şirket Bilgileri',
        body: `These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and CERİLAS Yüksek Teknoloji San. ve Tic. AŞ ("Cerilas", "Company", "we", "us", or "our"), registered in Gaziantep, Türkiye under Tax Identification Number (VKN) 2061561435.

By accessing, visiting, or utilizing the web applications, micro-tools, software utilities, or subscription services available at tools.cerilas.com and associated subdomains (collectively, the "Platform"), you acknowledge that you have read, understood, and agreed to be bound by these Terms, as well as our Privacy Policy, Refund Policy, and Cookie Policy. If you do not agree with any provision of these Terms, you must discontinue your use of the Platform immediately.`
      },
      {
        id: 'services',
        heading: '2. Description of Services & Local Architecture',
        headingTr: '2. Hizmetlerin Tanımı ve İstemci Tabanlı Mimari',
        body: `Cerilas Tools provides a state-of-the-art suite of in-browser productivity, developer, AI-assisted, research, and document processing utilities.

Client-Side Execution Guarantee: Unless explicitly stated otherwise (such as for cloud AI inference, webhook relay testing, or grant database queries), the core document and file utilities (including PDF editor, PDF merger, PDF compressor, image compressor, video compressor, and local calculators) execute 100% locally within your client browser using WebAssembly (WASM), WebGPU, and HTML5 Canvas sandbox memory. Your sensitive files and private inputs are not uploaded, copied, or stored on our servers during standard client-side operations.`
      },
      {
        id: 'subscriptions',
        heading: '3. Paid Subscriptions, Pro Tiers & Billing Terms',
        headingTr: '3. Ücretli Abonelikler, Pro Paketler ve Ödeme Koşulları',
        body: `While Cerilas provides a comprehensive catalog of free tools, certain advanced features, higher compute capacities, API integrations, and extended AI processing limits may be offered under paid subscription plans ("Pro", "Premium", or "Enterprise Plans"):

• Billing Cycles: Subscriptions are billed in advance on a recurring monthly or annual basis depending on the plan selected at checkout.
• Payment Processing: All payment transactions are handled through certified, PCI-DSS compliant third-party payment service providers (e.g., Stripe, Iyzico). Cerilas does not collect, record, or retain full credit card or debit card numbers on its servers.
• Automatic Renewal: Your subscription will automatically renew at the end of each billing cycle at the then-current plan price, unless you cancel auto-renewal prior to the renewal date via your account settings or by notifying us at law@cerilas.com.
• Price Adjustments: Cerilas reserves the right to modify subscription pricing with at least thirty (30) days prior electronic notice. Continued use of the service following the effective date of the price adjustment constitutes acceptance of the modified fee.
• Taxes: Fees are exclusive of applicable value-added taxes (KDV/VAT) or statutory digital service levies, which will be calculated and displayed during checkout in accordance with applicable tax regulations.`
      },
      {
        id: 'fair-use',
        heading: '4. Fair Use, AI Quotas & Prohibited Activities',
        headingTr: '4. Adil Kullanım, Yapay Zeka Kotaları ve Yasaklanan Faaliyetler',
        body: `To preserve platform stability, prevent infrastructure abuse, and guarantee equitable access for all users, the following rules apply:

• AI Compute Limits: Cloud AI inference features (e.g., ATS resume matching, AI content detection, universal token calculations) may be subject to hourly or monthly rate limits depending on your subscription tier. Automated scripts designed to circumvent these quotas are strictly prohibited.
• Prohibited Conduct: You agree not to:
  a) Reverse engineer, decompile, or disassemble any proprietary source code or compiled WebAssembly modules of the Platform;
  b) Use automated scraping bots, headless scrapers, or crawlers that generate disproportionate server load or bypass security controls;
  c) Transmit viruses, worms, Trojan horses, or malicious payloads through input upload forms or webhook testing endpoints;
  d) Use the Platform for any unlawful, fraudulent, defamatory, or abusive purposes in violation of Turkish laws or applicable international statutes;
  e) Resell, sub-license, or redistribute Cerilas Tools services as a competing stand-alone commercial utility without prior written licensing agreements.`
      },
      {
        id: 'intellectual-property',
        heading: '5. Intellectual Property & User File Ownership',
        headingTr: '5. Fikri Mülkiyet ve Kullanıcı Dosyalarının Mülkiyeti',
        body: `• Cerilas Intellectual Property: The visual design, trademarks, software code, user interface, brand assets, logos, and algorithms of Cerilas Tools are the exclusive intellectual property of CERİLAS Yüksek Teknoloji San. ve Tic. AŞ and are protected under Turkish Intellectual Property Law (Fikir ve Sanat Eserleri Kanunu) and international copyright conventions.
• User File Ownership: You retain 100% of your intellectual property rights, copyright, and ownership in and to all documents, images, code snippets, and data that you process using the Platform. Cerilas claims zero ownership or licensing rights over your private files.`
      },
      {
        id: 'disclaimer',
        heading: '6. Disclaimer of Warranties',
        headingTr: '6. Garanti Reddi',
        body: `The Platform and all associated tools, calculators, templates, and grant databases are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, statutory, or implied.

While we strive for high precision and peer-reviewed mathematical rigor:
• Statistical and financial calculators (e.g., Sample Size, MRR, ARR, Startup Runway, LTV, CAC) are provided for operational guidance and simulation purposes only and do not constitute certified legal, financial, or tax advice.
• Horizon Europe and Cascade Funding grant listings are sourced from public directories; applicants must verify final call deadlines and legal eligibility criteria on the official European Commission portals.
• Cerilas does not warrant that the Platform will be uninterrupted, error-free, completely bug-free, or compatible with every browser configuration.`
      },
      {
        id: 'limitation-liability',
        heading: '7. Limitation of Liability',
        headingTr: '7. Sorumluluğun Sınırlandırılması',
        body: `To the maximum extent permitted under applicable law, in no event shall CERİLAS Yüksek Teknoloji San. ve Tic. AŞ, its directors, officers, employees, or affiliates be liable for any indirect, incidental, punitive, special, or consequential damages (including loss of profits, data loss, business interruption, or computational errors) arising out of or in connection with your use or inability to use the Platform.

In all events, Cerilas' aggregate liability arising under these Terms shall be strictly capped at the total amount actually paid by you to Cerilas in the twelve (12) months preceding the incident giving rise to liability, or fifty US Dollars ($50.00 USD), whichever is greater.`
      },
      {
        id: 'governing-law',
        heading: '8. Governing Law & Dispute Resolution',
        headingTr: '8. Uygulanacak Hukuk ve Yetkili Mahkeme',
        body: `These Terms and any dispute or claim arising out of or related to their subject matter shall be governed by, construed, and enforced in accordance with the substantive laws of the Republic of Türkiye, without regard to conflict of law principles.

Any dispute, controversy, or claim arising out of or in connection with these Terms, including disputes regarding validity, breach, or termination, shall be submitted to the exclusive jurisdiction of the Courts and Enforcement Offices of Gaziantep, Türkiye (Gaziantep Mahkemeleri ve İcra Daireleri).`
      }
    ]
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy & KVKK / GDPR Compliance',
    titleTr: 'Gizlilik Politikası ve KVKK / GDPR Aydınlatma Metni',
    subtitle: 'Data Controller Information, In-Browser Processing Principles, and Data Subject Rights',
    seoTitle: 'Privacy Policy & KVKK / GDPR Compliance | Cerilas Tools',
    seoDescription: 'Review the comprehensive Privacy Policy and KVKK/GDPR data protection principles of Cerilas Tools (CERİLAS Yüksek Teknoloji San. ve Tic. AŞ, VKN: 2061561435).',
    sections: [
      {
        id: 'controller',
        heading: '1. Data Controller Identification (KVKK & GDPR)',
        headingTr: '1. Veri Sorumlusunun Kimliği',
        body: `Pursuant to the Turkish Law on the Protection of Personal Data No. 6698 ("KVKK") and the General Data Protection Regulation ("GDPR") of the European Union, the Data Controller responsible for your personal data is:

Company: CERİLAS Yüksek Teknoloji San. ve Tic. AŞ
Tax Identification Number (VKN): 2061561435
Headquarters: Gaziantep, Türkiye
Legal & Privacy Inquiries: law@cerilas.com
Corporate Website: https://cerilas.com`
      },
      {
        id: 'architecture',
        heading: '2. In-Browser Local Processing Architecture',
        headingTr: '2. Tarayıcı İçi Yerel İşleme Mimarisi',
        body: `The defining architectural principle of Cerilas Tools is Client-Side Privacy:

• Zero Server Document Uploads: When you compress an image, merge PDF documents, split PDF pages, edit PDF text, remove backgrounds, or calculate mathematical models, the raw binary files are loaded into your device's random-access memory (RAM) and processed entirely via client-side WebAssembly and HTML5 Canvas.
• Temporary Memory Lifecycle: The moment you close the browser tab or refresh the page, the memory allocations are immediately freed by your browser engine. Cerilas does not inspect, copy, intercept, or transmit the contents of your processed files to external servers.`
      },
      {
        id: 'data-collected',
        heading: '3. Categories of Data Collected',
        headingTr: '3. Toplanan Kişisel Veri Kategorileri',
        body: `We only collect and process personal data when strictly necessary to deliver, bill, and protect our services:

a) Account & Identity Information (For Registered / Pro Users):
• Email address, full name, company name (if applicable), and encrypted password hashes.
b) Billing & Transactional Information (For Paid Tiers):
• Order history, subscription tier, billing address, tax identification number, and masked card identifiers (last 4 digits). Note: Full credit card numbers, CVVs, and banking credentials are processed directly by certified payment processors (e.g. Stripe, Iyzico) and never touch our servers.
c) Technical & Usage Telemetry:
• Client IP address, browser type, operating system, timestamp of requests, and anonymous telemetry required to distinguish human visitors from automated malicious scrapers (bot vs human detection).
d) Customer Support Communications:
• Information submitted when emailing law@cerilas.com or support@cerilas.com regarding inquiries, refunds, or technical support.`
      },
      {
        id: 'legal-basis',
        heading: '4. Legal Bases for Processing (KVKK Art. 5 & GDPR Art. 6)',
        headingTr: '4. Kişisel Veri İşleme Şartları ve Hukuki Sebepler',
        body: `Your personal data is processed under the following lawful bases:
• Performance of a Contract (KVKK Art. 5/2-c, GDPR Art. 6/1-b): Fulfilling subscription orders, delivering account management, and providing user support.
• Compliance with Legal Obligations (KVKK Art. 5/2-ç, GDPR Art. 6/1-c): Retaining accounting, financial transaction records, and tax documentation in compliance with Turkish Tax Procedure Law and relevant commercial codes.
• Legitimate Interests (KVKK Art. 5/2-f, GDPR Art. 6/1-f): Ensuring cybersecurity, preventing payment fraud, distinguishing web bots from legitimate traffic, and maintaining platform uptime.
• Explicit Consent (KVKK Art. 5/1, GDPR Art. 6/1-a): Where specifically requested, such as for voluntary newsletter communications.`
      },
      {
        id: 'data-sharing',
        heading: '5. Third-Party Data Transfers & Infrastructure',
        headingTr: '5. Veri Aktarımı ve Altyapı Paydaşları',
        body: `Cerilas does not sell, rent, or monetize your personal data. Data is shared exclusively with necessary infrastructure and operational vendors under strict data processing agreements:
• Cloud Infrastructure: PostgreSQL and server instances deployed on secure, ISO 27001-certified cloud infrastructure.
• Payment Gateways: Certified PCI-DSS Level 1 compliant processors for recurring billing and subscription invoicing.
• Statutory Authorities: Competent judicial, regulatory, or tax authorities when mandated by Turkish court orders or statutory reporting laws.`
      },
      {
        id: 'data-subject-rights',
        heading: '6. Your Rights under KVKK Art. 11 & GDPR',
        headingTr: '6. İlgili Kişi Olarak Haklarınız (KVKK Madde 11)',
        body: `Under Article 11 of the KVKK and Chapter III of GDPR, you hold the legal right to:
1. Learn whether your personal data is processed;
2. Request information regarding the processing of your data;
3. Learn the purpose of data processing and whether it is used in line with that purpose;
4. Know the domestic or foreign third parties to whom your data has been transferred;
5. Request rectification of incomplete or inaccurate personal data;
6. Request the deletion or destruction of your personal data pursuant to statutory retention guidelines;
7. Object to the occurrence of any adverse result against you resulting solely from automated analysis systems;
8. Claim compensation for damages incurred as a consequence of unlawful data processing.

To exercise any of these rights, submit a written inquiry specifying your request to law@cerilas.com.`
      }
    ]
  },

  refund: {
    slug: 'refund',
    title: 'Refund & Cancellation Policy',
    titleTr: 'Geri Ödeme ve İptal Politikası',
    subtitle: '14-Day Statutory Withdrawal Rights, Subscription Cancellation, and Refund Guidelines',
    seoTitle: 'Refund & Cancellation Policy | Cerilas Tools',
    seoDescription: 'Review the official Refund and Cancellation Policy for Cerilas Tools subscriptions under Turkish Law No. 6502 and international digital consumer standards.',
    sections: [
      {
        id: 'overview',
        heading: '1. Overview & Regulatory Framework',
        headingTr: '1. Genel Hükümler ve Yasal Dayanak',
        body: `This Refund & Cancellation Policy ("Policy") governs all financial transactions, pro subscriptions, recurring memberships, and credit packages purchased through tools.cerilas.com, operated by CERİLAS Yüksek Teknoloji San. ve Tic. AŞ (VKN: 2061561435).

Our policies are formulated in strict adherence to Turkish Law No. 6502 on Consumer Protection (Tüketicinin Korunması Hakkında Kanun), the Distance Contracts Regulation (Mesafeli Sözleşmeler Yönetmeliği), and international standards for digital software-as-a-service (SaaS) products.`
      },
      {
        id: 'statutory-withdrawal',
        heading: '2. Right of Withdrawal (Cayma Hakkı) & Digital Services',
        headingTr: '2. Cayma Hakkı ve Dijital Hizmet İstisnaları',
        body: `Under the Distance Contracts Regulation, consumers typically enjoy a 14-day statutory right of withdrawal without giving any reason:

• Digital SaaS Subscriptions: For recurring software memberships, if you purchase a paid Pro plan and have not extensively consumed dedicated premium cloud resources (such as bulk AI scans or high-volume API quotas), you may exercise your right of withdrawal within fourteen (14) calendar days of initial purchase to receive a full refund.
• Instant Delivery Statutory Exception: Pursuant to Article 15/1-ğ of the Distance Contracts Regulation, the right of withdrawal does not apply to contracts relating to services performed instantly in electronic environment or intangible goods delivered immediately to the consumer once execution has commenced with the consumer's prior express consent. Therefore, if a user consumes the bulk of their monthly AI tokens or export quotas immediately following purchase, that subscription cycle is considered fulfilled and non-refundable.`
      },
      {
        id: 'cancellation',
        heading: '3. Subscription Cancellation Procedure',
        headingTr: '3. Abonelik İptali Prosedürü',
        body: `• Seamless Self-Service Cancellation: You can cancel your recurring Pro subscription at any time with zero penalty fees directly through your account dashboard or by submitting an email to law@cerilas.com with your account email and subscription ID.
• End-of-Cycle Access: Upon cancellation, auto-renewal will be disabled immediately. You will retain full access to all paid features until the conclusion of your current paid billing period.
• No Post-Renewal Charges: Once cancelled, you will never be billed for subsequent billing cycles.`
      },
      {
        id: 'eligibility',
        heading: '4. Refund Eligibility Scenarios',
        headingTr: '4. İadeye Uygunluk Halleri',
        body: `Cerilas evaluates refund requests under the following fair guidelines:

Eligible for Refund:
• Duplicate Billing: In the event of a technical payment gateway anomaly resulting in double-charging or erroneous duplicate invoices.
• Major Service Outage: In the unlikely event that the core Platform suffers an unscheduled prolonged outage exceeding 72 consecutive hours that prevents you from accessing your paid features.
• First-Time 14-Day Window: A new subscriber who cancels within 14 days of their initial transaction and has not excessively utilized premium server computation quotas.

Non-Refundable Circumstances:
• Change of mind after the 14-day window has elapsed.
• Failure to cancel auto-renewal before the renewal date, where access has already been granted for the new cycle.
• Accounts terminated due to verified violations of our Terms of Service (e.g., automated scraping, abuse of platform limits, reverse engineering).`
      },
      {
        id: 'process',
        heading: '5. How to Request a Refund',
        headingTr: '5. İade Başvurusu Nasıl Yapılır?',
        body: `To initiate a refund request, submit an email to law@cerilas.com with the following details:
1. Subject line: "Refund Request - [Your Registered Email Address]"
2. Date of transaction and invoice / order number.
3. Reason for the refund request.

Our legal and billing department reviews requests within three (3) business days. Approved refunds are credited back to the original payment method (credit/debit card) within 5 to 10 business days, depending on your financial institution's processing timelines.`
      }
    ]
  },

  cookies: {
    slug: 'cookies',
    title: 'Cookie & Tracking Technology Policy',
    titleTr: 'Çerez ve İzleme Teknolojileri Politikası',
    subtitle: 'Transparent Disclosure on Essential Cookies, Local Storage, and Analytics',
    seoTitle: 'Cookie & Tracking Technology Policy | Cerilas Tools',
    seoDescription: 'Understand how Cerilas Tools uses essential cookies, local storage, and privacy-preserving analytics without third-party ad tracking.',
    sections: [
      {
        id: 'what-are-cookies',
        heading: '1. What Are Cookies & Local Storage?',
        headingTr: '1. Çerezler ve Yerel Depolama Nedir?',
        body: `Cookies are small text files placed on your browser or device when visiting websites. Local Storage is an industry-standard browser storage mechanism that allows web applications to store key-value data directly on your device without transmitting it to remote servers on every HTTP request.

Cerilas Tools adheres to a strict privacy-first principle: we do not use third-party invasive advertising cookies or cross-site tracking pixels.`
      },
      {
        id: 'categories',
        heading: '2. Categories of Cookies We Use',
        headingTr: '2. Kullandığımız Çerez Kategorileri',
        body: `a) Strictly Necessary / Essential Cookies & Local Storage:
• Theme Preference: Storing your selected dark or light mode preference in localStorage (cerilas_theme) to prevent screen flickering upon page loads.
• Security & Session Token: Retaining authenticated admin session state and CSRF tokens where applicable.
• Tool State: Preserving draft calculation parameters (such as your current Sample Size variables or Pomodoro timer intervals) locally on your device.

b) Anonymous Analytics & Traffic Quality:
• Anonymous Visitor ID: A randomized UUID stored in local cookies to track unique human visitors versus automated web scrapers and crawlers. This metric helps us provide transparent, tamper-proof usage metrics.
• Google Analytics 4 (GA4): Anonymized IP tracking to monitor aggregate page views, platform reliability, and browser compatibility.`
      },
      {
        id: 'management',
        heading: '3. Managing & Disabling Cookies',
        headingTr: '3. Çerezleri Yönetme ve Devre Dışı Bırakma',
        body: `You maintain complete control over cookies through your web browser settings. You can choose to block, delete, or receive alerts before cookies are stored.

Please note that because Cerilas Tools relies on modern local browser technologies (WebAssembly and localStorage), disabling localStorage may reset your custom theme and preferences upon every reload.`
      }
    ]
  }
};

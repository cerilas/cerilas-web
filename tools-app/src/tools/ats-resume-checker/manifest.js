export const atsResumeCheckerManifest = {
  slug: 'ats-resume-checker',
  title: 'ATS Resume Checker',
  shortDescription: 'Upload your CV/Resume (PDF) to test bot readability, detect missing keywords, and get AI ATS match scores against any job description.',
  category: 'Career & HR',
  iconName: 'FileCheck',
  badge: 'AI Assisted',
  isAi: true,
  targetUrl: '#/tool/ats-resume-checker',
  seoTitle: 'Free AI ATS Resume Checker (2026) – Test CV Bot Readability & Job Match | Cerilas Tools',
  seoDescription: '100% free AI ATS resume checker & PDF bot scanner. Upload your CV to inspect machine readability, calculate job description match percentage, and discover missing keywords without server uploads.',
  features: [
    '100% In-Browser PDF Parsing: Upload your resume PDF with zero server storage and instant bot readability check',
    '"What Bots See" Inspector: Verify your contact info, headings, and text extract correctly without parsing traps',
    'AI-Powered Job Match Scoring: Deep semantic comparison with target job requirements using Google Gemini',
    'Missing Keywords Detection: Uncover critical hard & soft skills missing from your CV',
    'ATS Structural Audit: Flag tables, multi-column layouts, and formatting pitfalls'
  ],
  seo: {
    title: "Free ATS Resume Checker & Job Match AI Score | Cerilas Tools",
    description: "Scan your resume against any job description with AI. Get an instant ATS compatibility score (0-100), missing keywords, formatting audit, and bullet tips.",
    keywords: "ats resume checker, resume score ai, job match calculator, applicant tracking system test, cv keyword checker, ats resume scanner, free resume review",
    ogImage: 'https://tools.cerilas.com/tool-icons/ats-resume-checker.webp',
    ogImageAlt: "Free ATS Resume Checker & Job Match AI Score | Cerilas Tools",
    breadcrumbsName: "ATS Resume Checker",
    faq: [
        {
            "q": "What is an Applicant Tracking System (ATS) and how does it screen resumes?",
            "a": "An ATS is corporate software that scans resumes for required keywords, job titles, and hard skills before human recruiters ever see them, automatically discarding unaligned CVs."
        },
        {
            "q": "Is my CV or contact information saved or sold to recruiters?",
            "a": "No. Your resume is analyzed in memory for scoring and recommendations, then immediately cleared. We never store, sell, or index your personal details."
        },
        {
            "q": "What formatting mistakes cause ATS parsers to fail?",
            "a": "Multi-column tables, graphics, text inside images, unconventional headers, and headers/footers often get jumbled or ignored by older ATS parsers."
        },
        {
            "q": "How can I increase my resume match score to 85%+?",
            "a": "Incorporate the missing hard skills and certifications highlighted in our report into your bullet points, demonstrating quantifiable results with active verbs."
        }
    ]
  }
};

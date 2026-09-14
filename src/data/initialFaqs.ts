import { FaqCreateInput } from '@/types/faq';

export const INITIAL_FAQS: FaqCreateInput[] = [
  // Billing & Subscriptions
  {
    question: "What are your subscription pricing plans?",
    answer: "We offer three plans: Starter ($19/month for individuals), Pro ($49/month with advanced features and vector search), and Enterprise (custom pricing for high-volume needs, dedicated support, and custom SLA).",
    category: "Billing & Subscriptions",
    tags: ["pricing", "cost", "plans", "starter", "pro", "enterprise", "subscription"],
  },
  {
    question: "What is your refund and cancellation policy?",
    answer: "You can cancel your subscription at any time from your Account Settings. We offer a full 14-day money-back guarantee for all new subscriptions if you are not satisfied with the service.",
    category: "Billing & Subscriptions",
    tags: ["refund", "money back", "cancel", "guarantee", "return money", "policy"],
  },
  {
    question: "Which payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. Enterprise customers can also pay via wire transfer and annual invoice.",
    category: "Billing & Subscriptions",
    tags: ["payment", "credit card", "visa", "mastercard", "paypal", "invoice", "wire transfer"],
  },
  {
    question: "How can I download past invoices or receipts?",
    answer: "To download past invoices, navigate to Settings > Billing & Usage > Invoices. You will see a chronological list of all charges with PDF download links.",
    category: "Billing & Subscriptions",
    tags: ["invoice", "receipt", "pdf", "billing history", "tax", "vat"],
  },
  {
    question: "Do you offer discounts for students or non-profit organizations?",
    answer: "Yes! We offer a 50% discount for accredited educational institutions, students, and registered 50% non-profit organizations. Please contact support with proof of eligibility.",
    category: "Billing & Subscriptions",
    tags: ["discount", "student", "education", "non-profit", "charity", "coupon"],
  },

  // Account & Security
  {
    question: "How do I reset my account password?",
    answer: "Click 'Forgot Password' on the login screen, enter your registered email address, and you will receive a secure one-time password reset link valid for 30 minutes.",
    category: "Account & Security",
    tags: ["password", "reset", "forgot password", "credentials", "login help"],
  },
  {
    question: "How do I enable Two-Factor Authentication (2FA)?",
    answer: "Go to Account Settings > Security > Two-Factor Authentication. Click 'Enable 2FA' and scan the QR code with your authenticator app (Google Authenticator, Authy, or 1Password).",
    category: "Account & Security",
    tags: ["2fa", "mfa", "two factor", "security", "authenticator", "otp"],
  },
  {
    question: "How can I invite team members to my organization workspace?",
    answer: "Team admins can go to Organization Settings > Members, click 'Invite Member', enter the colleague's email address, and select their role (Admin, Member, or Viewer).",
    category: "Account & Security",
    tags: ["invite", "team", "members", "collaboration", "organization", "roles"],
  },
  {
    question: "Where is user data hosted and how is it secured?",
    answer: "All user data is encrypted at rest using AES-256 and in transit via TLS 1.3. Our databases are hosted in SOC 2 Type II and ISO 27001 certified AWS and Supabase data centers.",
    category: "Account & Security",
    tags: ["security", "encryption", "hosting", "data privacy", "gdpr", "compliance", "soc2"],
  },
  {
    question: "How do I delete my account permanently?",
    answer: "To delete your account and all associated data, visit Settings > Danger Zone > Delete Account. This action is irreversible and purges all knowledge base records after 7 days.",
    category: "Account & Security",
    tags: ["delete account", "remove data", "close account", "gdpr right to erasure", "danger zone"],
  },

  // Technical Support
  {
    question: "What browsers are supported?",
    answer: "Our web application supports all modern Evergreen browsers: Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari (desktop and mobile versions).",
    category: "Technical Support",
    tags: ["browser", "chrome", "firefox", "safari", "edge", "compatibility"],
  },
  {
    question: "Why am I seeing a 'Network Connection Lost' error?",
    answer: "This error usually occurs when your internet connection drops or a corporate VPN/firewall blocks WebSocket connections. Try disabling ad blockers or whitelist our domain.",
    category: "Technical Support",
    tags: ["network error", "connection lost", "offline", "websocket", "vpn", "firewall"],
  },
  {
    question: "What are the recommended file formats for bulk FAQ imports?",
    answer: "You can import FAQs in JSON, CSV, or Markdown format. The file must include columns or keys for 'question', 'answer', and optionally 'category' and 'tags'.",
    category: "Technical Support",
    tags: ["import", "csv", "json", "bulk upload", "file format", "export"],
  },
  {
    question: "What is your system uptime and service level agreement (SLA)?",
    answer: "We maintain a 99.9% uptime SLA for all paid customers. You can check real-time system status and past incident history at our public status page.",
    category: "Technical Support",
    tags: ["uptime", "sla", "reliability", "status page", "downtime", "maintenance"],
  },
  {
    question: "How does vector search / semantic search work in this system?",
    answer: "When an FAQ is created, Google Gemini's text-embedding-004 model converts the text into a 768-dimensional numerical vector. When you ask a question, your query is also embedded, and Supabase's pgvector performs cosine distance similarity to find the most conceptually relevant FAQs, even if they use completely different keywords.",
    category: "Technical Support",
    tags: ["vector search", "pgvector", "embeddings", "semantic search", "gemini", "how it works"],
  },

  // API & Integrations
  {
    question: "How do I generate an API key for programmatic access?",
    answer: "Navigate to Developer Settings > API Keys and click 'Generate New Secret Key'. Make sure to copy the key immediately as it will only be displayed once for security reasons.",
    category: "API & Integrations",
    tags: ["api key", "tokens", "developer", "secret key", "rest api"],
  },
  {
    question: "What are the API rate limits?",
    answer: "Standard API rate limits are 60 requests per minute for Starter, 300 requests per minute for Pro, and customizable rate limits with dedicated burst capacity for Enterprise tiers.",
    category: "API & Integrations",
    tags: ["rate limits", "throttle", "requests per minute", "429", "quota"],
  },
  {
    question: "Can I connect the FAQ knowledge base to Slack or Microsoft Teams?",
    answer: "Yes, our webhooks and Slack/Teams integrations allow bots to answer employee or customer questions directly within channels using the FAQ knowledge base.",
    category: "API & Integrations",
    tags: ["slack", "teams", "bot", "webhook", "integration", "messaging"],
  },
  {
    question: "Is there a webhook for FAQ update notifications?",
    answer: "Yes, you can configure webhooks in Developer Settings to receive real-time POST payloads whenever an FAQ is created, updated, or re-indexed.",
    category: "API & Integrations",
    tags: ["webhooks", "callbacks", "events", "notifications", "sync"],
  },

  // General
  {
    question: "What is the primary goal of this FAQ AI system?",
    answer: "The system is designed as an intelligent knowledge base that indexes company or product FAQs with vector embeddings and uses Google Gemini to answer customer questions accurately, grounded only in verified company knowledge to prevent hallucinations.",
    category: "General",
    tags: ["overview", "purpose", "ai assistant", "grounding", "anti hallucination"],
  },
  {
    question: "How can I contact human customer support?",
    answer: "You can reach our dedicated human support team 24/7 by emailing support@example.com or opening a live chat ticket from the help widget located at the bottom-right of your screen.",
    category: "General",
    tags: ["support", "help", "contact", "agent", "human", "ticket", "email"],
  },
  {
    question: "In what languages is customer support and AI answering available?",
    answer: "Our AI assistant natively supports over 50 languages including English, Arabic, Spanish, French, German, and Chinese. It automatically detects the language of your question and responds in the same language.",
    category: "General",
    tags: ["languages", "arabic", "multilingual", "translation", "english"],
  },
];

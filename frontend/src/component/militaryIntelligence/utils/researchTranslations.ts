import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ResearchLanguage = 'en' | 'cs';

export interface Translations {
    // Welcome and Search
    welcomeTitle: string;
    welcomeSubtitle: string;
    searchPlaceholder: string;
    chooseTemplate: string;
    
    // Custom Template
    customTemplateName: string;
    customTemplateDesc: string;
    createCustomTemplate: string;
    templateName: string;
    templateNameRequired: string;
    
    // Search and Navigation
    completeSearch: string;
    backToDetails: string;
    personalizeWithAI: string;
    personalizing: string;
    
    // Basic Fields
    name: string;
    company: string;
    website: string;
    notDetected: string;
    lookingFor: string;
    popular: string;
    emailContent: string;
    
    // Company Context
    companyContextTitle: string;
    companyContextSubtitle: string;
    stepProgress: string;
    companyContextQuestion: string;
    characters: string;
    companyContextPlaceholder: string;
    startTypingPrompt: string;
    companyContextError: string;
    companyContextHint: string;
    
    // Navigation
    back: string;
    next: string;
    
    // Save Features
    saveTemplatesTitle: string;
    saveTemplatesSubtitle: string;
    saveTemplatesFeature: string;
    saveContextTitle: string;
    saveContextSubtitle: string;
    saveContextFeature: string;
    saveAIPersonalizationTitle: string;
    saveAIPersonalizationSubtitle: string;
    saveAIPersonalizationFeature: string;
    
    // Errors and Status
    errorFetchingContext: string;
    errorSavingContext: string;
    errorSavingTemplate: string;
    failedToCopy: string;
    
    // Personalization
    personalizingTemplate: string;
    personalizingDescription: string;
    personalizationError: string;
    
    // Preview and Feedback
    copy: string;
    copied: string;
    wasThisHelpful: string;
    sendDetailedFeedback: string;
    aiSuggestions: string;
    currentText: string;
    suggestion: string;
    applyChange: string;
    
    // AI Suggestions Counter
    suggestionsCount: string;
  
    // Template Section
    recommendedTemplates: string;
    myTemplates: string;
    incompleteFieldsTitle: string;
    incompleteFieldsDesc: string;
    createdOn: string;
    templateDeleteSuccess: string;
    templateDeleteError: string;

    // Research Section - Main
    titlePrefix: string;
    titleZarathustra: string;
    subtitle: string;
    aboutCompanyTitle: string;
    aboutCompanySubtitle: string;
    aboutCompanyPlaceholder: string;
    researchButton: string;
    researchingButton: string;
    startNewResearch: string;

    // Research Results UI
    companyOverview: string;
    valueProposition: string;
    whatTheyDo: string;
    companyInsights: string;
    
    // Research Tabs & Sections
    overview: string;
    outreach: string;
    audience: string;
    products: string;
    market: string;
    tech: string;
    
    // Research Content Sections
    painPointsTitle: string;
    targetAudienceTitle: string;
    recentDevelopmentsTitle: string;
    engagementHooksTitle: string;
    personalizationAnglesTitle: string;
    productsServicesTitle: string;
    technologicalStackTitle: string;
    geographicFocusTitle: string;
    businessDetailsTitle: string;
    businessModelTitle: string;
    companySizeTitle: string;
    pricingStrategyTitle: string;
    competitiveAdvantagesTitle: string;
    growthIndicatorsTitle: string;
    marketChallengesTitle: string;
    industryInsightsTitle: string;
    engagementTitle: string;
    engagementDescription: string;
    
    // New Sections for Redesign
    keyInsights: string;
    keyInsightsDescription: string;
    bookmarkedInsights: string;
    searchWithinResults: string;
    filters: string;
    filterByConfidence: string;
    newSearch: string;
    export: string;
    exportText: string;
    exportEmail: string;
    feedbackTitle: string;
    feedbackPrompt: string;
    helpful: string;
    notHelpful: string;
    provideFeedback: string;
    
    // Messages & Explanations
    noTechnologiesFound: string;
    noGeographicFocusFound: string;
    noCompetitiveAdvantagesFound: string;
    noGrowthIndicatorsFound: string;
    noMarketChallengesFound: string;
    noDataFound: string;
    noDataExplanation: string;
    noPersonalizationAnglesFound: string;
    noProductsFound: string;
    noProductsExplanation: string;
    noCompanyInfoFound: string;
    noCompanyInfoExplanation: string;
    growthStage: string;
    
    // Confidence Levels
    highConfidence: string;
    mediumConfidence: string;
    lowConfidence: string;
    aiGenerated: string;
    aiEnhanced: string;
    
    // Actions & UI 
    wasHelpful: string;
    sendFeedback: string;
    getUnlimited: string;
    createAccount: string;
    advancedInsights: string;
    signIn: string;
    signOut: string;
    researched: string;
    visitWebsite: string;
    theWebsite: string;
    didYouKnow: string;
    generateEmailDraft: string;
    contentExtracted: string;
    limitedData: string;
    
    // Copy Actions
    copyAllCompanyDetails: string;
    copyAllProducts: string;
    copyAllInsights: string;
    copyAllAdvantages: string;
    copyAllGrowthIndicators: string;
    copyAllChallenges: string;
    
    // Research Progress Steps 
    scraping: string;
    scrapingDescription: string;
    analyzing: string;
    analyzingDescription: string;
    enhancing: string;
    enhancingDescription: string;
    completing: string;
    completingDescription: string;
    researchInProgress: string;
    
    // Loading Messages
    loadingMessage1_1: string;
    loadingMessage1_2: string;
    loadingMessage1_3: string;
    loadingMessage2_1: string;
    loadingMessage2_2: string;
    loadingMessage2_3: string;
    loadingMessage3_1: string;
    loadingMessage3_2: string;
    loadingMessage3_3: string;
    loadingMessage4_1: string;
    loadingMessage4_2: string;
    loadingMessage4_3: string;

    share: string;
    valuePropositionDescription: string;
    targetAudienceDescription: string;
    painPointsDescription: string;
    options: string;
    
    // Rate Limiting
    rateLimit: string;
    rateLimitMessageAuth: string;
    rateLimitMessageUnauth: string;
    resetsAt: string;
    signInForMore: string;
    tomorrow: string;
    gotIt: string;
    dailyLimit: string;
    requestsRemaining: string;
    upgradeForMore: string;
    rateLimitExceeded: string;
    noRequestsRemaining: string;
    
    // Context Options
    hideCompanyContext: string;
    addCompanyContext: string;
    contextSpecificInsights: string;
    // Errors
    urlError: string;
    emptyUrlError: string;
    [key: string]: string;
}

export const researchTranslations = {
  en: {
    titlePrefix: "Research with",
    titleZarathustra: "Zarathustra",
    subtitle: "Skip the research, keep the insights. Your AI powered sales co-pilot.",
    searchPlaceholder: "Enter company website (e.g., apple.com)",
    aboutCompanyTitle: "About your company",
    aboutCompanySubtitle: "This helps us find relevant connection points for personalization.",
    aboutCompanyPlaceholder: "Briefly describe what your company does, the value you provide, and who you serve...",
    researchButton: "Generate Company Insights",
    researchingButton: "Researching...",
    companyInsights: "Company Insights",
    startNewResearch: "Start New Research",
    whatTheyDo: "What they do:",
    valueProposition: "Value proposition",
    painPointsTitle: "Pain Points They Solve",
    targetAudienceTitle: "Target Audience",
    recentDevelopmentsTitle: "Recent Developments",
    contextSpecificInsights: "Tailored to your business context",
    engagementHooksTitle: "Engagement Hooks",
    personalizationAnglesTitle: "Personalization Angles",
    productsServicesTitle: "Products & Services",
    wasHelpful: "Was this research helpful?",
    sendFeedback: "Send detailed feedback",
    getUnlimited: "Get more company searches",
    createAccount: "Create a free account to access premium research features",
    advancedInsights: "Advanced Insights",
    copied: "Copied!",
    failedToCopy: "Failed to copy",
    urlError: "Please enter a valid website URL",
    emptyUrlError: "Please enter a company website",
    signIn: "Sign In",
    signOut: "Sign Out",
    researched: "Researched",
    copyAllCompanyDetails: "Copy all company details",
    copyAllProducts: "Copy all products",
    copyAllInsights: "Copy all insights",
    visitWebsite: "Visit website",
    contentExtracted: "Content extracted",
    limitedData: "Limited data",
    copy: "Copy",
    technologicalStackTitle: 'Technology Stack',
    noTechnologiesFound: 'No specific technologies mentioned',
    newSearch: "New Search",

    share: "Share",
    valuePropositionDescription: "The core value this company offers to its customers",
    targetAudienceDescription: "The primary groups or individuals this company serves",
    painPointsDescription: "Key customer challenges or problems this company addresses",
    options: "Options",
  
    // Geographic sections
    geographicFocusTitle: 'Geographic Focus',
    noGeographicFocusFound: 'No specific geographic focus mentioned',
  
    // Business details sections
    businessDetailsTitle: 'Business Details',
    businessModelTitle: 'Business Model',
    companySizeTitle: 'Company Size',
    pricingStrategyTitle: 'Pricing Strategy',
    
    // Enhanced UI translations
    hideCompanyContext: "Hide company context",
    addCompanyContext: "Add your company context (optional)",
    noDataFound: "No information found",
    noDataExplanation: "We couldn't find specific information for this section",
    highConfidence: "High confidence",
    mediumConfidence: "Medium confidence",
    lowConfidence: "Low confidence",
    aiGenerated: "AI generated",
    aiEnhanced: "AI enhanced",
    noPersonalizationAnglesFound: "No personalization angles found",
    industryInsightsTitle: "Industry Insights",
    noProductsFound: "No specific products found",
    noProductsExplanation: "We couldn't identify specific products from the website",
    noCompanyInfoFound: "No company information found",
    noCompanyInfoExplanation: "We couldn't extract specific information about this company",
    
    // Research progress steps
    scraping: "Scraping website",
    scrapingDescription: "Extracting content from company website",
    analyzing: "Analyzing content",
    analyzingDescription: "Identifying key business information",
    enhancing: "Enhancing insights",
    enhancingDescription: "Using AI to improve and personalize results",
    completing: "Finalizing research",
    completingDescription: "Organizing insights for your review",
    researchInProgress: "Researching Company",

    generateEmailDraft: "Generate Email Draft",
    theWebsite: "the website",

    competitiveAdvantagesTitle: 'Competitive Advantages',
    noCompetitiveAdvantagesFound: 'No specific competitive advantages found',
    growthIndicatorsTitle: 'Growth Indicators',
    noGrowthIndicatorsFound: 'No specific growth indicators found',
    marketChallengesTitle: 'Market Challenges',
    noMarketChallengesFound: 'No specific market challenges found',

    overview: "Overview",
    outreach: "Outreach",
    audience: "Audience",
    products: "Products",
    market: "Market",
    tech: "Tech",

    growthStage: 'Growth Stage',
    copyAllGrowthIndicators: 'Copy all growth indicators',
    copyAllChallenges: 'Copy all challenges',
    didYouKnow: "Did you know? Zarathustra analyzes over 1,000 websites weekly to bring you the most accurate business insights!",
    copyAllAdvantages: "Copy All Advantages",
  
    // Loading animation messages
    loadingMessage1_1: "Exploring the digital terrain...",
    loadingMessage1_2: "Gathering website intel...",
    loadingMessage1_3: "Scanning for valuable insights...",

    loadingMessage2_1: "Processing the data goldmine...",
    loadingMessage2_2: "Connecting the digital dots...",
    loadingMessage2_3: "Decoding business patterns...",

    loadingMessage3_1: "Polishing insights to perfection...",
    loadingMessage3_2: "Adding that special touch...",
    loadingMessage3_3: "Crafting recommendations...",

    loadingMessage4_1: "Preparing your research feast...",
    loadingMessage4_2: "Almost ready to serve...",
    loadingMessage4_3: "Final quality checks...",

    // Rate limiting
    rateLimit: "Daily Request Limit",
    rateLimitMessageAuth: "You've used all {limit} research requests for today.",
    rateLimitMessageUnauth: "You've used all {limit} guest research requests for today.",
    resetsAt: "Your limit resets at {time}",
    signInForMore: "Sign in to get more daily requests and advanced features.",
    tomorrow: "tomorrow at",
    gotIt: "Got it",
    dailyLimit: "Daily limit",
    requestsRemaining: "{remaining} of {limit} requests left",
    upgradeForMore: "Sign in for more",
    rateLimitExceeded: "Rate limit exceeded",
    noRequestsRemaining: 'You have no research requests remaining today.',
    
    // New fields for redesign
    companyOverview: "Company Overview",
    keyInsights: "Key Insights",
    keyInsightsDescription: "The most important things you should know",
    bookmarkedInsights: "Bookmarked Insights",
    searchWithinResults: "Search within results",
    filters: "Filters",
    filterByConfidence: "Filter by confidence level",
    export: "Export",
    exportText: "Export as Text",
    exportEmail: "Export to Email",
    feedbackTitle: "Feedback",
    feedbackPrompt: "Was this research helpful to you?",
    helpful: "Helpful",
    notHelpful: "Not Helpful",
    provideFeedback: "Provide detailed feedback",
    engagementTitle: "Engagement Strategies",
    engagementDescription: "Ways to connect with this company",

    companyOverviewContext: "How the company describes itself and its primary business focus",
    valuePropositionContext: "The core value this company offers to its customers",
    painPointsContext: "Customer problems this company aims to solve",
    engagementHooksContext: "Conversation starters that can be used to engage with this company",

    exportPdf: "Export as PDF",
    pdfDownload: "Download PDF",
    pdfGenerating: "Generating PDF...",
    pdfReady: "Your PDF report is ready to download. Click the button below to save it to your device.",

    // Navigation and UI elements
    viewDetails: "View Details",
    aboutTheCompany: "About the Company",
    navigation: "Navigation",

    // Other common UI elements you might need
    viewAll: "View All",
    backToSearch: "Back to Search",
    continueResearch: "Continue Research",
    readMore: "Read More",
    showLess: "Show Less",
    showMore: "Show More",

    // Actions
    saveToFavorites: "Save to Favorites",
    compareCompanies: "Compare Companies",
    shareThis: "Share This",

    // Status messages
    loading: "Loading...",
    noResults: "No Results Found",
    tryAgain: "Try Again",

    // Additional context explanations
    aboutCompanyDescription: "Provide information about your company to improve personalization",
    searchTips: "Tips for better results",
    searchExamples: "Examples: apple.com, microsoft.com",

    // PDF related
    pdfExportTitle: "Export Research as PDF",
    pdfFileName: "Company Research - {companyName}",
    pdfGenerationError: "Error generating PDF",

    languageAutoDetected: "Auto-detected",
    languageAutoDetectedInfo: "Content language automatically detected",
    languageAutoSwitchedToast: "Language automatically switched to English based on content",

    // Email related
    emailDraftTitle: "Email Draft for {companyName}",
    emailSubject: "Proposed collaboration with {companyName}",
    emailDraftDisclaimer: "This is an AI-generated draft. Review and edit before sending.",

    // Advanced functions
    advancedFilters: "Advanced Filters",
    sortBy: "Sort By",
    relevance: "Relevance",
    dateAdded: "Date Added",
    confidence: "Confidence"
  },
  cs: {
    // UPDATED TRANSLATIONS BASED ON EMPLOYEE FEEDBACK
    titlePrefix: "Zjištěte víc se",
    titleZarathustra: "Zarathustrou",
    subtitle: "Zkraťte si prohledávání, mějte stejně poznatků. Váš AI kopilot pro prodej.",
    searchPlaceholder: "Vložte webovku zaměřované firmy (např. alza.cz)",
    aboutCompanyTitle: "O vaší společnosti",
    aboutCompanySubtitle: "Toto nám pomůže najít správné body pro spojení se zaměřovanou firmou.",
    aboutCompanyPlaceholder: "Stručně popište, co vaše společnost dělá, jakou hodnotu poskytujete a komu sloužíte...",
    researchButton: "Generovat přehled o společnosti",
    researchingButton: "Zkoumám...",
    companyInsights: "Přehled o společnosti",
    contextSpecificInsights: "Přizpůsobeno vašemu firemnímu kontextu",
    startNewResearch: "Začít nový výzkum",
    whatTheyDo: "Kdo jsou?",
    valueProposition: "Co mají?",
    painPointsTitle: "Problémy, které řeší",
    targetAudienceTitle: "Cílová skupina",
    recentDevelopmentsTitle: "Nedávný vývoj",
    engagementHooksTitle: "Body pro Vaše spojení",
    personalizationAnglesTitle: "Jak personalizovat?",
    productsServicesTitle: "Produkty a služby",
    wasHelpful: "Byl tento výzkum užitečný?",
    sendFeedback: "Poslat detailní zpětnou vazbu",
    getUnlimited: "Získejte víc výzkum společností",
    createAccount: "Vytvořte si bezplatný účet pro přístup k prémiovým funkcím výzkumu",
    advancedInsights: "Pokročilé přehledy",
    copied: "Zkopírováno!",
    failedToCopy: "Kopírování selhalo",
    urlError: "Zadejte prosím platnou URL adresu webové stránky",
    emptyUrlError: "Zadejte prosím webovou stránku společnosti",
    signIn: "Přihlásit se",
    signOut: "Odhlásit se",
    researched: "Prozkoumáno",

    share: "Sdílet",
    valuePropositionDescription: "Základní hodnota, kterou tato společnost nabízí svým zákazníkům",
    targetAudienceDescription: "Hlavní skupiny nebo jednotlivci, kterým tato společnost slouží",
    painPointsDescription: "Klíčové problémy nebo výzvy zákazníků, které tato společnost řeší",
    options: "Možnosti",

    languageAutoDetected: "Automaticky zjištěno",
    languageAutoDetectedInfo: "Jazyk obsahu automaticky zjištěn",
    languageAutoSwitchedToast: "Jazyk byl automaticky přepnut na češtinu podle obsahu",
    
    // New translations for enhanced UI
    hideCompanyContext: "Skrýt kontext společnosti",
    addCompanyContext: "Přidejte Váš firemní kontext (volitelné)",
    noDataFound: "Informace nenalezeny",
    noDataExplanation: "Pro tuto sekci jsme nenašli žádné konkrétní informace",
    highConfidence: "Vysoká spolehlivost",
    mediumConfidence: "Střední spolehlivost",
    lowConfidence: "Nízká spolehlivost",
    aiGenerated: "Generováno AI",
    aiEnhanced: "Vylepšeno AI",
    noPersonalizationAnglesFound: "Nebyly nalezeny žádné úhly personalizace",
    industryInsightsTitle: "Přehledy odvětví",
    noProductsFound: "Nebyly nalezeny žádné konkrétní produkty",
    noProductsExplanation: "Na webu jsme nemohli identifikovat konkrétní produkty",
    noCompanyInfoFound: "Nebyly nalezeny žádné informace o společnosti",
    noCompanyInfoExplanation: "Nepodařilo se nám získat konkrétní informace o této společnosti",
    
    // Research progress steps
    scraping: "Stahování webu",
    scrapingDescription: "Získávání obsahu z webu společnosti",
    analyzing: "Analýza obsahu",
    analyzingDescription: "Identifikace klíčových obchodních informací",
    enhancing: "Vylepšování přehledů",
    enhancingDescription: "Použití AI pro zlepšení a personalizaci výsledků",
    completing: "Dokončování výzkumu",
    completingDescription: "Organizace přehledů pro vaše posouzení",
    researchInProgress: "Zkoumám společnost…",
    copyAllCompanyDetails: "Zkopírovat všechny údaje o společnosti",
    copyAllProducts: "Zkopírovat všechny produkty",
    copyAllInsights: "Zkopírovat všechny přehledy",
    visitWebsite: "Navštívit web",
    contentExtracted: "Obsah extrahován",
    limitedData: "Omezená data",
    copy: "Kopírovat",
    copyAllAdvantages: "Kopírovat všechny výhody",
  
    // Loading animation messages
    loadingMessage1_1: "Prozkoumávám digitální terén...",
    loadingMessage1_2: "Shromažďuji informace z webu...",
    loadingMessage1_3: "Skenuji cenné poznatky...",
    newSearch: "Nové hledání",
  
    loadingMessage2_1: "Těžím data ze stránky",
    loadingMessage2_2: "Propojuji digitální body...",
    loadingMessage2_3: "Dekóduji obchodní vzorce...",
  
    loadingMessage3_1: "Leštím poznatky k dokonalosti...",
    loadingMessage3_2: "Přidávám trochu šmrnc",
    loadingMessage3_3: "Vytvářím doporučení...",
  
    loadingMessage4_1: "Připravuji vaši hostinu výzkumu...",
    loadingMessage4_2: "Téměř připraveno k podávání...",
    loadingMessage4_3: "Závěrečné kontroly kvality...",

    generateEmailDraft: "Vytvořit koncept e-mailu",

    didYouKnow: "Věděli jste? Zarathustra analyzuje týdně přes 10 000 webů, aby vám přinesla ty nejpřesnější obchodní poznatky!",

    // New technology sections
    technologicalStackTitle: 'Technologický stack',
    noTechnologiesFound: 'Žádné konkrétní technologie nejsou zmíněny',
  
    // New geographic sections
    geographicFocusTitle: 'Geografické zaměření',
    noGeographicFocusFound: 'Žádné konkrétní geografické zaměření není zmíněno',
  
    // New business details sections
    businessDetailsTitle: 'Obchod',
    businessModelTitle: 'Tržní segment',
    companySizeTitle: 'Velikost společnosti',
    pricingStrategyTitle: 'Cenová strategie',

    competitiveAdvantagesTitle: 'Konkurenční výhody',
    noCompetitiveAdvantagesFound: 'Nebyly nalezeny žádné konkrétní konkurenční výhody',
    growthIndicatorsTitle: 'Indikátory růstu',
    noGrowthIndicatorsFound: 'Nebyly nalezeny žádné konkrétní indikátory růstu',
    marketChallengesTitle: 'Tržní výzvy',
    noMarketChallengesFound: 'Nebyly nalezeny žádné konkrétní tržní výzvy',

    // Updated tab navigation
    overview: "Přehled",
    outreach: "Pro spojení",
    audience: "Cílový trh",
    products: "Produkty",
    market: "Význam na trhu",
    tech: "Technologie",

    companyOverviewContext: "Jak společnost popisuje sebe a své hlavní zaměření",
    valuePropositionContext: "Základní hodnota, kterou tato společnost nabízí svým zákazníkům",
    painPointsContext: "Problémy zákazníků, které se tato společnost snaží řešit",
    engagementHooksContext: "Konverzační témata, která lze použít pro navázání kontaktu s touto společností",

    growthStage: 'Fáze růstu',
    copyAllGrowthIndicators: 'Zkopírovat všechny indikátory růstu',
    copyAllChallenges: 'Zkopírovat všechny výzvy',
    noRequestsRemaining: 'Dnes vám nezbývají žádné požadavky na výzkum.',

    // Rate limiting
    rateLimit: "Denní limit požadavků",
    rateLimitMessageAuth: "Použili jste všech {limit} výzkumných požadavků pro dnešek.",
    rateLimitMessageUnauth: "Použili jste všech {limit} hostujících výzkumných požadavků pro dnešek.",
    resetsAt: "Váš limit se obnoví v {time}",
    signInForMore: "Přihlaste se a získejte více denních požadavků a pokročilé funkce.",
    tomorrow: "zítra v",
    gotIt: "Rozumím",
    dailyLimit: "Denní limit",
    requestsRemaining: "{remaining} z {limit} požadavků zbývá",
    upgradeForMore: "Přihlaste se pro více",
    rateLimitExceeded: "Překročen limit požadavků",

    theWebsite: "web", // Czech

    // New fields for redesign
    companyOverview: "Přehled společnosti",
    keyInsights: "Klíčové poznatky",
    keyInsightsDescription: "Nejdůležitější věci, které byste měli vědět",
    bookmarkedInsights: "Uložené poznatky",
    searchWithinResults: "Hledat ve výsledcích",
    filters: "Filtry",
    filterByConfidence: "Filtrovat podle úrovně spolehlivosti",
    export: "Export",
    exportText: "Exportovat jako text",
    exportEmail: "Exportovat do e-mailu",
    feedbackTitle: "Zpětná vazba",
    feedbackPrompt: "Byl pro vás tento výzkum užitečný?",
    helpful: "Užitečný",
    notHelpful: "Neužitečný",
    provideFeedback: "Poskytnout podrobnou zpětnou vazbu",
    engagementTitle: "Navázání kontaktu",
    engagementDescription: "Způsoby, jak se spojit s touto společností",

    exportPdf: "Exportovat jako PDF",
    pdfDownload: "Stáhnout PDF",
    pdfGenerating: "Generování PDF...",
    pdfReady: "Váš PDF report je připraven ke stažení. Klikněte na tlačítko níže pro uložení do zařízení.",

    // Navigation and UI elements
    viewDetails: "Zobrazit podrobnosti",
    aboutTheCompany: "O společnosti",
    navigation: "Navigace",

    // Other common UI elements
    viewAll: "Zobrazit vše",
    backToSearch: "Zpět na vyhledávání",
    continueResearch: "Pokračovat ve výzkumu",
    readMore: "Číst více",
    showLess: "Zobrazit méně",
    showMore: "Zobrazit více",

    // Actions
    saveToFavorites: "Uložit do oblíbených",
    compareCompanies: "Porovnat společnosti",
    shareThis: "Sdílet",

    // Status messages
    loading: "Načítání...",
    noResults: "Nenalezeny žádné výsledky",
    tryAgain: "Zkusit znovu",

    // Additional context explanations
    aboutCompanyDescription: "Poskytněte informace o vaší společnosti pro lepší personalizaci",
    searchTips: "Tipy pro lepší výsledky",
    searchExamples: "Příklady: alza.cz, seznam.cz",

    // PDF related
    pdfExportTitle: "Exportovat výzkum jako PDF",
    pdfFileName: "Výzkum společnosti - {companyName}",
    pdfGenerationError: "Chyba při generování PDF",

    // Email related
    emailDraftTitle: "Koncept e-mailu pro {companyName}",
    emailSubject: "Návrh spolupráce s {companyName}",
    emailDraftDisclaimer: "Toto je AI generovaný koncept. Před odesláním zkontrolujte a upravte.",

    // Advanced functions
    advancedFilters: "Pokročilé filtry",
    sortBy: "Seřadit podle",
    relevance: "Relevance",
    dateAdded: "Datum přidání",
    confidence: "Spolehlivost"
  }
};

export interface LanguageContextType {
  language: ResearchLanguage;
  setLanguage: (lang: ResearchLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{
  children: ReactNode; 
  initialLanguage?: ResearchLanguage;
}> = ({ 
  children, 
  initialLanguage = 'en' 
}) => {
  const [language, setLanguage] = useState<ResearchLanguage>(initialLanguage);

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Use Record<string, string> to tell TypeScript this is an object with string keys and string values
    const translations = researchTranslations[language] as Record<string, string>;
    let translation = translations[key] || 
                     (researchTranslations['en'] as Record<string, string>)[key] || 
                     key;
    
    // Replace placeholders if params are provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return translation;
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage: (lang: ResearchLanguage) => setLanguage(lang),
    t
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: contextValue },
    children
  );
};
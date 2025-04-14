import React, { createContext, useContext, useState, ReactNode } from 'react';

export type MilitaryLanguage = 'en' | 'cs';

export interface MilitaryTranslations {
  // Page title and headers
  titlePrefix: string;
  titleZarathustra: string;
  subtitle: string;
  
  // Form elements
  reportPlaceholder: string;
  aboutOperationPlaceholder: string;
  aboutOperationSubtitle: string;
  analyze: string;
  analyzeFusion: string;
  analyzingFusion: string;
  emptyReportError: string;
  
  // New drag-and-drop UI elements
  dragAndDropFiles: string;
  dropFilesHere: string;
  browseFiles: string;
  uploadedFiles: string;
  supportedFileTypes: string;
  
  // Intelligence categories
  tacticalSituation: string;
  situationOverview: string;
  enemyForces: string;
  hostileActivity: string;
  friendlyForces: string;
  threatAssessment: string;
  identifiedThreats: string;
  resourceStatus: string;
  geospatialInformation: string;
  communicationsElectronic: string;
  reliabilityAssessment: string;
  urgentIntelligence: string;
  criticalInformation: string;
  
  // Analysis stages
  processing: string;
  processingDescription: string;
  analyzing: string;
  analyzingDescription: string;
  validating: string;
  validatingDescription: string;
  completing: string;
  completingDescription: string;
  analysisInProgress: string;
  
  // UI elements
  keyInsights: string;
  keyInsightsDescription: string;
  copy: string;
  copied: string;
  failedToCopy: string;
  viewDetails: string;
  viewAll: string;
  navigation: string;
  noDataFound: string;
  noLocationDataFound: string;
  export: string;
  exportText: string;
  exportPdf: string;
  exportEmail: string;
  exportNATO: string;
  signIn: string;
  signOut: string;
  
  // Feedback section
  feedbackTitle: string;
  feedbackPrompt: string;
  helpful: string;
  notHelpful: string;
  provideFeedback: string;
  
  // Context options
  hideReportContext: string;
  addReportContext: string;
  
  // Rate limiting
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
  
  // Call to action
  getUnlimited: string;
  createAccount: string;
  advancedInsights: string;
  
  // Sidebar sections
  summary: string;
  layers: string;
  threats: string;
  locations: string;
  signalAnalysis: string;
  correlationAnalysis: string;
  predictions: string;
  
  // Layer types
  humint: string;
  sigint: string;
  fusion: string;
  correlationLinks: string;
  fusionEntities: string;
  
  // Map controls
  hideSidebar: string;
  showSidebar: string;
  toggleLayers: string;
  toggleTimeline: string;
  timeline: string;
  
  // Time periods
  immediate: string;
  shortTerm: string;
  
  // Actions
  startOver: string;
  showOnMap: string;
  
  // Add an index signature to allow string indexing
  [key: string]: string;
}

export const militaryTranslations: Record<MilitaryLanguage, MilitaryTranslations> = {
  en: {
    // Page title and headers
    titlePrefix: "Field Report Analysis by",
    titleZarathustra: "Zarathustra",
    subtitle: "Analyze field reports for critical intelligence and multi-source validation.",
    
    // Form elements
    reportPlaceholder: "Paste your field report here...",
    aboutOperationPlaceholder: "Add context about the current operation, mission parameters, or other relevant background...",
    aboutOperationSubtitle: "Adding operational context improves the relevance of extracted intelligence.",
    analyze: "Analyze Report",
    analyzing: "Analyzing",
    analyzeFusion: "Generate Fusion Intelligence",
    analyzingFusion: "Generating Fusion Intelligence...",
    emptyReportError: "Please enter a field report to analyze",
    
    // New drag-and-drop UI elements
    dragAndDropFiles: "Drag and drop field reports here",
    dropFilesHere: "Drop files here",
    browseFiles: "Browse files",
    uploadedFiles: "Uploaded Files",
    supportedFileTypes: "Supported file types",
    
    // Intelligence categories
    tacticalSituation: "Tactical Situation",
    situationOverview: "Situation Overview",
    enemyForces: "Enemy Forces",
    hostileActivity: "Hostile Activity",
    friendlyForces: "Friendly Forces",
    threatAssessment: "Threat Assessment",
    identifiedThreats: "Identified Threats",
    resourceStatus: "Resource Status",
    geospatialInformation: "Geospatial Information",
    communicationsElectronic: "Communications & Electronic Warfare",
    reliabilityAssessment: "Reliability Assessment",
    urgentIntelligence: "Urgent Intelligence",
    criticalInformation: "Critical Information",
    
    // Analysis stages
    processing: "Processing",
    processingDescription: "Processing report text",
    analyzingDescription: "Identifying key intelligence",
    validating: "Validating",
    validatingDescription: "Validating findings",
    completing: "Completing",
    completingDescription: "Finalizing analysis",
    analysisInProgress: "Analysis in progress",
    
    // UI elements
    keyInsights: "Key Intel",
    keyInsightsDescription: "Critical information extracted from the field report",
    copy: "Copy",
    copied: "Copied!",
    failedToCopy: "Failed to copy",
    viewDetails: "View Details",
    viewAll: "View All",
    navigation: "Navigation",
    noDataFound: "No information found",
    noLocationDataFound: "No geospatial information detected",
    export: "Export",
    exportText: "Export as Text",
    exportPdf: "Export as PDF",
    exportEmail: "Export as Email",
    exportNATO: "NATO Format",
    signIn: "Sign In",
    signOut: "Sign Out",
    
    // Feedback section
    feedbackTitle: "Was this analysis helpful?",
    feedbackPrompt: "Your feedback helps us improve our intelligence analysis.",
    helpful: "Helpful",
    notHelpful: "Not Helpful",
    provideFeedback: "Provide detailed feedback",
    
    // Context options
    hideReportContext: "Hide operation context",
    addReportContext: "Add operation context",
    
    // Rate limiting
    rateLimit: "Daily Limit Reached",
    rateLimitMessageAuth: "You have used all {limit} of your daily analyses.",
    rateLimitMessageUnauth: "You have used all {limit} of your daily analyses.",
    resetsAt: "Resets at: {time}",
    signInForMore: "Create an account or sign in for higher daily limits.",
    tomorrow: "Tomorrow at",
    gotIt: "Got It",
    dailyLimit: "Daily Analysis Limit",
    requestsRemaining: "{remaining} of {limit} analyses remaining",
    upgradeForMore: "Sign in for higher limits",
    rateLimitExceeded: "Rate limit exceeded",
    noRequestsRemaining: "No analyses remaining today",
    
    // Call to action
    getUnlimited: "Get unlimited analyses",
    createAccount: "Create an account to unlock more features",
    advancedInsights: "Advanced military intelligence features",
    
    // Sidebar sections
    summary: "Summary",
    layers: "Layers",
    threats: "Threats",
    locations: "Locations",
    signalAnalysis: "Signal Analysis",
    correlationAnalysis: "Correlation Analysis",
    predictions: "Predictions",
    showOnMap: "Show on map",
    
    // Layer types
    humint: "HUMINT",
    sigint: "SIGINT",
    fusion: "FUSION",
    correlationLinks: "Links",
    fusionEntities: "Fusion Entities",
    
    // Map controls
    hideSidebar: "Hide sidebar",
    showSidebar: "Show sidebar",
    toggleLayers: "Toggle layers",
    toggleTimeline: "Toggle timeline",
    timeline: "Timeline",
    
    // Time periods
    immediate: "Immediate (0-12 hours)",
    shortTerm: "Short-term (12-24 hours)",
    
    // Actions
    startOver: "Start Over",
  },
  cs: {
    // Page title and headers
    titlePrefix: "Analýza hlášení z terénu od",
    titleZarathustra: "Zarathustra",
    subtitle: "Analyzujte hlášení z terénu pro kritické zpravodajské informace a validaci z více zdrojů.",
    
    // Form elements
    reportPlaceholder: "Sem vložte vaše hlášení z terénu...",
    aboutOperationPlaceholder: "Přidejte kontext o aktuální operaci, parametrech mise nebo jiných relevantních souvislostech...",
    aboutOperationSubtitle: "Přidání operačního kontextu zlepšuje relevanci extrahovaných zpravodajských informací.",
    analyze: "Analyzovat hlášení",
    analyzing: "Analyzuji",
    analyzeFusion: "Generovat Fúzní Zpravodajství",
    analyzingFusion: "Generuji Fúzní Zpravodajství...",
    emptyReportError: "Prosím vložte hlášení z terénu k analýze",
    
    // New drag-and-drop UI elements
    dragAndDropFiles: "Přetáhněte sem hlášení z terénu",
    dropFilesHere: "Pusťte soubory zde",
    browseFiles: "Procházet soubory",
    uploadedFiles: "Nahrané soubory",
    supportedFileTypes: "Podporované typy souborů",
    
    // Intelligence categories
    tacticalSituation: "Taktická situace",
    situationOverview: "Přehled situace",
    enemyForces: "Nepřátelské síly",
    hostileActivity: "Nepřátelská aktivita",
    friendlyForces: "Přátelské síly",
    threatAssessment: "Hodnocení hrozeb",
    identifiedThreats: "Identifikované hrozby",
    resourceStatus: "Stav zdrojů",
    geospatialInformation: "Geoprostorové informace",
    communicationsElectronic: "Komunikace a elektronický boj",
    reliabilityAssessment: "Hodnocení spolehlivosti",
    urgentIntelligence: "Urgentní zpravodajství",
    criticalInformation: "Kritické informace",
    
    // Analysis stages
    processing: "Zpracování",
    processingDescription: "Zpracování textu hlášení",
    analyzingDescription: "Identifikace klíčových zpravodajských informací",
    validating: "Ověřování",
    validatingDescription: "Ověřování zjištění",
    completing: "Dokončování",
    completingDescription: "Finalizace analýzy",
    analysisInProgress: "Analýza probíhá",
    
    // UI elements
    keyInsights: "Klíčové zpravodajství",
    keyInsightsDescription: "Kritické informace extrahované z hlášení z terénu",
    copy: "Kopírovat",
    copied: "Zkopírováno!",
    failedToCopy: "Kopírování selhalo",
    viewDetails: "Zobrazit detaily",
    viewAll: "Zobrazit vše",
    navigation: "Navigace",
    noDataFound: "Žádné informace nenalezeny",
    noLocationDataFound: "Nezjištěny žádné geoprostorové informace",
    export: "Export",
    exportText: "Exportovat jako text",
    exportPdf: "Exportovat jako PDF",
    exportEmail: "Exportovat jako Email",
    exportNATO: "NATO formát",
    signIn: "Přihlásit se",
    signOut: "Odhlásit se",
    
    // Feedback section
    feedbackTitle: "Byla tato analýza užitečná?",
    feedbackPrompt: "Vaše zpětná vazba nám pomáhá zlepšovat naši analýzu zpravodajských informací.",
    helpful: "Užitečná",
    notHelpful: "Neužitečná",
    provideFeedback: "Poskytnout podrobnou zpětnou vazbu",
    
    // Context options
    hideReportContext: "Skrýt kontext operace",
    addReportContext: "Přidat kontext operace",
    
    // Rate limiting
    rateLimit: "Denní limit dosažen",
    rateLimitMessageAuth: "Použili jste všech {limit} vašich denních analýz.",
    rateLimitMessageUnauth: "Použili jste všech {limit} vašich denních analýz.",
    resetsAt: "Obnoví se v {time}",
    signInForMore: "Vytvořte si účet nebo se přihlaste pro vyšší denní limity.",
    tomorrow: "Zítra v",
    gotIt: "Rozumím",
    dailyLimit: "Denní limit analýz",
    requestsRemaining: "Zbývá {remaining} z {limit} analýz",
    upgradeForMore: "Přihlaste se pro vyšší limity",
    rateLimitExceeded: "Limit překročen",
    noRequestsRemaining: "Dnes vám nezbývají žádné analýzy",
    
    // Call to action
    getUnlimited: "Získejte neomezené analýzy",
    createAccount: "Vytvořte si účet pro odemknutí více funkcí",
    advancedInsights: "Pokročilé funkce vojenského zpravodajství",
    
    // Sidebar sections
    summary: "Souhrn",
    layers: "Vrstvy",
    threats: "Hrozby",
    locations: "Lokace",
    signalAnalysis: "Analýza signálů",
    correlationAnalysis: "Korelační analýza",
    predictions: "Předpovědi",
    showOnMap: "Zobrazit na mapě",
    
    // Layer types
    humint: "HUMINT",
    sigint: "SIGINT",
    fusion: "FÚZE",
    correlationLinks: "Spojení",
    fusionEntities: "Fúzní entity",
    
    // Map controls
    hideSidebar: "Skrýt postranní panel",
    showSidebar: "Zobrazit postranní panel",
    toggleLayers: "Přepnout vrstvy",
    toggleTimeline: "Přepnout časovou osu",
    timeline: "Časová osa",
    
    // Time periods
    immediate: "Okamžité (0-12 hodin)",
    shortTerm: "Krátkodobé (12-24 hodin)",
    
    // Actions
    startOver: "Začít znovu",
  }
};

export interface MilitaryLanguageContextType {
  language: MilitaryLanguage;
  setLanguage: (lang: MilitaryLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations?: Record<MilitaryLanguage, MilitaryTranslations>;
}

export const MilitaryLanguageContext = createContext<MilitaryLanguageContextType | undefined>(undefined);

export const useMilitaryLanguage = (): MilitaryLanguageContextType => {
  const context = useContext(MilitaryLanguageContext);
  if (context === undefined) {
    throw new Error('useMilitaryLanguage must be used within a MilitaryLanguageProvider');
  }
  return context;
};

export const MilitaryLanguageProvider: React.FC<{
  children: ReactNode; 
  initialLanguage?: MilitaryLanguage;
}> = ({ 
  children, 
  initialLanguage = 'en' 
}) => {
  const [language, setLanguage] = useState<MilitaryLanguage>(initialLanguage);

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Get the translations for the current language
    const translationSet = militaryTranslations[language];
    
    // Check if the key exists in the current language
    let translation = translationSet[key];
    
    // If not found, try English as fallback
    if (!translation && language !== 'en') {
      translation = militaryTranslations['en'][key];
    }
    
    // If still not found, return the key itself
    if (!translation) {
      return key;
    }
    
    // Replace placeholders if params are provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return translation;
  };

  const contextValue: MilitaryLanguageContextType = {
    language,
    setLanguage: (lang: MilitaryLanguage) => setLanguage(lang),
    t,
    translations: militaryTranslations
  };

  return React.createElement(
    MilitaryLanguageContext.Provider,
    { value: contextValue },
    children
  );
};
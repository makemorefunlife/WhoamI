/** Minimal MVP UI catalog — English (default) */
export const messagesEnUS = {
  common: {
    close: "Close",
    creating: "Creating…",
    preparing: "Preparing…",
  },
  nav: {
    home: "Home",
    dashboard: "Dashboard",
    relationLab: "Relation Lab",
    blueprint: "Blueprint",
    decision: "Decision",
    account: "Account",
    pricing: "Pricing",
    about: "About",
    howItWorks: "How it works",
    faq: "FAQ",
    contact: "Contact",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
  },
  cta: {
    getStarted: "Get started",
    startFree: "Start free",
    continue: "Continue",
    analyze: "Analyze",
    viewReport: "View report",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    learnMore: "Learn more",
  },
  survey: {
    title: "Self survey",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    completeTitle: "Survey complete",
    completeBody: "Your answers are saved. Continue to your blueprint.",
    birthSaveFailed:
      "We couldn't save your birth info. Please try again in a moment.",
    birthSaveNetworkError:
      "We couldn't save your birth info. Please check your network and try again.",
    organizingPatternsEyebrow: "Organizing patterns",
    organizingPatternsTitle: "Organizing your patterns from your answers",
    organizingPatternsSubtitle:
      "Please wait a moment. You'll be able to enter your birth info soon.",
    saving: "Saving…",
    viewResults: "View results",
    birthFormIncompleteHint:
      "Please enter your birth date, and either enter or skip time/place.",
    goHome: "Home",
  },
  hub: {
    title: "Relation Lab",
    addFriend: "Add someone",
    empty: "No relationships yet. Invite or add someone to start.",
    analyzeBasic: "Basic analysis",
    analyzePremium: "Deep analysis",
    favoritesOnly: "Favorites only",
    bannerText:
      "Analyze your relationship with a friend and make your best decision!",
    bannerDismiss: "Dismiss banner",
    loadingRecords: "Loading your records…",
    loadFailed: "We couldn't load that.",
    emptyBlueprintRequired:
      "Complete your blueprint to see your friend list and analysis history here.",
    emptyBlueprintRequiredSignedInHint:
      " If you continued on another browser, it will connect automatically once signed in.",
    favoriteSaveFailed: "We couldn't save your favorite.",
    signInRequiredForFriend: "Sign in (or sign up) to add friends.",
    inviteCreateFailed: "We couldn't create the invite link.",
    inviteInfoUnavailable: "We couldn't confirm the invite details.",
    inviteCancelConfirm:
      "Cancel this invite? (The analysis credit may be reclaimed.)",
    inviteCancelFailed: "We couldn't cancel that.",
    inviteLinkCopied: "Invite link copied.",
    inviteLinkCopyFailed: "Couldn't copy the link.",
    relationshipCreateFailed: "We couldn't create the relationship.",
    relationshipCreateNetworkError:
      "A network error kept us from creating the relationship.",
    pendingFriendCannotAnalyze:
      "You can't start analysis while the invite is still pending.",
    viewerReportMissing:
      "We couldn't find your report. Please complete your blueprint first, then try again.",
    renameSaveFailed: "We couldn't save the name.",
    selectFriendFirst: "Please select a friend first.",
    analyzeCta: "Analyze relationship",
    analyzeWithName: (name: string) => `Analyze with ${name}`,
  },
  report: {
    chrome: {
      summary: "Summary",
      details: "Details",
      actions: "Actions",
      loading: "Loading report…",
      error: "Could not load this report.",
      retry: "Try again",
    },
    analyzing: "Analyzing…",
    analyzingHint: "Please wait a moment",
    unknownBirthNotice:
      "Exact birth time and place weren't provided, so we used noon and San Francisco, CA as defaults. Actual results may differ slightly.",
    dashboardEyebrow: "Your dashboard",
    dashboardGreetingLead: "Hello, ",
    dashboardGreetingTrail: ".",
    dashboardTitleDefault: "Your blueprint",
    surveyCompleteBadge: "Survey complete",
    behavioralBlueprintEyebrow: "Behavioral blueprint",
    currentVsEssenceTitle: "Current state vs. Essence potential",
    aboutChartAria: "About this chart",
    aboutChartTitle: "Survey patterns (current) overlaid with birth-chart traits (Essence)",
    currentStateLabel: "Current state",
    essencePotentialLabel: "Essence potential",
    currentStateAxisSummaryTitle: "Current state — axis summary",
    overallSummary: "Overall summary",
    currentStateSubtitle: "Survey-based",
    essenceBlueprintTitle: "Essence blueprint",
    essenceBlueprintSubtitle: "Birth-chart based",
    guestOpenAnalysisHint: "Sign in to unlock your free detailed analysis.",
    openAnalysisHint: "Tap a free analysis above to open your report below.",
    comingSoon: "Coming soon",
    moreAnalysisTitle: "More analysis coming",
    moreAnalysisBody:
      "Relationship and decision analysis will connect here soon.",
    guestNoticeTitle: "You're not signed in",
    guestNoticeP1Lead: "The survey and birth info you're viewing now ",
    guestNoticeP1Bold1: "isn't saved",
    guestNoticeP1Mid:
      ". If you close your browser or switch devices, your results ",
    guestNoticeP1Bold2: "may be lost",
    guestNoticeP2Lead:
      "To use free detailed analysis, relationship analysis, decision helper, and more, ",
    guestNoticeP2Bold: "you'll need to sign in (or sign up)",
    guestNoticeSignInCta: "Sign in · Sign up",
    relationshipKindNames: {
      romantic: "Romantic",
      work: "Colleague",
      cohabitation: "Cohabitation",
      friendship: "Friend",
      family: "Family",
    },
    relationshipAnalysisTitleSuffix: "relationship analysis",
    viewerPartnerSeparator: "'s view · ",
    partnerNameSuffix: "",
    viewerReportIdRequired: "A report ID (mine) is required in the URL. e.g.:",
    viewerQueryPlaceholder: "?viewer=REPORT_UUID",
    goToRelationHub: "Go to Relation Hub",
    relationshipIdNotFound: "We couldn't find the relationship analysis ID.",
    processing: "Processing…",
    viewingSavedSnapshot: "You're viewing a saved analysis record",
    viewLatestResult: "View latest",
    createBasicAnalysis: "Create basic analysis",
    reportReadyNotice: "Your report is ready. Check it out below.",
    chooseKindHint:
      "Pick a relationship type to generate deep analysis right away.",
    analysisHistoryTitle: "Analysis history",
    loadingReportTitle: "Loading your report",
    generatingReportTitle: "Generating your report",
    generatingSubtitle: (partnerName: string, kindLabel: string) =>
      `Preparing your ${kindLabel} analysis with ${partnerName}. It may take 1–2 minutes.`,
    axisLabels: {
      emotional_sensitivity: "Emotional sensitivity",
      communication_style: "Communication style",
      conflict_response: "Conflict & distance",
      energy_pattern: "Energy & rhythm",
    },
    axisDifferenceHeading: "👉 Here's the difference",
    axisActionHeading: "🎯 Try this today",
    basicAnalysisEmpty: "There's no basic relationship analysis yet.",
    meFallbackLabel: "Me",
    partnerFallbackLabel: "Partner",
    historyLoading: "Loading analysis history…",
    historyEmpty: "No saved analysis yet. Run an analysis and it'll show up here.",
    historyViewingNow: "You're viewing this record now",
    historyTapToView: "Tap to view again",
    favoriteRemove: "Remove from favorites",
    favoriteLabel: "Favorite",
    heartLabel: "Heart",
    childDnaPlaybookLabel: "👪 Child DNA Playbook · Choose a role",
    motherLens: "🌸 Mom lens",
    fatherLens: "🛡️ Dad lens",
    childIsViewerCheckbox: (viewerName: string) =>
      `The child being analyzed is 'me' (${viewerName || "viewer"})`,
    viewerFallbackLabel: "viewer",
    debugParentTypeLine: (parentType: string, childLabel: string) =>
      `parentType: ${parentType} · child=${childLabel}`,
    premiumGeneratingSubtitle:
      "Please wait a moment. It usually takes 1–2 minutes.",
    premiumEmptyRomantic:
      "You don't have a Saju-based romantic deep analysis yet.",
    premiumEmptyWork: "You don't have a colleague deep analysis yet.",
    premiumEmptyCohabitation:
      "You don't have a cohabitation deep analysis yet.",
    premiumEmptyFamily: "You don't have a Child DNA analysis yet.",
    premiumEmptyFriendship: "You don't have a Social DNA analysis yet.",
    premiumEmptyGenerateHint: "You can generate it with the button below.",
    premiumEmptyFamilyHint: "Choose a Mom/Dad lens above, then generate.",
    premiumGenerateCta: (kindLabel: string) => `Generate ${kindLabel} deep analysis`,
    premiumGenerating: "Generating deep analysis…",
    premiumRegenerateCta: (kindLabel: string) =>
      `Regenerate ${kindLabel} deep analysis`,
    premiumRegenerating: "Regenerating deep analysis…",
    premiumRegenerateHint:
      "This generates a fresh prompt. You can find the previous result in the analysis history below.",
    premiumGenerateFailed:
      "The request didn't complete. Please try again in a moment.",
    premiumEyebrow: "Premium · Deep relationship",
    premiumEmptyGeneric: "You don't have a deep analysis yet.",
  },
  onboarding: {
    birthTitle: "Birth details",
    birthSubtitle: "We use date, time, and place for your chart.",
    birthDate: "Birth date",
    birthTime: "Birth time",
    birthPlace: "Birth place",
    timeUnknown: "I don't know the exact time",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    unauthorized: "Please sign in to continue.",
    notFound: "We couldn't find that.",
    forbidden: "You don't have access to this.",
    network: "Network error. Check your connection.",
    reportIdRequired: "A report ID is required.",
    birthDateRequired: "A birth date is required.",
    birthMissing: "We don't have your birth details yet. Add them under Account → Birth info.",
    analysisFailed: "The analysis didn't go through. Please try again.",
    relationshipSaveFailed: "We couldn't save the analysis. Please try again in a moment.",
    relationshipAnalysisFailed: "The deep relationship analysis failed. Please try again in a moment.",
    relationshipIdsRequired: "A relationship report ID and viewer report ID are required.",
    personCoreLoadFailed: "We couldn't load this person's core profile.",
    relationshipDataMissing: "We couldn't load both people's report details.",
    invalidRequest: "This request is invalid.",
    serviceUnavailable: "This is temporarily unavailable. Please try again in a moment.",
    relationshipManualFieldsRequired:
      "A report ID, partner name, and birth date are required.",
    friendSurveyIncomplete: "10 survey answers are required.",
    partnerReportCreateFailed: "We couldn't create the friend's report.",
    twoReportIdsRequired: "Both report IDs are required.",
    reportsMustDiffer: "The two reports must be different.",
    birthDateCorrectionUsed:
      "Birth date can only be corrected once from your account. Please contact support for further changes.",
    inviteInvalid: "This invite is invalid.",
    inviteCompleteFailed: "We couldn't complete the invite.",
    inviteUnavailable: "This invite is no longer available.",
  },
  account: {
    title: "Account",
    profile: "Profile",
    billing: "Billing",
  },
  pricing: {
    title: "Pricing",
    shellNote: "Plans and checkout will be available soon.",
  },
  relationshipForm: {
    nameRequired: "Please enter a name.",
    birthDateRequired: "Please enter a birth date (YYYY-MM-DD).",
    birthTimeRequired: "Please enter a birth time or select “Unknown birth time.”",
    birthPlaceRequired: "Please enter a birth place or select “Unknown birth place.”",
    surveyIncomplete: (answered: number, total: number) =>
      `Please complete the friend survey. (${answered}/${total})`,
    fieldsRequired: "Please fill in the required fields.",
    responses: (answered: number, total: number) => `${answered}/${total} answered`,
    nameLabel: "Name (or nickname)",
    namePlaceholder: "e.g., Alex",
    birthPlacePlaceholder: "e.g., Seoul, Busan",
    birthPlaceSkip: "Skip · Unknown birth place",
    surveyTitle: "Friend survey (10 questions)",
    surveyModeAnswer: "Take survey",
    surveyModeSkip: "Skip",
    surveySkippedNote: "Skip the survey — analysis will use a neutral profile.",
    createRelationship: "Create relationship",
  },
  landing: {
    heroTitleLine1: "Understand yourself.",
    heroTitleLine2Start: "Make peace with ",
    heroTitleLine2Emphasis: "your story",
    heroTitleLine2End: ".",
    heroSubtitle: "Gentle insights for the moments you're searching for answers.",
    featureBrainTitle: "Deep Behavioral Mapping",
    featureBrainDesc:
      "Our proprietary algorithms translate complex emotional data into actionable clarity, helping you understand the 'why' behind your reactions.",
    featureHeartTitle: "Relationship Alignment",
    featureHeartDesc:
      "Sync your profile with partners or family to visualize compatibility and communication gaps.",
    featureGrowthTitle: "Longitudinal Growth",
    featureGrowthDesc:
      "Track your evolution over months and years with precise data-driven journaling.",
    sanctuaryTitle: "The Scientific Sanctuary",
    sanctuarySubtitle: "Our three-pillar approach to lasting equilibrium.",
    footerTagline:
      "Architecting psychological equilibrium through scientific discovery and empathetic design.",
    authModalTitle: "Continue your journey",
    authModalBody: "Sign in quickly with Google, or use email.",
  },
  dock: {
    home: "Home",
    me: "Me",
    lab: "Lab",
    choice: "Choice",
  },
  header: {
    openMenu: "Open menu",
    homeAria: "Aha It's me! Home",
    signInFailedTitle: "Couldn't connect to sign-in",
    signInFailedAlert:
      "We couldn't connect to the sign-in service. Please refresh the page.",
  },
  startChoice: {
    titleSignedIn: "Where would you like to go?",
    titleGuest: "How would you like to start?",
    bodySignedIn:
      "Pick a hub and we'll continue from wherever you left off (survey/birth info).",
    bodyGuest: "Start free with a 10-question survey, or sign in to continue.",
    goBlueprint: "Me (recommended)",
    goRelationships: "Relationships",
    goDecision: "Decisions",
    startFree: "Start free (survey)",
    later: "Maybe later",
  },
  addFriend: {
    title: "Add a friend",
    tabInvite: "Invite link",
    tabManual: "Enter manually",
    inviteHint:
      "The link is valid for 48 hours; accepting it uses one analysis credit.",
    createInvite: "Create invite link",
    viewSentRequests: "View sent requests",
  },
  footer: {
    support: "Support",
    legal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
    copyrightSuffix: "All rights reserved.",
  },
  birthForm: {
    heading: "Birth date, time & place",
    subtitle:
      "Used for Saju and astrology interpretation. You can skip what you don't know.",
    dateConfirmed: (date: string) => `${date} — confirmed`,
    dateIncomplete: "Please enter year, month, and day.",
    timeUnknownNotice: "Birth time unknown — calculated using noon as default.",
    amLabel: "AM",
    pmLabel: "PM",
    timeRangeHint: "1–12 h · 00–59 min",
    skipTime: "Unknown / skip time",
    placeUnknownNoticeLabel: "Note:",
    placeUnknownNoticeBody:
      "If we don't know the place, interpretation accuracy may drop. We'll estimate roughly around your current location if possible.",
    placeNeededHint:
      "Needed for the astrology chart. Saju (essence) doesn't depend on location.",
    enterPlaceManually: "Enter place manually",
    skipPlace: "Skip place",
    placePlaceholder: "e.g., Seoul, Busan, Tokyo",
  },
  blueprint: {
    surveyRequired: "Please complete the survey first to see your blueprint.",
    startSurveyCta: "Start survey",
    loading: "Loading your blueprint…",
    currentTitle: "Current self",
    surveyResultLabel: "(Survey results)",
    axisChartLabel: "Human Framework (6 axes)",
    backToBlueprint: "Back to Blueprint",
    viewEssenceProfile: "View Essence Profile →",
    essenceTitle: "Inner Essence",
    essenceBirthTimeUnknownNotice:
      "Birth time not provided — this Lite analysis excludes Saju hour signals.",
    deepExploration: "Deep exploration",
    viewCurrentProfile: "View Current Self (Survey Results) →",
    deepAnalysisTitle: "Deep integration analysis",
    deepAnalysisSubtitle:
      "A deep report combining your survey and birth energy.",
    checkingSurveyBirth: "Checking survey and birth info…",
    regenerating: "Generating… (1–2 min)",
    regenerate: "Regenerate",
    backToDashboard: "Back to dashboard",
    editBirthInfo: "Edit birth info (Account)",
    generatingReportNotice: "Generating your report… this usually takes 1–2 minutes.",
    dontCloseWindow: "Please don't close this window.",
    regeneratingOverlay: "Regenerating…",
  },
};

/** Shape-only catalog (values are free strings per locale). */
export type MessageCatalog = {
  common: {
    close: string;
    creating: string;
    preparing: string;
  };
  nav: {
    home: string;
    dashboard: string;
    relationLab: string;
    blueprint: string;
    decision: string;
    account: string;
    pricing: string;
    about: string;
    howItWorks: string;
    faq: string;
    contact: string;
    signIn: string;
    signUp: string;
    signOut: string;
  };
  cta: {
    getStarted: string;
    startFree: string;
    continue: string;
    analyze: string;
    viewReport: string;
    back: string;
    save: string;
    cancel: string;
    learnMore: string;
  };
  survey: {
    title: string;
    next: string;
    previous: string;
    submit: string;
    completeTitle: string;
    completeBody: string;
    birthSaveFailed: string;
    birthSaveNetworkError: string;
    organizingPatternsEyebrow: string;
    organizingPatternsTitle: string;
    organizingPatternsSubtitle: string;
    saving: string;
    viewResults: string;
    birthFormIncompleteHint: string;
    goHome: string;
  };
  hub: {
    title: string;
    addFriend: string;
    empty: string;
    analyzeBasic: string;
    analyzePremium: string;
    favoritesOnly: string;
    bannerText: string;
    bannerDismiss: string;
    loadingRecords: string;
    loadFailed: string;
    emptyBlueprintRequired: string;
    emptyBlueprintRequiredSignedInHint: string;
    favoriteSaveFailed: string;
    signInRequiredForFriend: string;
    inviteCreateFailed: string;
    inviteInfoUnavailable: string;
    inviteCancelConfirm: string;
    inviteCancelFailed: string;
    inviteLinkCopied: string;
    inviteLinkCopyFailed: string;
    relationshipCreateFailed: string;
    relationshipCreateNetworkError: string;
    pendingFriendCannotAnalyze: string;
    viewerReportMissing: string;
    renameSaveFailed: string;
    selectFriendFirst: string;
    analyzeCta: string;
    analyzeWithName: (name: string) => string;
  };
  report: {
    chrome: {
      summary: string;
      details: string;
      actions: string;
      loading: string;
      error: string;
      retry: string;
    };
    analyzing: string;
    analyzingHint: string;
    unknownBirthNotice: string;
    dashboardEyebrow: string;
    dashboardGreetingLead: string;
    dashboardGreetingTrail: string;
    dashboardTitleDefault: string;
    surveyCompleteBadge: string;
    behavioralBlueprintEyebrow: string;
    currentVsEssenceTitle: string;
    aboutChartAria: string;
    aboutChartTitle: string;
    currentStateLabel: string;
    essencePotentialLabel: string;
    currentStateAxisSummaryTitle: string;
    overallSummary: string;
    currentStateSubtitle: string;
    essenceBlueprintTitle: string;
    essenceBlueprintSubtitle: string;
    guestOpenAnalysisHint: string;
    openAnalysisHint: string;
    comingSoon: string;
    moreAnalysisTitle: string;
    moreAnalysisBody: string;
    guestNoticeTitle: string;
    guestNoticeP1Lead: string;
    guestNoticeP1Bold1: string;
    guestNoticeP1Mid: string;
    guestNoticeP1Bold2: string;
    guestNoticeP2Lead: string;
    guestNoticeP2Bold: string;
    guestNoticeSignInCta: string;
    relationshipKindNames: {
      romantic: string;
      work: string;
      cohabitation: string;
      friendship: string;
      family: string;
    };
    relationshipAnalysisTitleSuffix: string;
    viewerPartnerSeparator: string;
    partnerNameSuffix: string;
    viewerReportIdRequired: string;
    viewerQueryPlaceholder: string;
    goToRelationHub: string;
    relationshipIdNotFound: string;
    processing: string;
    viewingSavedSnapshot: string;
    viewLatestResult: string;
    createBasicAnalysis: string;
    reportReadyNotice: string;
    chooseKindHint: string;
    analysisHistoryTitle: string;
    loadingReportTitle: string;
    generatingReportTitle: string;
    generatingSubtitle: (partnerName: string, kindLabel: string) => string;
    axisLabels: {
      emotional_sensitivity: string;
      communication_style: string;
      conflict_response: string;
      energy_pattern: string;
    };
    axisDifferenceHeading: string;
    axisActionHeading: string;
    basicAnalysisEmpty: string;
    meFallbackLabel: string;
    partnerFallbackLabel: string;
    historyLoading: string;
    historyEmpty: string;
    historyViewingNow: string;
    historyTapToView: string;
    favoriteRemove: string;
    favoriteLabel: string;
    heartLabel: string;
    childDnaPlaybookLabel: string;
    motherLens: string;
    fatherLens: string;
    childIsViewerCheckbox: (viewerName: string) => string;
    viewerFallbackLabel: string;
    debugParentTypeLine: (parentType: string, childLabel: string) => string;
    premiumGeneratingSubtitle: string;
    premiumEmptyRomantic: string;
    premiumEmptyWork: string;
    premiumEmptyCohabitation: string;
    premiumEmptyFamily: string;
    premiumEmptyFriendship: string;
    premiumEmptyGenerateHint: string;
    premiumEmptyFamilyHint: string;
    premiumGenerateCta: (kindLabel: string) => string;
    premiumGenerating: string;
    premiumRegenerateCta: (kindLabel: string) => string;
    premiumRegenerating: string;
    premiumRegenerateHint: string;
    premiumGenerateFailed: string;
    premiumEyebrow: string;
    premiumEmptyGeneric: string;
  };
  onboarding: {
    birthTitle: string;
    birthSubtitle: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    timeUnknown: string;
  };
  errors: {
    generic: string;
    unauthorized: string;
    notFound: string;
    forbidden: string;
    network: string;
    reportIdRequired: string;
    birthDateRequired: string;
    birthMissing: string;
    analysisFailed: string;
    relationshipSaveFailed: string;
    relationshipAnalysisFailed: string;
    relationshipIdsRequired: string;
    personCoreLoadFailed: string;
    relationshipDataMissing: string;
    invalidRequest: string;
    serviceUnavailable: string;
    relationshipManualFieldsRequired: string;
    friendSurveyIncomplete: string;
    partnerReportCreateFailed: string;
    twoReportIdsRequired: string;
    reportsMustDiffer: string;
    birthDateCorrectionUsed: string;
    inviteInvalid: string;
    inviteCompleteFailed: string;
    inviteUnavailable: string;
  };
  account: {
    title: string;
    profile: string;
    billing: string;
  };
  pricing: {
    title: string;
    shellNote: string;
  };
  relationshipForm: {
    nameRequired: string;
    birthDateRequired: string;
    birthTimeRequired: string;
    birthPlaceRequired: string;
    surveyIncomplete: (answered: number, total: number) => string;
    fieldsRequired: string;
    responses: (answered: number, total: number) => string;
    nameLabel: string;
    namePlaceholder: string;
    birthPlacePlaceholder: string;
    birthPlaceSkip: string;
    surveyTitle: string;
    surveyModeAnswer: string;
    surveyModeSkip: string;
    surveySkippedNote: string;
    createRelationship: string;
  };
  landing: {
    heroTitleLine1: string;
    heroTitleLine2Start: string;
    heroTitleLine2Emphasis: string;
    heroTitleLine2End: string;
    heroSubtitle: string;
    featureBrainTitle: string;
    featureBrainDesc: string;
    featureHeartTitle: string;
    featureHeartDesc: string;
    featureGrowthTitle: string;
    featureGrowthDesc: string;
    sanctuaryTitle: string;
    sanctuarySubtitle: string;
    footerTagline: string;
    authModalTitle: string;
    authModalBody: string;
  };
  dock: {
    home: string;
    me: string;
    lab: string;
    choice: string;
  };
  header: {
    openMenu: string;
    homeAria: string;
    signInFailedTitle: string;
    signInFailedAlert: string;
  };
  startChoice: {
    titleSignedIn: string;
    titleGuest: string;
    bodySignedIn: string;
    bodyGuest: string;
    goBlueprint: string;
    goRelationships: string;
    goDecision: string;
    startFree: string;
    later: string;
  };
  addFriend: {
    title: string;
    tabInvite: string;
    tabManual: string;
    inviteHint: string;
    createInvite: string;
    viewSentRequests: string;
  };
  footer: {
    support: string;
    legal: string;
    terms: string;
    privacy: string;
    refund: string;
    copyrightSuffix: string;
  };
  birthForm: {
    heading: string;
    subtitle: string;
    dateConfirmed: (date: string) => string;
    dateIncomplete: string;
    timeUnknownNotice: string;
    amLabel: string;
    pmLabel: string;
    timeRangeHint: string;
    skipTime: string;
    placeUnknownNoticeLabel: string;
    placeUnknownNoticeBody: string;
    placeNeededHint: string;
    enterPlaceManually: string;
    skipPlace: string;
    placePlaceholder: string;
  };
  blueprint: {
    surveyRequired: string;
    startSurveyCta: string;
    loading: string;
    currentTitle: string;
    surveyResultLabel: string;
    axisChartLabel: string;
    backToBlueprint: string;
    viewEssenceProfile: string;
    essenceTitle: string;
    essenceBirthTimeUnknownNotice: string;
    deepExploration: string;
    viewCurrentProfile: string;
    deepAnalysisTitle: string;
    deepAnalysisSubtitle: string;
    checkingSurveyBirth: string;
    regenerating: string;
    regenerate: string;
    backToDashboard: string;
    editBirthInfo: string;
    generatingReportNotice: string;
    dontCloseWindow: string;
    regeneratingOverlay: string;
  };
};

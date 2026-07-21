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
    ownBirthDateCollisionWarning:
      "The birth date and time you entered exactly match your own. Please double-check you didn't enter your own birthday by mistake.",
    pendingFriendCannotAnalyze:
      "You can't start analysis while the invite is still pending.",
    viewerReportMissing:
      "We couldn't find your report. Please complete your blueprint first, then try again.",
    renameSaveFailed: "We couldn't save the name.",
    selectFriendFirst: "Please select a friend first.",
    analyzeCta: "Analyze relationship",
    analyzeWithName: (name: string) => `Analyze with ${name}`,
    allFriendsTitle: "All friends",
    noFriendsRegistered: "You don't have any friends added yet.",
    sentRequestsTitle: "Sent requests",
    noSentRequests: "No requests waiting on a response.",
    inviteWaitingTitle: "Invite pending",
    inviteWaitingHintDefault: "Waiting for them to accept",
    resendInvite: "Resend",
    cancelInvite: "Cancel invite",
    kindPickerTitle: (partnerName: string) =>
      `How would you like to view your relationship with ${partnerName}?`,
    kindPickerSubtitle: "The analysis changes based on the relationship you pick.",
    kindPickerSubtitlePremium:
      "The deep analysis changes based on the relationship you pick.",
    perspectiveSelectLabel: "Choose a perspective",
    parentPerspectiveTitle: "Parent's perspective",
    parentPerspectiveSubtitle: "Viewing the child",
    childPerspectiveTitle: "Child's perspective",
    childPerspectiveSubtitle: "Viewing the parent",
    motherLensShort: "Mom",
    fatherLensShort: "Dad",
    renameTitle: "Rename",
    renamePlaceholder: "Nickname (max 10 characters)",
    renameCharCountHint: (count: number) =>
      `${count}/10 · Only manually-added friends are saved to your account`,
    allAnalysisTitle: "Analysis history",
    noAnalysisRecords: "No records yet.",
    loadMore: "Load more",
    addFriendAria: "Add a friend",
    addFriendShort: "Add",
    friendListTitle: "Friends",
    friendListLoading: "Loading your friends…",
    noFavoriteFriends: "You don't have any favorite friends yet.",
    viewAllFriendsAria: "View all friends",
    more: "More",
    renameCta: "Rename",
    unfavorite: "Unfavorite",
    favorite: "Favorite",
    emptyHubAria: "Add your first friend",
    emptyHubBody: "Add at least one friend to start a relationship analysis.",
    addFirstFriendCta: "+ Add your first friend",
    addFriendCta: "Add a friend",
    selectOrAddFriendHint:
      "Select or add a friend to start an analysis.",
    recentAnalysisTitle: "Recent analysis",
    noAnalysisYetHint: "No analysis yet. Tap Analyze relationship to get started.",
    reportRowPartnerLabel: (name: string) => `with ${name}`,
    reportRowAria: (name: string) => `View ${name}'s report`,
    viewReportCta: "View Report +",
    navigatingToAnalysis: (partnerName: string) =>
      `Heading to ${partnerName}'s analysis…`,
    badgeOutboundWaiting: "Sent request",
    badgeOutboundRelationship: "Invited by me",
    badgeInboundRelationship: "Received invite",
    badgeOtherRelationship: "Relationship",
    badgeManualRelationship: "Manually added",
    premiumBadge: "Premium",
    basicBadge: "Basic",
    defaultTitle: (name: string) => `Relationship with ${name}`,
    partnerPrefix: (name: string) => `Partner: ${name}`,
    premiumDoneStatus: "Deep analysis complete",
    basicDoneStatus: "Basic analysis complete",
    premiumIncompleteStatus: "Deep analysis incomplete · pick up where you left off",
    preparingStatus: "Preparing analysis · check back shortly",
    viewCompletedReport: "View completed report",
    viewOtherKinds: "See more relationship types",
    viewOtherKindsFull:
      "See more relationship types (romantic, family, colleague, friend)",
    deleting: "Deleting…",
    delete: "Delete",
    copyLink: "Copy link",
    deleteRequestCta: "Delete request",
    resendInviteLink: "Resend invite link",
    shareInviteTitle: "Invite a friend",
    shareInviteText: "Let's get our relationship analyzed together.",
    shareCopiedNotice: "Copied.",
    shareFailedNotice: "Couldn't share that.",
    nativeShareUnavailable:
      "System sharing isn't available on this device. Please use one of the options above.",
    shareToggleCta: "Share",
    shareViaSms: "Message",
    shareViaOtherApp: "Other app…",
    kindBadgeRomantic: "Romantic",
    kindBadgeWork: "Colleague",
    kindBadgeCohabitation: "Married",
    kindBadgeFriendship: "Friend",
    kindBadgeFamily: "Family",
    analysisLevelBasic: "Basic",
    analysisLevelPremium: "Deep",
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
    legacyInsightSecond: {
      emotional_sensitivity:
        "If you show emotion at different speeds, it's easy to come across as 'distant.'",
      communication_style:
        "If you expect different lengths or paces of talking, one of you may feel like the only one talking.",
      conflict_response:
        "If one of you wants to stay close right after conflict and the other wants space, it can get tenser.",
      energy_pattern:
        "If one of you recharges alone and the other with company, it can throw off how long you spend together.",
    },
    legacyInsightDefault: [
      "Different patterns can lead to misunderstandings.",
      "Take a beat, then keep it short.",
    ],
    legacyActions: {
      emotional_sensitivity: [
        "Ask each other to share how you're feeling in just one word today.",
        "Try sending texts in two short messages instead of one long one.",
      ],
      communication_style: [
        "Try pausing three seconds before responding when they're talking.",
        "Before a long story, say 'I'll keep this brief' first.",
      ],
      conflict_response: [
        "When things get heated, say 'let me sort this out alone for 10 minutes.'",
        "Once you've calmed down, be the one to say 'let's sum this up in one line.'",
      ],
      energy_pattern: [
        "For today's plan, just set a time and rest separately afterward.",
        "For next week's plans, agree ahead of time whether it'll be 'light' or 'long.'",
      ],
    },
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
    motherLens: "Mom",
    fatherLens: "Dad",
    childIsViewerCheckbox: (viewerName: string) =>
      `The child being analyzed is 'me' (${viewerName || "viewer"})`,
    viewerFallbackLabel: "viewer",
    debugParentTypeLine: (parentType: string, childLabel: string) =>
      `${parentType === "father" ? "Dad" : "Mom"} · child=${childLabel}`,
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
    premiumEmptyFamilyHint: "Choose Mom or Dad above, then generate.",
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
    viewerQueryRequired: "A viewer query (my report id) is required.",
    relationshipUrlInvalid: "This relationship analysis address isn't valid.",
    basicAnalysisFailed: "Basic analysis failed",
    premiumAnalysisFailedGeneric: "Deep analysis failed",
    premiumAnalysisFailedRomantic:
      "We didn't receive the romantic deep analysis result.",
    premiumAnalysisFailedWork:
      "We didn't receive the colleague deep analysis result.",
    premiumAnalysisFailedCohabitation:
      "We didn't receive the cohabitation deep analysis result.",
    premiumAnalysisFailedFamily:
      "We didn't receive the family deep analysis result.",
    premiumAnalysisFailedFriendship:
      "We didn't receive the friendship deep analysis result.",
    premiumResultMissingGeneric: "We didn't receive the deep analysis result.",
    requestTimeout: "The request took too long and was stopped. Please try again.",
    premiumNetworkError: "A network issue kept the deep analysis from completing.",
    regenerateConfirm: (label: string) =>
      `Recreate the existing ${label} deep analysis with a fresh prompt?\n(This can take 1–2 minutes. The previous result stays in your analysis history.)`,
  },
  onboarding: {
    birthTitle: "Birth details",
    birthSubtitle: "We use date, time, and place for your chart.",
    birthDate: "Birth date",
    birthTime: "Birth time",
    birthPlace: "Birth place",
    timeUnknown: "I don't know the exact time",
    eyebrow: "Birth coordinates",
    dateStepTitle: "Tell us your birth date",
    timeStepTitle: "Tell us your birth time",
    dateStepSubtitle:
      "Just type the numbers — we'll auto-advance to the next field.",
    timeStepSubtitle:
      "Enter AM/PM, hour, minute, and your birthplace. (Needed for the astrology chart.)",
    dateLockReasonDefault: "Birth date is locked.",
    timeConfirmedSuffix: " — confirmed",
    placeLabel: "Birthplace",
    placeRequiredError: "Please enter your birthplace.",
    skipTimeButtonLabel: "Unknown birth time (place saved)",
    unknownTimeNoticeLabel: "Note,",
    unknownTimeNoticeBody:
      "If you don't know your birth time, we'll calculate using noon as default — your Saju hour and astrology rising sign will be approximate. Providing time and place gives more accurate results.",
    back: "← Back",
    resetSuccess: "We've reset your birth info. Please enter it again below.",
    resetFailed: "We couldn't reset that. Please try again.",
    resetting: "Resetting birth info…",
    resetConfirm: "Clear your saved birth info and start over?",
    resetCta: "Reset birth info and start over",
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
    eyebrow: "MY ACCOUNT",
    profileLabel: "Personal info",
    billingLabel: "Billing history",
    profileSubtitle: "Manage your birth info and account settings.",
    billingSubtitle: "Check your payment/subscription history.",
    loading: "Loading…",
    billingComingSoon: "The billing history screen is coming soon.",
    backToProfile: "Back to personal info",
    settingsTitle: "Account settings",
    settingsSubtitle: "This is your Clerk account info (email, password, etc.).",
    surveyChecking: "Checking survey status…",
    surveyTitle: "Survey",
    surveyCompleteBody:
      "You've completed the 10-question survey. Changing your answers may change your Blueprint scores.",
    surveyIncompleteBody: "You haven't completed the survey yet.",
    surveyRetake: "Retake the survey",
    surveyStart: "Start the survey",
    surveyViewResults: "View survey results",
    birthTitle: "Birth info",
    birthLoadingAccount: "Loading your account…",
    birthLoadingInfo: "Loading birth info…",
    birthSessionCorrectedNotice:
      "Your saved birth info didn't match our records, so we've updated it to match the server.",
    birthSaveFailed: "We couldn't save that. Please try again.",
    birthDateCorrectionUsedNotice:
      "Birth date can only be corrected once. Please contact support for further changes.",
    birthDateSavedNotice:
      "Your birth info, including birth date, has been saved. Birth date can't be changed again.",
    birthTimePlaceSavedNotice: "Birth time and place have been saved.",
    birthNoReportSubtitle:
      "Complete your blueprint to view and edit your birth info here.",
    birthGoHome: "Go home",
    birthNoDateSubtitle:
      "You don't have a birth date on file yet. Please add your birth info after the survey.",
    birthEnterInfo: "Enter birth info",
    birthEditableHintLead:
      "Birth time and place can be changed anytime. If your birth date was entered incorrectly, you can correct it ",
    birthEditableHintBold: "once",
    birthEditableHintTrail: ".",
    birthRegisteredInfo: "Registered info",
    birthDateLabel: "Birth date",
    birthTimeLabel: "Birth time",
    birthPlaceLabel: "Birthplace",
    birthCorrectionUsedHint:
      "You've already used your one-time birth date correction. Please contact support for further changes.",
    birthDateEditModeHint:
      "Fix your birth date below and save to use your one-time correction.",
    birthEditDateCta: "Edit birth date (1 correction available)",
    birthEditAllTitle: "Edit birth date, time & place",
    birthEditTimePlaceTitle: "Edit time & place",
    birthEditHint:
      "Saving will refresh your Blueprint and relationship report calculations with the new info.",
    birthCancel: "Cancel",
    birthGoToBlueprintPreview: "Go to Blueprint preview",
    birthFormSaveWithDate: "Save (with 1-time date correction)",
    birthFormSaveBirthInfo: "Save birth info",
    birthFormSaveTimeAndPlace: "Save time & place",
    birthFormDateChangeWarningLead: "Birth date can only be changed ",
    birthFormDateChangeWarningBold: "once",
    birthFormDateChangeWarningTrail:
      ". After saving, further changes require contacting support.",
    birthFormYear: "Year",
    birthFormMonth: "Month",
    birthFormDay: "Day",
    birthFormDateChangedSuffix: " — changed",
    birthFormDateIncompleteHint: "Please enter year, month, and day.",
    birthFormAmPmAria: "AM or PM",
    birthFormHourAria: "Hour",
    birthFormMinuteAria: "Minute",
    birthFormSkipTime: "Unknown birth time (save place only)",
    birthFormSaving: "Saving…",
    birthDisplayNotEntered: "Not entered",
    birthDisplayTimeUnknown: "Unknown (calculated using noon)",
    birthDisplayPlaceFallbackSuffix:
      " (default value — please update to your actual location)",
  },
  pricing: {
    title: "Pricing",
    shellNote: "Plans and checkout will be available soon.",
    metaTitle: "Pricing | Ahaitsme",
    metaDescription: "Me · Relationships · Decisions — Human Framework pricing",
    heroTitleLine1: "Me · Relationships · Decisions",
    heroTitleLine2: "Pick only what you need",
    heroBody:
      "Start for free — relationship deep dives and Decision AI open up as they become ready. Until checkout is live, you can preview the UI only.",
    popularBadge: "Popular",
    plans: {
      free: {
        name: "Starter",
        price: "Free",
        period: "",
        tagline: "Your first step to understanding yourself",
        features: [
          "v2 survey (10 questions) · Blueprint",
          "6-axis Lite analysis",
          "Basic relationship snapshot",
          "Decision helper trial",
        ],
        cta: "Get started now",
      },
      plus: {
        name: "Explorer",
        price: "₩9,900",
        period: "/mo",
        tagline: "Go deeper into your relationships",
        features: [
          "Everything in Starter",
          "Deep reports across all 5 relationship tabs",
          "Extended AI story for the romantic tab",
          "Priority analysis queue",
        ],
        cta: "Coming soon",
      },
      pro: {
        name: "Navigator",
        price: "₩19,900",
        period: "/mo",
        tagline: "Let AI walk through decisions with you",
        features: [
          "Everything in Explorer",
          "Unlimited Decision AI",
          "In-depth personal essay",
          "Team/family bundle discount",
        ],
        cta: "Coming soon",
      },
    },
  },
  faq: {
    title: "Frequently asked questions",
    body: "FAQ content is coming soon.",
  },
  contact: {
    title: "Contact us",
    body: "We're getting our contact channels ready.",
  },
  about: {
    heroEyebrow: "About",
    heroTitleLine1: "Why do we",
    heroTitleLine2: "keep running into the same kinds of problems?",
    heroBodyLine1: "We don't think it's because people are different —",
    heroBodyLine2:
      "it's because we keep meeting without really knowing each other.",
    heroBodyLine3: "So",
    heroBodyLine4: "we built this service.",
    pillarsEyebrow: "Three Pillars",
    pillarsTitle: "Me · Relationships · Decisions",
    pillarsBody:
      "Built around the Human Framework, this is a journey that starts with understanding yourself, then extends into relationships and choices.",
    pillarMeTitle: "Me",
    pillarMeSubtitle: "Blueprint",
    pillarMeDesc:
      "Read your own patterns through a 10-question survey and a 6-axis Blueprint.",
    pillarRelTitle: "Relationships",
    pillarRelSubtitle: "5 tabs",
    pillarRelDesc:
      "See the rhythm between two people through context-specific reports — romantic, colleague, family, friend, and more.",
    pillarDecisionTitle: "Decisions",
    pillarDecisionSubtitle: "Decision AI",
    pillarDecisionDesc:
      "A conversational coach for decision paralysis — coming soon, connected to your Blueprint.",
    helpQuoteLine1: "This helps you",
    helpQuoteLine2: "understand each other in your relationships.",
    helpQuoteLine3: "You don't have to force yourself to match —",
    helpQuoteLine4: "once you understand why,",
    helpQuoteLine5: "things get a lot easier.",
    understandTitle: "Here's how we understand you",
    structureOuterTitle: "Surface",
    structureOuterDesc: "The behavior that shows on the outside",
    structureInnerTitle: "Inner self",
    structureInnerDesc: "The reason behind that behavior",
    structureRelTitle: "Relationships",
    structureRelDesc: "How things flow when you meet someone",
    structureAdviceTitle: "One piece of advice",
    structureAdviceDesc: "A direction that makes things a little easier",
    availableNowTitle: "What you can use right now",
    availableNowBodyLine1: "Right now,",
    availableNowBodyLine2:
      "you can understand yourself and take a light look at your relationships",
    availableNowBodyLine3: "And this journey",
    availableNowBodyLine4: "doesn't end here",
    availableNowBodyLine5: "Personal analysis will go deeper,",
    availableNowBodyLine6: "and relationship analysis will keep expanding",
    featureFreeTitle: "Free personal analysis",
    featureFreePoint1: "Surface",
    featureFreePoint2: "Inner self",
    featureFreePoint3: "Relationships",
    featureFreePoint4: "Advice",
    featureDeepTitle: "Deep personal analysis",
    featureDeepPoint1: "Emotional flow",
    featureDeepPoint2: "Energy",
    featureDeepPoint3: "Patterns",
    featureRelTitle: "Basic relationship analysis",
    featureRelPoint1: "Two-person comparison structure",
    featureRelPoint2: "Simple text UI",
    continuousQuoteLine1: "This isn't a one-and-done analysis.",
    continuousQuoteLine2: "It's an ongoing process of building understanding.",
    roadmapRelDeep: "Deep relationship analysis",
    roadmapMultiAngle: "Multi-angle personal analysis",
    roadmapTeam: "Team relationship analysis",
    roadmapMore: "And expansion into even more relationship contexts",
    socialEyebrow: "Social",
    socialTitle: "Find us on Instagram",
    socialBody:
      "We share updates, relationship insights, and Human Framework stories.",
    socialFollowCta: "Follow @ahaitsme",
    feedComingSoon: "Feed coming soon",
    closingQuoteLine1: "First,",
    closingQuoteLine2: "start by understanding yourself",
    closingSubtitle: "Every change starts with understanding yourself.",
    closingCta: "Start free analysis →",
  },
  decision: {
    categories: {
      relationship: "Relationships",
      career: "Career",
      finance: "Finance",
      life: "Life",
      others: "Others",
    },
    dateRanges: {
      last7d: "Last 7 days",
      last30d: "Last 30 days",
      last90d: "Last 90 days",
      all: "All",
    },
    allCategoriesLabel: "All",
    ratingLabel: "Rating",
    stepLabel: (n: number) => `Step ${n}`,
    onboardingLogLabel: "LOG",
    onboardingLogDesc: "Record choice",
    onboardingReviewLabel: "REVIEW",
    onboardingReviewDesc: "Track outcome",
    onboardingAnalyzeLabel: "ANALYZE",
    onboardingAnalyzeDesc: "Decode pattern",
    journalWorkflowAria: "Decision journal workflow",
    journalTitle: "Decision Journal",
    journalSubtitle:
      "Capture choices, review outcomes, and uncover patterns over time.",
    archiveTitle: "Archive a Decision",
    archiveSubtitle: "Log the choice you're facing before the outcome unfolds.",
    categoryLabel: "Category",
    contextLabel: "Context",
    contextPlaceholder:
      "What choice are you making today? (e.g., Career pivot, Marketing budget)",
    reviewOutcomesTitle: "Review Outcomes",
    reviewOutcomesSubtitle: "Revisit past choices and rate how they turned out.",
    noReviewsYet: "📋 No decisions to review yet.",
    noReviewsYetHint: "Once you save a choice in Step 1, your review card will appear here.",
    noReviewsInCategory: "No decisions in this category yet.",
    viewAllCount: (count: number) => `View all (${count})`,
    smartInsightsTitle: "Smart Insights",
    smartInsightsSubtitle:
      "Filter your archive and surface recurring decision patterns.",
    dateRangeLabel: "Date range",
    analyzeWithAiCta: "Analyze with AI",
    aiInsightsTitle: "AI insights",
    analyzeNoResults:
      "There are no decisions matching that period and category. Try saving a decision first.",
    analyzePlaceholderResult: (count: number) =>
      `AI analysis is coming soon. ${count} record${count === 1 ? "" : "s"} selected. Pattern insights will show up here soon.`,
    backToJournal: "← Decision Journal",
    historyTitle: "Decision History",
    filterCta: "Filter",
    newCta: "New",
    statusLabel: "Status",
    statusAll: "All",
    statusNeedsReview: "Needs review",
    statusCompleted: "Completed",
    ratingAll: "All",
    ratingHigh: "High (4–5)",
    ratingLow: "Low (1–2)",
    clearFilters: "Clear filters",
    noDecisionsSaved: "No decisions saved yet.",
    logFirstDecision: "Log your first decision",
    noDecisionsMatchFilters: "No decisions match these filters.",
    loadMoreCount: "Load more (+10)",
    ratingSectionLabel: "Rating",
    reviewNoteLabel: "Review notes",
    reviewNotePlaceholder: "How did you feel about this decision?",
    reviewedOn: (date: string) => `Reviewed ${date}`,
    reviewCta: "Review",
    statusPending: "Needs review",
    statusDotReviewed: "Review complete",
    decideWithAiAria: "Decide with AI — coming soon",
    decideWithAiTitle: "Decide with AI",
    decideWithAiBadge: "Coming soon",
    decideWithAiBody:
      "A conversation partner grounded in your blueprint — for when the choice in front of you feels bigger than a pros/cons list.",
    decideWithAiTagline: "Your next decision, decoded together",
    starRatingAria: (value: number, max: number) => `${value} out of ${max} stars`,
  },
  legal: {
    backHome: "← Back home",
    eyebrow: "Legal",
    lastUpdatedPrefix: "Last updated · ",
  },
  invite: {
    invalidToken: "This invite link isn't valid.",
    inviteMessage: "A friend invited you to get relationship tips together.",
    missingTokenAlert: "No invite token was found.",
    title: "Friend invite",
    startBody:
      "Starting here creates a new report with your info and connects it to a relationship analysis with your friend.",
    startCta: "Get started",
    loadingFallback: "Loading...",
  },
  howItWorks: {
    metaTitle: "How it works — ahaitsme",
    metaDescription: "How the analysis works (coming soon)",
    eyebrow: "How it works",
    title: "How the analysis works",
    body: "This page will explain how we weave together the survey, Saju, and astrology into your interpretation. Coming soon.",
    homeCta: "Home",
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
  relationshipDrilldown: {
    romantic: {
      eyebrow: "Premium · Romantic Saju deep dive",
      gradeBadge: (grade: string) => `Compatibility grade ${grade}`,
      scoreSourceNote:
        "Calculated from Saju compatibility signals (harmony, clash, day-stem synergy, etc.) · 0–100 · separate from the 11-axis survey.",
      chemistryCardTitle: "🍀 Chemistry deep dive",
      compareCardTitleFallback: "Comparing you two",
      compareCardIntro:
        "An AI-organized comparison of your tendencies, based on both your Saju and survey data. See the differences between you and your partner at a glance.",
      comparisonAspectColumn: "Aspect",
      comparisonAspectLabels: {
        "감정 표현": "Emotional expression",
        "갈등 반응": "Conflict response",
        "애정 언어": "Love language",
        "스트레스 패턴": "Stress pattern",
        "의사결정": "Decision-making",
        "소통 방식": "Communication style",
      },
      fallbackActionTitleDefault: "Try this",
      fallbackActionTitlesA: [
        "Pause before your emotions rise",
        "Check on your partner's feelings first",
        "Talk your way back to each other",
      ],
      fallbackActionTitlesB: [
        "Don't rush to a conclusion",
        "Recognize the difference in expression styles",
        "Reconnect with a small signal",
      ],
      natureCardTitle: "📝 Each other's tendencies",
      psychMatchCardTitle: "🎯 11-axis psych match",
      psychMatchIntro:
        "An at-a-glance summary of where you're alike and where you differ right now.",
      part1Title: "📊 Part 1. A 3D diagnosis of your relationship",
      part2Title: "👥 Part 2. You and me, side by side",
      part3Title: "🔄 Part 3. Why this relationship is special",
      part4Title: "⚡ Part 4. Tuning into each other's frequency",
      part5Title: "🛠️ Part 5. Real steps that help you both",
      dynamicsCardTitle: "⚡ The balance of power",
      dynamicsBalanceLabel: "🎯 Who leads dates & contact",
      dynamicsRecoveryLabel: "🌊 Emotional recovery speed gap",
      framesCardTitle: "🌗 The hidden frame of your relationship",
      framesReassuranceLabel: "🛟 Reassurance signals",
      framesRolePlayLabel: "🎭 Unconscious role-play",
      specialCardTitle: "⚖️ Why this relationship is special",
      specialWhyLabel: "💡 Where you two are meeting in the middle",
      strengthWeaknessCardTitle: "💪 Strengths · Weaknesses",
      hiddenHeartsCardTitle: "🌙 Each other's hidden heart",
      hiddenHeartsMutualGiftLabel: "💡 Your unconscious synergy",
      hiddenHeartPanelLabel: (name: string) => `🌙 ${name}'s hidden heart`,
      conflictCardTitleFallback: "Conflict pattern",
      conflictColumnLabel: "Who",
      conflictBadLineColumn: "Before ❌ What you used to say",
      conflictGoodLineColumn: "After ✅ Try this instead",
      actionCardTitle: "🌱 Things that help each other",
      actionGuideLabel: (name: string) => `✨ Essence guide for ${name}`,
      actionDiaryLabel: "💌 Essence diary · your shared archive",
      actionStarterPrefix: "* Try opening the conversation like this: ",
      timelineCardTitle: "⏰ How this changes over time",
      shareFormulaFallback: "Our relationship",
      scoreLabelAffinity: "Affinity",
      scoreLabelChemistry: "Chemistry",
      scoreLabelSensitivity: "Sensitivity",
    },
    work: {
      eyebrow: "Premium · Office partnership",
      gradeBadge: (grade: string) => `Partnership grade ${grade}`,
      scoreLabelFit: "Work fit",
      scoreLabelSynergy: "Collaboration synergy",
      scoreLabelRisk: "Office risk",
      dnaCardTitle: "🧬 Partnership DNA — who are you at work?",
      dnaWorkStyleLabel: "🌌 The work style you pursue",
      dnaInnerStandardLabel: "🪵 Your inner standard",
      dnaCharacterLabel: "🔮 Office character",
      contributionStyleLabel: "🌱 Contribution style",
      mixFitCardTitle: "💻 How you each work & your mix fit",
      workStyleLabel: (name: string) => `[${name}'s work style]`,
      communicationFitLabel: "[Your communication fit]",
      reportingStyleFitLabel: "📝 Reporting & feedback fit",
      respectCardTitle: "🤝 A guide to mutual respect that keeps the peace",
      boundaryLabel: (name: string) => `[${name}'s territory]`,
      breakBoundaryFitLabel: "☕ Lunch & break-room boundary",
      rolesCardTitle: "🎯 Role-split cheat sheet",
      myWeaponsLabel: (name: string) => `[What ${name} should own]`,
      roleWeaponsLabel: (nickname: string) => `What ${nickname} should own`,
      handoffLabel: (nickname: string) => `What ${nickname} should hand off to their partner`,
      noHandoffNote:
        "There isn't a clear area to hand off to your partner. Better to each focus on your own strengths.",
      idealRolesCardTitle: "🏢 Roles & departments where you'd thrive",
      idealRolesLabel: "Good-fit roles",
      idealDeptsLabel: "Good-fit departments/teams",
      upsetCardTitle: "😤 How to respond when they're upset",
      upsetTitle: (nickname: string) => `When ${nickname} is upset`,
      upsetSignalLabel: "Signals",
      upsetDoLabel: "Try this",
      upsetAvoidLabel: "Avoid this",
      feedbackCushionLabel: "💬 Feedback cushion phrase",
      warningCardTitle: "⚠️ Office warnings & conflict antidotes",
      conflictTriggerLabel: "Conflict trigger",
      compareTableCardTitle: "📊 At a glance — 6 ways you compare",
      compareTableColMe: "Me",
      compareTableColPartner: "Partner",
      compareTableColMeaning: "What it means for collaboration",
      loopStrengthLabel: "Where your strengths connect",
      loopFrictionLabel: "Where misunderstandings build up",
      weeklyCheckInTitle: "Weekly 10-min check-in",
      defaultKindLabel: "Colleague · Business Partner",
      part1Title: "📊 Part 1. Where You Stand, at a Glance",
      part2Title: "👥 Part 2. How You Each Work",
      part3Title: "🔄 Part 3. Roles & the Loop You Fall Into",
      part4Title: "⚠️ Part 4. Collaboration Safeguards",
      part5Title: "💊 Part 5. Playbook for Working Together",
    },
    family: {
      gradeBadge: (grade: string) => `Family grade ${grade}`,
      scoreLabelBond: "Emotional bond",
      scoreLabelSynergy: "Growth synergy",
      scoreLabelFriction: "Discipline friction",
      dnaCardTitle: "🧬 Child DNA profile",
      dnaLayerLabel: "Innate pattern",
      dnaLayerHint: "How this child naturally learns, relates, and focuses",
      dnaCommunicationLabel: "🎨 Communication style",
      dnaHiddenSensitivityLabel: "🧠 Hidden sensitivity",
      dnaEnergyLabel: "🔋 Energy & focus style",
      dnaHiddenGeniusLabel: "🔮 Late-bloomer potential",
      destinyCardTitle: "🤝 Your destined score",
      destinyLayerLabel: "Relationship pattern",
      destinyLayerHint: "How the two of you tend to click — not this year's luck, not a fixed prophecy",
      harmonyLabel: "🍀 Harmony",
      favoritismRiskLabel: "⚖️ Favoritism risk",
      parentLensLayerLabel: "Reading for this relationship",
      parentLensLayerHint: "A supporting line based on the parent–child roles you chose",
      growthTunnelCardTitle: "⚠️ This year's growth challenge",
      growthLayerLabel: "This year's growth tunnel",
      growthLayerHint: "A time-specific challenge or transition for the current year",
      focusAreasPrefix: "Focus areas: ",
      filialRewardCardTitle: "🎯 Future family reward",
      filialLayerLabel: "Future possibility",
      filialLayerHint: "What may grow from how you relate now — a possibility, not a prediction",
      deEscalationCardTitle: "⚡ De-escalation cheat sheet",
      deEscalationLayerLabel: "Right after conflict",
      deEscalationLayerHint: "What to say and avoid when tempers rise — not a fixed personality label",
      whenAngryLabel: "When upset",
      avoidLabel: "Don't do this",
      childFallback: "Child",
      parentFallback: "Parent",
      compareTableCardTitle: "📊 At a Glance — 4 Family Axes",
      compareTableColParent: "Parent",
      compareTableColChild: "Child",
      compareTableColMeaning: "What it means for the family",
      householdRolesCardTitle: "🏠 Your roles at home",
      householdRolesSelfLabel: (name: string) => `My main family role · ${name}`,
      householdRolesPartnerLabel: (name: string) => `Their main family role · ${name}`,
      householdRolesComplementLabel: "Where the roles complement each other",
      householdRolesTensionLabel: "Where roles clash or one side carries more load",
      psychRadarCardTitle: "🎯 11-Axis Compatibility Radar",
      prescriptionCardTitle: "💊 Real-Life Action Prescription",
      prescriptionLayerLabel: "Relationship routines",
      prescriptionLayerHint: "Habits that soften repeating patterns — not a forecast",
      part2Title: "📊 Part 2. Scored, Side by Side",
      part3Title: "🧬 Part 3. Innate DNA & this year's growth",
      part4Title: "🤝 Part 4. Relationship chemistry & future possibility",
      part5Title: "💊 Part 5. Guardrails & Action Plan",
      defaultKindLabel: "Premium · Child DNA Playbook",
    },
    friendship: {
      gradeBadge: (grade: string) => `Friendship grade ${grade}`,
      scoreLabelChemistry: "Friend chemistry",
      scoreLabelBanter: "Banter",
      scoreLabelRisk: "Social risk",
      dnaCardTitle: "🧬 Social DNA profile",
      positionLabel: "🎭 Position",
      guardianCharacterLabel: "🌟 Guardian character",
      banterLabel: "🗣️ Banter",
      batteryLabel: "🔋 Social battery",
      privateSideLabel: "🍻 Their off-duty side",
      soulmateCardTitle: "🤝 Friendship frequency match",
      playMoneyCardTitle: "💸 Hangout style & money habits",
      treasurerLabel: "💰 Treasurer",
      optimalHangoutLabel: "🎪 Best hangout style",
      breakupGuideCardTitle: "⚠️ Falling-out prevention guide",
      deEscalationCardTitle: "⚡ Best-friend fight antidote",
      compareTableCardTitle: "📊 At a glance — 6 ways you compare",
      compareTableColMe: "Me",
      compareTableColPartner: "Friend",
      compareTableColMeaning: "What it means for the friendship",
      psychRadarCardTitle: "🎯 11-Axis Compatibility Radar",
      part1Title: "📊 Part 1. Your Friendship, Fully Diagnosed",
      part2Title: "👥 Part 2. Compared Side by Side (Social DNA)",
      part3Title: "🔄 Part 3. The Hidden Flow Between You",
      part4Title: "⚠️ Part 4. Guardrails for a Healthy Friendship",
      part5Title: "💊 Part 5. Your Friendship Repair Kit",
      defaultKindLabel: "Friendship · Social DNA",
    },
    cohabitation: {
      eyebrow: "Premium · Household",
      gradeBadge: (grade: string) => `Household grade ${grade}`,
      scoreLabelRomanticFit: "Romantic fit",
      scoreLabelLifeSynergy: "Life synergy",
      scoreLabelHomeRisk: "Home risk",
      dnaCardTitle: "🧬 Home-life DNA — who are you each under one roof?",
      dnaValuesLabel: "🏡 The life values you pursue",
      dnaPrivateSelfLabel: "🛏️ Who you are behind closed doors",
      dnaEnergyLabel: "🔋 Energy battery",
      dnaFamilyIdentityLabel: "🔮 Family identity",
      weatherCardTitle: "⏳ Home-risk forecast for the next 3 years",
      bedroomCardTitle: "🔞 Bedroom chemistry & attachment style",
      bedroomChemistryLabel: "🌙 Nighttime compatibility",
      bedroomMatrixLabel: "📊 Nighttime performance & tendency matrix",
      bedroomProfileTitle: (nickname: string) => `${nickname}'s nighttime profile`,
      bedroomStaminaLabel: "🔋 Stamina & staying power",
      bedroomFantasyLabel: "🔮 Fantasy & novelty",
      bedroomMannerLabel: "💖 Bedroom manners & consideration",
      bedroomFrequencyLabel: "🔥 Bedroom frequency, in one line",
      sleepPrescriptionLabel: "💡 Sleep prescription",
      attachmentStyleLabel: "❤️ Emotional attachment style",
      moneyChoresCardTitle: "💸 Money leadership & chore split",
      cfoQuestionLabel: "💰 Who should hold the wallet? ",
      choresLabel: "[Chore split] ",
      familyBoundaryCardTitle: "👪 Boundaries with family of origin & independence",
      inlawStressLabel: "⚠️ In-law stress index",
      parentingCardTitle: "👶 Parenting & education values",
      privacyCardTitle: "🤝 A guide to respecting each other's privacy",
      myPrivacyLineLabel: "[The line I don't want crossed] ",
      partnerPrivacyLineLabel: "[The line I'll guarantee for my partner] ",
      warningCardTitle: "⚠️ Home warnings & marital-fight antidotes",
      conflictTriggerLabel: "Conflict trigger",
      neglectRiskLabel: "Emotional neglect risk",
      dePrescriptionHeading: "💊 De-escalation prescriptions — one card each",
      deIntro: (myName: string, partnerName: string) =>
        `Each card is "what ${myName} or ${partnerName} should say or do when their partner is upset."`,
      deSameTypeSuffix: " You both have the same top de-escalation type.",
      deDifferentTypeSuffix: " You each de-escalate differently.",
      deSharedNoteFallback: (myName: string, partnerName: string) =>
        `${myName} and ${partnerName} share the same de-escalation type. You tend to blow up over similar things at the same time, so whoever notices first should call a timeout.`,
      deLegacyNotice: (myName: string, partnerName: string) =>
        `This report is an older version (one card). Tap "Recreate cohabitation deep analysis" to see two separate prescription cards for ${myName} and ${partnerName}.`,
      upsetGuideTitle: (nickname: string) => `When ${nickname} gets upset`,
      upsetPointLabel: "What tends to set them off",
      resolveLabel: "Try resolving it this way",
      avoidLabel: "Avoid this",
      deEscalationCardUpsetLabel: (nickname: string) => `⚡ When ${nickname} is upset`,
      deEscalationCardArrowLabel: (partnerNickname: string) =>
        `→ ${partnerNickname}'s de-escalation prescription`,
      deEscalationPsychStateLabel: (nickname: string) => `🧠 ${nickname}'s state of mind`,
      deEscalationAvoidLabel: (partnerNickname: string) =>
        `🛑 What ${partnerNickname} shouldn't do`,
      deEscalationScriptLabel: (partnerNickname: string, nickname: string) =>
        `💊 ${partnerNickname} → ${nickname} script`,
      compareTableCardTitle: "📊 At a Glance — 6 Ways You Run a Household",
      compareTableColMe: "Me",
      compareTableColPartner: "Partner",
      compareTableColMeaning: "What it means for your household",
      psychRadarCardTitle: "🎯 11-Axis Compatibility Radar",
      prescriptionCardTitle: "💊 Your Household Playbook",
      upsetSectionCardTitle: "😤 How You Each Respond When Upset",
      part1Title: "💕 Part 1. Why You Became a Household",
      part2Title: "📊 Part 2. Your Household, Fully Scored",
      part3Title: "🔞 Part 3. Bedroom Chemistry & Attachment",
      part4Title: "🏡 Part 4. Home-Life DNA & the Next 3 Years",
      part5Title: "⚡ Part 5. Your Fight-Proofing Playbook",
      defaultKindLabel: "Household · Life Partnership",
    },
    layout: {
      conflictPatternLink: "See conflict pattern",
      scoreIndexEyebrow: "Relationship Index",
      scoreIndexTitle: "Your relationship index, at a glance",
      scoreCalcAria: "How the relationship index is calculated",
      toggleOpenLabel: "What are these scores?",
      toggleClosedLabel: "Curious about these metrics? Tap to see",
      insufficientData: "Not enough data to calculate this",
      chemistryCalcAria: "How the chemistry score is calculated",
      emotionalChemistryLabel: "Emotional chemistry",
      communicationChemistryLabel: "Communication chemistry",
      radarAria: "Two-person overlay radar chart across 11 psych axes",
      tensionAxisLegend: "Tension axis",
      similarAxisLegend: "Similarity axis",
      complementaryAxisLegend: "Complementary axis",
      radarFootnote:
        "* This is reference material measured from a behavior-based survey. Take it lightly.",
      bigGapTitle: "Axes with the biggest gap",
      similarLabel: "Similar",
      gapPrefix: "Gap ",
      gapSuffix: " pts",
      higherSideSuffix: " is higher",
      tensionAxisTag: "(tension axis)",
      psychAxisLabels: {
        stimulation: "Novelty seeking",
        self_control: "Self-control",
        practicality: "Practicality",
        structure: "Planning & structure",
        empathy: "Relational empathy",
        conflict_style: "Conflict directness",
        resilience: "Resilience",
        recognition: "Need for recognition",
        energy_style: "Extroverted energy",
        thinking_style: "Analytical thinking",
        decision_style: "Careful decision-making",
      },
      actionSpeechTipLabel: "* Real-life phrase tip: ",
      noPatternYet: "There isn't a clear pattern yet.",
      defaultStrengthTitle: "What you gain from this person",
      defaultWeaknessTitle: "Where you feel weaker together",
      psychMatchCardTitle: "🎯 11-axis psych match",
      tensionAxisSuffix: " · An axis you tend to clash on",
      similarAxisSuffix: " · An axis that's comfortable because you're alike",
      complementaryAxisSuffix: " · An axis where splitting roles helps",
      prescriptionWhyLabel: "🧠❤️ Why this prescription",
      prescriptionDoLabel: "✅ Try this right now (Do)",
      prescriptionDontLabel: "🚫 Never do this (Don't)",
      prescriptionCardTitle: "💊 Real-life action prescription",
    },
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
    ownBirthDateCollisionWarning: string;
    pendingFriendCannotAnalyze: string;
    viewerReportMissing: string;
    renameSaveFailed: string;
    selectFriendFirst: string;
    analyzeCta: string;
    analyzeWithName: (name: string) => string;
    allFriendsTitle: string;
    noFriendsRegistered: string;
    sentRequestsTitle: string;
    noSentRequests: string;
    inviteWaitingTitle: string;
    inviteWaitingHintDefault: string;
    resendInvite: string;
    cancelInvite: string;
    kindPickerTitle: (partnerName: string) => string;
    kindPickerSubtitle: string;
    kindPickerSubtitlePremium: string;
    perspectiveSelectLabel: string;
    parentPerspectiveTitle: string;
    parentPerspectiveSubtitle: string;
    childPerspectiveTitle: string;
    childPerspectiveSubtitle: string;
    motherLensShort: string;
    fatherLensShort: string;
    renameTitle: string;
    renamePlaceholder: string;
    renameCharCountHint: (count: number) => string;
    allAnalysisTitle: string;
    noAnalysisRecords: string;
    loadMore: string;
    addFriendAria: string;
    addFriendShort: string;
    friendListTitle: string;
    friendListLoading: string;
    noFavoriteFriends: string;
    viewAllFriendsAria: string;
    more: string;
    renameCta: string;
    unfavorite: string;
    favorite: string;
    emptyHubAria: string;
    emptyHubBody: string;
    addFirstFriendCta: string;
    addFriendCta: string;
    selectOrAddFriendHint: string;
    recentAnalysisTitle: string;
    noAnalysisYetHint: string;
    reportRowPartnerLabel: (name: string) => string;
    reportRowAria: (name: string) => string;
    viewReportCta: string;
    navigatingToAnalysis: (partnerName: string) => string;
    badgeOutboundWaiting: string;
    badgeOutboundRelationship: string;
    badgeInboundRelationship: string;
    badgeOtherRelationship: string;
    badgeManualRelationship: string;
    premiumBadge: string;
    basicBadge: string;
    defaultTitle: (name: string) => string;
    partnerPrefix: (name: string) => string;
    premiumDoneStatus: string;
    basicDoneStatus: string;
    premiumIncompleteStatus: string;
    preparingStatus: string;
    viewCompletedReport: string;
    viewOtherKinds: string;
    viewOtherKindsFull: string;
    deleting: string;
    delete: string;
    copyLink: string;
    deleteRequestCta: string;
    resendInviteLink: string;
    shareInviteTitle: string;
    shareInviteText: string;
    shareCopiedNotice: string;
    shareFailedNotice: string;
    nativeShareUnavailable: string;
    shareToggleCta: string;
    shareViaSms: string;
    shareViaOtherApp: string;
    kindBadgeRomantic: string;
    kindBadgeWork: string;
    kindBadgeCohabitation: string;
    kindBadgeFriendship: string;
    kindBadgeFamily: string;
    analysisLevelBasic: string;
    analysisLevelPremium: string;
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
    legacyInsightSecond: {
      emotional_sensitivity: string;
      communication_style: string;
      conflict_response: string;
      energy_pattern: string;
    };
    legacyInsightDefault: string[];
    legacyActions: {
      emotional_sensitivity: string[];
      communication_style: string[];
      conflict_response: string[];
      energy_pattern: string[];
    };
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
    viewerQueryRequired: string;
    relationshipUrlInvalid: string;
    basicAnalysisFailed: string;
    premiumAnalysisFailedGeneric: string;
    premiumAnalysisFailedRomantic: string;
    premiumAnalysisFailedWork: string;
    premiumAnalysisFailedCohabitation: string;
    premiumAnalysisFailedFamily: string;
    premiumAnalysisFailedFriendship: string;
    premiumResultMissingGeneric: string;
    requestTimeout: string;
    premiumNetworkError: string;
    regenerateConfirm: (label: string) => string;
  };
  onboarding: {
    birthTitle: string;
    birthSubtitle: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    timeUnknown: string;
    eyebrow: string;
    dateStepTitle: string;
    timeStepTitle: string;
    dateStepSubtitle: string;
    timeStepSubtitle: string;
    dateLockReasonDefault: string;
    timeConfirmedSuffix: string;
    placeLabel: string;
    placeRequiredError: string;
    skipTimeButtonLabel: string;
    unknownTimeNoticeLabel: string;
    unknownTimeNoticeBody: string;
    back: string;
    resetSuccess: string;
    resetFailed: string;
    resetting: string;
    resetConfirm: string;
    resetCta: string;
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
    eyebrow: string;
    profileLabel: string;
    billingLabel: string;
    profileSubtitle: string;
    billingSubtitle: string;
    loading: string;
    billingComingSoon: string;
    backToProfile: string;
    settingsTitle: string;
    settingsSubtitle: string;
    surveyChecking: string;
    surveyTitle: string;
    surveyCompleteBody: string;
    surveyIncompleteBody: string;
    surveyRetake: string;
    surveyStart: string;
    surveyViewResults: string;
    birthTitle: string;
    birthLoadingAccount: string;
    birthLoadingInfo: string;
    birthSessionCorrectedNotice: string;
    birthSaveFailed: string;
    birthDateCorrectionUsedNotice: string;
    birthDateSavedNotice: string;
    birthTimePlaceSavedNotice: string;
    birthNoReportSubtitle: string;
    birthGoHome: string;
    birthNoDateSubtitle: string;
    birthEnterInfo: string;
    birthEditableHintLead: string;
    birthEditableHintBold: string;
    birthEditableHintTrail: string;
    birthRegisteredInfo: string;
    birthDateLabel: string;
    birthTimeLabel: string;
    birthPlaceLabel: string;
    birthCorrectionUsedHint: string;
    birthDateEditModeHint: string;
    birthEditDateCta: string;
    birthEditAllTitle: string;
    birthEditTimePlaceTitle: string;
    birthEditHint: string;
    birthCancel: string;
    birthGoToBlueprintPreview: string;
    birthFormSaveWithDate: string;
    birthFormSaveBirthInfo: string;
    birthFormSaveTimeAndPlace: string;
    birthFormDateChangeWarningLead: string;
    birthFormDateChangeWarningBold: string;
    birthFormDateChangeWarningTrail: string;
    birthFormYear: string;
    birthFormMonth: string;
    birthFormDay: string;
    birthFormDateChangedSuffix: string;
    birthFormDateIncompleteHint: string;
    birthFormAmPmAria: string;
    birthFormHourAria: string;
    birthFormMinuteAria: string;
    birthFormSkipTime: string;
    birthFormSaving: string;
    birthDisplayNotEntered: string;
    birthDisplayTimeUnknown: string;
    birthDisplayPlaceFallbackSuffix: string;
  };
  pricing: {
    title: string;
    shellNote: string;
    metaTitle: string;
    metaDescription: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroBody: string;
    popularBadge: string;
    plans: {
      free: {
        name: string;
        price: string;
        period: string;
        tagline: string;
        features: string[];
        cta: string;
      };
      plus: {
        name: string;
        price: string;
        period: string;
        tagline: string;
        features: string[];
        cta: string;
      };
      pro: {
        name: string;
        price: string;
        period: string;
        tagline: string;
        features: string[];
        cta: string;
      };
    };
  };
  faq: {
    title: string;
    body: string;
  };
  contact: {
    title: string;
    body: string;
  };
  about: {
    heroEyebrow: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroBodyLine1: string;
    heroBodyLine2: string;
    heroBodyLine3: string;
    heroBodyLine4: string;
    pillarsEyebrow: string;
    pillarsTitle: string;
    pillarsBody: string;
    pillarMeTitle: string;
    pillarMeSubtitle: string;
    pillarMeDesc: string;
    pillarRelTitle: string;
    pillarRelSubtitle: string;
    pillarRelDesc: string;
    pillarDecisionTitle: string;
    pillarDecisionSubtitle: string;
    pillarDecisionDesc: string;
    helpQuoteLine1: string;
    helpQuoteLine2: string;
    helpQuoteLine3: string;
    helpQuoteLine4: string;
    helpQuoteLine5: string;
    understandTitle: string;
    structureOuterTitle: string;
    structureOuterDesc: string;
    structureInnerTitle: string;
    structureInnerDesc: string;
    structureRelTitle: string;
    structureRelDesc: string;
    structureAdviceTitle: string;
    structureAdviceDesc: string;
    availableNowTitle: string;
    availableNowBodyLine1: string;
    availableNowBodyLine2: string;
    availableNowBodyLine3: string;
    availableNowBodyLine4: string;
    availableNowBodyLine5: string;
    availableNowBodyLine6: string;
    featureFreeTitle: string;
    featureFreePoint1: string;
    featureFreePoint2: string;
    featureFreePoint3: string;
    featureFreePoint4: string;
    featureDeepTitle: string;
    featureDeepPoint1: string;
    featureDeepPoint2: string;
    featureDeepPoint3: string;
    featureRelTitle: string;
    featureRelPoint1: string;
    featureRelPoint2: string;
    continuousQuoteLine1: string;
    continuousQuoteLine2: string;
    roadmapRelDeep: string;
    roadmapMultiAngle: string;
    roadmapTeam: string;
    roadmapMore: string;
    socialEyebrow: string;
    socialTitle: string;
    socialBody: string;
    socialFollowCta: string;
    feedComingSoon: string;
    closingQuoteLine1: string;
    closingQuoteLine2: string;
    closingSubtitle: string;
    closingCta: string;
  };
  decision: {
    categories: {
      relationship: string;
      career: string;
      finance: string;
      life: string;
      others: string;
    };
    dateRanges: {
      last7d: string;
      last30d: string;
      last90d: string;
      all: string;
    };
    allCategoriesLabel: string;
    ratingLabel: string;
    stepLabel: (n: number) => string;
    onboardingLogLabel: string;
    onboardingLogDesc: string;
    onboardingReviewLabel: string;
    onboardingReviewDesc: string;
    onboardingAnalyzeLabel: string;
    onboardingAnalyzeDesc: string;
    journalWorkflowAria: string;
    journalTitle: string;
    journalSubtitle: string;
    archiveTitle: string;
    archiveSubtitle: string;
    categoryLabel: string;
    contextLabel: string;
    contextPlaceholder: string;
    reviewOutcomesTitle: string;
    reviewOutcomesSubtitle: string;
    noReviewsYet: string;
    noReviewsYetHint: string;
    noReviewsInCategory: string;
    viewAllCount: (count: number) => string;
    smartInsightsTitle: string;
    smartInsightsSubtitle: string;
    dateRangeLabel: string;
    analyzeWithAiCta: string;
    aiInsightsTitle: string;
    analyzeNoResults: string;
    analyzePlaceholderResult: (count: number) => string;
    backToJournal: string;
    historyTitle: string;
    filterCta: string;
    newCta: string;
    statusLabel: string;
    statusAll: string;
    statusNeedsReview: string;
    statusCompleted: string;
    ratingAll: string;
    ratingHigh: string;
    ratingLow: string;
    clearFilters: string;
    noDecisionsSaved: string;
    logFirstDecision: string;
    noDecisionsMatchFilters: string;
    loadMoreCount: string;
    ratingSectionLabel: string;
    reviewNoteLabel: string;
    reviewNotePlaceholder: string;
    reviewedOn: (date: string) => string;
    reviewCta: string;
    statusPending: string;
    statusDotReviewed: string;
    decideWithAiAria: string;
    decideWithAiTitle: string;
    decideWithAiBadge: string;
    decideWithAiBody: string;
    decideWithAiTagline: string;
    starRatingAria: (value: number, max: number) => string;
  };
  legal: {
    backHome: string;
    eyebrow: string;
    lastUpdatedPrefix: string;
  };
  invite: {
    invalidToken: string;
    inviteMessage: string;
    missingTokenAlert: string;
    title: string;
    startBody: string;
    startCta: string;
    loadingFallback: string;
  };
  howItWorks: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    homeCta: string;
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
  relationshipDrilldown: {
    romantic: {
      eyebrow: string;
      gradeBadge: (grade: string) => string;
      scoreSourceNote: string;
      chemistryCardTitle: string;
      compareCardTitleFallback: string;
      compareCardIntro: string;
      comparisonAspectColumn: string;
      comparisonAspectLabels: {
        "감정 표현": string;
        "갈등 반응": string;
        "애정 언어": string;
        "스트레스 패턴": string;
        "의사결정": string;
        "소통 방식": string;
      };
      fallbackActionTitleDefault: string;
      fallbackActionTitlesA: readonly string[];
      fallbackActionTitlesB: readonly string[];
      natureCardTitle: string;
      psychMatchCardTitle: string;
      psychMatchIntro: string;
      part1Title: string;
      part2Title: string;
      part3Title: string;
      part4Title: string;
      part5Title: string;
      dynamicsCardTitle: string;
      dynamicsBalanceLabel: string;
      dynamicsRecoveryLabel: string;
      framesCardTitle: string;
      framesReassuranceLabel: string;
      framesRolePlayLabel: string;
      specialCardTitle: string;
      specialWhyLabel: string;
      strengthWeaknessCardTitle: string;
      hiddenHeartsCardTitle: string;
      hiddenHeartsMutualGiftLabel: string;
      hiddenHeartPanelLabel: (name: string) => string;
      conflictCardTitleFallback: string;
      conflictColumnLabel: string;
      conflictBadLineColumn: string;
      conflictGoodLineColumn: string;
      actionCardTitle: string;
      actionGuideLabel: (name: string) => string;
      actionDiaryLabel: string;
      actionStarterPrefix: string;
      timelineCardTitle: string;
      shareFormulaFallback: string;
      scoreLabelAffinity: string;
      scoreLabelChemistry: string;
      scoreLabelSensitivity: string;
    };
    work: {
      eyebrow: string;
      gradeBadge: (grade: string) => string;
      scoreLabelFit: string;
      scoreLabelSynergy: string;
      scoreLabelRisk: string;
      dnaCardTitle: string;
      dnaWorkStyleLabel: string;
      dnaInnerStandardLabel: string;
      dnaCharacterLabel: string;
      contributionStyleLabel: string;
      mixFitCardTitle: string;
      workStyleLabel: (name: string) => string;
      communicationFitLabel: string;
      reportingStyleFitLabel: string;
      respectCardTitle: string;
      boundaryLabel: (name: string) => string;
      breakBoundaryFitLabel: string;
      rolesCardTitle: string;
      myWeaponsLabel: (name: string) => string;
      roleWeaponsLabel: (nickname: string) => string;
      handoffLabel: (nickname: string) => string;
      noHandoffNote: string;
      idealRolesCardTitle: string;
      idealRolesLabel: string;
      idealDeptsLabel: string;
      upsetCardTitle: string;
      upsetTitle: (nickname: string) => string;
      upsetSignalLabel: string;
      upsetDoLabel: string;
      upsetAvoidLabel: string;
      feedbackCushionLabel: string;
      warningCardTitle: string;
      conflictTriggerLabel: string;
      compareTableCardTitle: string;
      compareTableColMe: string;
      compareTableColPartner: string;
      compareTableColMeaning: string;
      loopStrengthLabel: string;
      loopFrictionLabel: string;
      weeklyCheckInTitle: string;
      defaultKindLabel: string;
      part1Title: string;
      part2Title: string;
      part3Title: string;
      part4Title: string;
      part5Title: string;
    };
    family: {
      gradeBadge: (grade: string) => string;
      scoreLabelBond: string;
      scoreLabelSynergy: string;
      scoreLabelFriction: string;
      dnaCardTitle: string;
      dnaLayerLabel: string;
      dnaLayerHint: string;
      dnaCommunicationLabel: string;
      dnaHiddenSensitivityLabel: string;
      dnaEnergyLabel: string;
      dnaHiddenGeniusLabel: string;
      destinyCardTitle: string;
      destinyLayerLabel: string;
      destinyLayerHint: string;
      harmonyLabel: string;
      favoritismRiskLabel: string;
      parentLensLayerLabel: string;
      parentLensLayerHint: string;
      growthTunnelCardTitle: string;
      growthLayerLabel: string;
      growthLayerHint: string;
      focusAreasPrefix: string;
      filialRewardCardTitle: string;
      filialLayerLabel: string;
      filialLayerHint: string;
      deEscalationCardTitle: string;
      deEscalationLayerLabel: string;
      deEscalationLayerHint: string;
      whenAngryLabel: string;
      avoidLabel: string;
      childFallback: string;
      parentFallback: string;
      compareTableCardTitle: string;
      compareTableColParent: string;
      compareTableColChild: string;
      compareTableColMeaning: string;
      householdRolesCardTitle: string;
      householdRolesSelfLabel: (name: string) => string;
      householdRolesPartnerLabel: (name: string) => string;
      householdRolesComplementLabel: string;
      householdRolesTensionLabel: string;
      psychRadarCardTitle: string;
      prescriptionCardTitle: string;
      prescriptionLayerLabel: string;
      prescriptionLayerHint: string;
      part2Title: string;
      part3Title: string;
      part4Title: string;
      part5Title: string;
      defaultKindLabel: string;
    };
    friendship: {
      gradeBadge: (grade: string) => string;
      scoreLabelChemistry: string;
      scoreLabelBanter: string;
      scoreLabelRisk: string;
      dnaCardTitle: string;
      positionLabel: string;
      guardianCharacterLabel: string;
      banterLabel: string;
      batteryLabel: string;
      privateSideLabel: string;
      soulmateCardTitle: string;
      playMoneyCardTitle: string;
      treasurerLabel: string;
      optimalHangoutLabel: string;
      breakupGuideCardTitle: string;
      deEscalationCardTitle: string;
      compareTableCardTitle: string;
      compareTableColMe: string;
      compareTableColPartner: string;
      compareTableColMeaning: string;
      psychRadarCardTitle: string;
      part1Title: string;
      part2Title: string;
      part3Title: string;
      part4Title: string;
      part5Title: string;
      defaultKindLabel: string;
    };
    cohabitation: {
      eyebrow: string;
      gradeBadge: (grade: string) => string;
      scoreLabelRomanticFit: string;
      scoreLabelLifeSynergy: string;
      scoreLabelHomeRisk: string;
      dnaCardTitle: string;
      dnaValuesLabel: string;
      dnaPrivateSelfLabel: string;
      dnaEnergyLabel: string;
      dnaFamilyIdentityLabel: string;
      weatherCardTitle: string;
      bedroomCardTitle: string;
      bedroomChemistryLabel: string;
      bedroomMatrixLabel: string;
      bedroomProfileTitle: (nickname: string) => string;
      bedroomStaminaLabel: string;
      bedroomFantasyLabel: string;
      bedroomMannerLabel: string;
      bedroomFrequencyLabel: string;
      sleepPrescriptionLabel: string;
      attachmentStyleLabel: string;
      moneyChoresCardTitle: string;
      cfoQuestionLabel: string;
      choresLabel: string;
      familyBoundaryCardTitle: string;
      inlawStressLabel: string;
      parentingCardTitle: string;
      privacyCardTitle: string;
      myPrivacyLineLabel: string;
      partnerPrivacyLineLabel: string;
      warningCardTitle: string;
      conflictTriggerLabel: string;
      neglectRiskLabel: string;
      dePrescriptionHeading: string;
      deIntro: (myName: string, partnerName: string) => string;
      deSameTypeSuffix: string;
      deDifferentTypeSuffix: string;
      deSharedNoteFallback: (myName: string, partnerName: string) => string;
      deLegacyNotice: (myName: string, partnerName: string) => string;
      upsetGuideTitle: (nickname: string) => string;
      upsetPointLabel: string;
      resolveLabel: string;
      avoidLabel: string;
      deEscalationCardUpsetLabel: (nickname: string) => string;
      deEscalationCardArrowLabel: (partnerNickname: string) => string;
      deEscalationPsychStateLabel: (nickname: string) => string;
      deEscalationAvoidLabel: (partnerNickname: string) => string;
      deEscalationScriptLabel: (partnerNickname: string, nickname: string) => string;
      compareTableCardTitle: string;
      compareTableColMe: string;
      compareTableColPartner: string;
      compareTableColMeaning: string;
      psychRadarCardTitle: string;
      prescriptionCardTitle: string;
      upsetSectionCardTitle: string;
      part1Title: string;
      part2Title: string;
      part3Title: string;
      part4Title: string;
      part5Title: string;
      defaultKindLabel: string;
    };
    layout: {
      conflictPatternLink: string;
      scoreIndexEyebrow: string;
      scoreIndexTitle: string;
      scoreCalcAria: string;
      toggleOpenLabel: string;
      toggleClosedLabel: string;
      insufficientData: string;
      chemistryCalcAria: string;
      emotionalChemistryLabel: string;
      communicationChemistryLabel: string;
      radarAria: string;
      tensionAxisLegend: string;
      similarAxisLegend: string;
      complementaryAxisLegend: string;
      radarFootnote: string;
      bigGapTitle: string;
      similarLabel: string;
      gapPrefix: string;
      gapSuffix: string;
      higherSideSuffix: string;
      tensionAxisTag: string;
      psychAxisLabels: {
        stimulation: string;
        self_control: string;
        practicality: string;
        structure: string;
        empathy: string;
        conflict_style: string;
        resilience: string;
        recognition: string;
        energy_style: string;
        thinking_style: string;
        decision_style: string;
      };
      actionSpeechTipLabel: string;
      noPatternYet: string;
      defaultStrengthTitle: string;
      defaultWeaknessTitle: string;
      psychMatchCardTitle: string;
      tensionAxisSuffix: string;
      similarAxisSuffix: string;
      complementaryAxisSuffix: string;
      prescriptionWhyLabel: string;
      prescriptionDoLabel: string;
      prescriptionDontLabel: string;
      prescriptionCardTitle: string;
    };
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

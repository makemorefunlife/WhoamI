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
    inviteCancelConfirm: "Cancel this invite? They won't be able to use this link anymore.",
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
    removeFriendTitle: "Remove friend",
    removeFriendConfirm: (name: string) =>
      `Remove your relationship with ${name}? Their manually added profile will be deleted too.`,
    removeFriendCta: "Remove friend",
    removeFriendFailed: "Couldn't remove this friend.",
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
      `What analysis would you like for ${partnerName}?`,
    kindPickerSubtitle:
      "Basic analysis is free. Deep analysis changes with the relationship type.",
    kindPickerSubtitlePremium:
      "The deep analysis changes based on the relationship you pick.",
    kindPickerSectionBasic: "Basic",
    kindPickerSectionPremium: "Deep",
    kindPickerBasicFree: "Basic analysis (free)",
    kindPickerFamily: "Family (parent–child)",
    kindPickerRomantic: "Romantic",
    kindPickerFriendship: "Friends",
    kindPickerWork: "Colleague",
    kindPickerCohabitation: "Couple (cohabiting)",
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
    friendListTitle: "My People",
    friendListSubtitle: "Who are you curious about?",
    friendListLoading: "Loading your friends…",
    selectFriendBelowListHint: "Select a friend to analyze your relationship with.",
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
    recentAnalysisTitle: "Recent Relationship Analyses",
    recentAnalysisSubtitle: "Pick up where you left off.",
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
      "If birth time and location are unknown, your chart is calculated using 12:00 PM (Eastern Time / New York, NY) as the default reference.",
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
    currentStateAxisSummaryTitle: "Understanding your current profile",
    overallSummary: "Overall summary",
    currentStateSubtitle: "Survey-based",
    essenceBlueprintTitle: "Essence blueprint",
    essenceBlueprintSubtitle: "Birth-chart based",
    guestOpenAnalysisHint: "Sign in to unlock your free detailed analysis.",
    openAnalysisHint: "Tap a free analysis above to open your report below.",
    comingSoon: "Coming soon",
    moreAnalysisTitle: "Discover more facets of you",
    moreAnalysisBody:
      "New personal analyses across work, relationships, emotions, and decisions will be added sequentially.",
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
    continuationTitle: "What's next?",
    exploreAnotherLensCta: "Explore another side of this relationship",
    exploreAnotherPersonCta: "Explore another relationship",
    addSomeoneNewCta: "Add someone new",
    recipientContinuationTitle: "Curious about your own relationships?",
    viewMyMapCta: "View my Relationship Map",
    chooseKindHint:
      "Use the tabs above to pick a relationship type for deep analysis.",
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
    settingsSubtitle:
      "Manage email, password, security, and delete your account (Delete Account) here.",
    deleteAccountHint:
      "To permanently delete your account, open Account settings below and use Delete Account.",
    profileMenuLabel: "My account / Delete account",
    deleteAccountButton: "Delete account",
    deleteAccountConfirmTitle: "Are you sure you want to delete your account?",
    deleteAccountConfirmBody:
      "This action is permanent. Your account and related data will be deleted.",
    deleteAccountCancel: "Cancel",
    deleteAccountConfirm: "Yes, delete my account",
    deleteAccountDeleting: "Deleting account…",
    deleteAccountError:
      "We couldn't complete account deletion. Please try again.",
    deleteAccountFarewell:
      "We're sorry to see you go. We hope this helped you understand yourself a little better, and we'd love to see you again someday!",
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
    displayNameTitle: "Display name",
    displayNameSubtitle: "This is the name shown in your reports and throughout the app.",
    displayNamePlaceholder: "e.g. Sera",
    displayNameSave: "Save",
    displayNameSaving: "Saving…",
    displayNameSaved: "Display name saved.",
    displayNameSaveFailed: "Couldn't save your display name. Please try again.",
    displayNameRequired: "Please enter a name.",
    displayNameLoading: "Loading…",
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
    metaTitle: "Pricing | Aha It's me!",
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
    body: "Answers to the questions we hear most often.",
    metaTitle: "FAQ | Aha It's me!",
    metaDescription: "Answers to common questions about Aha It's me! — pricing, privacy, refunds, and how the analysis works.",
    items: [
      {
        question: "What is Aha It's me!?",
        answer:
          "Aha It's me! helps you understand your own patterns, your relationships, and the choices you make. It starts with a short survey and your birth details, then builds a personal Blueprint and relationship reports you can use with the people around you.",
      },
      {
        question: "How does the analysis work?",
        answer:
          "You complete a 10-question survey and provide your birth date (and time and place, if known). We combine that with pattern analysis to build a 6-axis Blueprint — a picture of your innate tendencies versus how you actually show up day to day.",
      },
      {
        question: "Do I need to know my exact birth time?",
        answer:
          "No. If you don't know your birth time, we calculate your analysis using noon as a default — you can still get a full Blueprint.",
      },
      {
        question: "Can I change my birth date after I've entered it?",
        answer:
          "Yes, once. Your birth date can be corrected a single time from your account settings; after that, further changes require contacting support.",
      },
      {
        question: "Is the Starter plan really free?",
        answer:
          "Yes. The Starter plan — the 10-question survey, a 6-axis Lite Blueprint, a basic relationship snapshot, and a Decision helper trial — is free to use right now. The Explorer and Navigator plans shown on our Pricing page are coming soon.",
      },
      {
        question: "What data do you collect, and is it safe?",
        answer:
          "We collect your account info, the birth details you provide (for yourself and, if applicable, for people you analyze relationships with), and standard usage data like IP address and device info. Payment is handled by Paddle — we don't store your full card details. See our Privacy Policy for the complete list.",
      },
      {
        question: "What's your refund policy?",
        answer:
          "You can get a full refund within 7 days of purchase if you haven't yet generated or viewed any AI report. Once a report has been generated, it's considered delivered and generally isn't refundable under applicable e-commerce law. See our Refund Policy for details.",
      },
      {
        question: "How do I get in touch, or request something like data deletion?",
        answer:
          "Email us at hong@ahaitsme.com. California residents can also submit a “Do Not Sell My Personal Information” request from our Do Not Sell page.",
      },
    ],
  },
  contact: {
    title: "Contact us",
    body: "Have a question, feedback, or a request about your account or data? Reach us directly — we read every message.",
    metaTitle: "Contact | Aha It's me!",
    metaDescription: "Get in touch with the Aha It's me! team by email or Instagram.",
    emailLabel: "Email",
    instagramLabel: "Instagram",
    faqPrompt: "Looking for something specific?",
    faqLinkLabel: "Check our FAQ",
  },
  about: {
    metaTitle: "About | Aha It's me!",
    metaDescription:
      "Why Aha It's me! exists — a journey to understand yourself, your relationships, and your decisions.",
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
    metaTitle: "How it works — Aha It's me!",
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
    birthPlacePlaceholder: "e.g., Los Angeles, CA or New York, NY",
    birthPlaceSkip: "Skip · Unknown birth place",
    birthDefaultNotice:
      "If birth time and location are unknown, your chart is calculated using 12:00 PM (Eastern Time / New York, NY) as the default reference.",
    calendarTypeLabel: "Solar / Lunar",
    calendarTypeSolar: "Solar",
    calendarTypeLunar: "Lunar",
    surveyTitle: "Friend survey (10 questions)",
    surveyModeAnswer: "Take survey",
    surveyModeSkip: "Skip",
    surveySkippedNote: "Skip the survey — analysis will use a neutral profile.",
    createRelationship: "Create relationship",
  },
  landing: {
    // Hero h1 removed from the page (kept here only so the shared Messages
    // type/other locales don't need a special-cased optional field).
    heroTitle: "Don't misunderstand yourself.",
    heroSubtitle: "The more you understand, the more your relationships can change.",
    heroSubtitleLine1: "When you understand where you and the other person gain energy and why you clash,",
    heroSubtitleLine2: "you can choose the method that fits perfectly instead of forcing effort.",
    heroHook:
      "Aha It's me! reads unique patterns to reduce friction, amplify strengths, and help you make choices that are true to yourself at crucial moments.",
    heroBody1:
      "When you see yourself and others more clearly, you can respond in ways that work better for both of you.",
    heroBody2:
      "Aha It's me! reads unique patterns to reduce friction, amplify strengths, and help you make choices that are true to yourself at crucial moments.",
    heroCtaText: "Get Started",
    philosophyEyebrow: "BRAND PHILOSOPHY",
    philosophyHeadline: "Finding what works for you,\nrather than changing who you are.",
    philosophySubheadline:
      "When you know each other's strengths,\nrelationships and choices become much easier.",
    philosophyPoint1:
      "Were you trying too hard on your own,\ntaking responsibility for things the other person could do well?",
    philosophyPoint1Highlight: "trying too hard on your own",
    philosophyPoint2:
      "Even after trying hard to adapt for the relationship,\nwhy wasn't your true heart communicated clearly?",
    philosophyPoint2Highlight: "why wasn't your true heart communicated clearly?",
    philosophyPoint3:
      "If you could express your thoughts and feelings a little more accurately,\ncould you have held onto more valuable relationships and opportunities?",
    philosophyPoint3Highlight: "relationships and opportunities",
    philosophySolution:
      "The issue wasn't that you didn't try hard enough,\nbut that you didn't yet know the way that works for both of you.",
    philosophyConclusion:
      "The issue wasn't that you didn't try hard enough,\nbut that you didn't yet know the way that works for both of you.",
    philosophyBridge:
      "First, you need to know exactly who you are.\nComparing your natural way with your current habits,\nyou begin to see why some things come naturally and others feel uniquely exhausting.",
    personalEyebrow: "PERSONAL ANALYSIS",
    personalHeadline: "Have you been fighting with yourself?",
    personalInnateEyebrow: "INNATE",
    personalInnateTitle: "Innate Self",
    personalInnateDescLine1: "Your inherent blueprint",
    personalInnateDescLine2: "Your natural baseline",
    personalInnateDesc: "Your inherent blueprint\nYour natural baseline",
    personalCurrentEyebrow: "CURRENT",
    personalCurrentTitle: "Current Self",
    personalCurrentDescLine1: "Built through relationships & experiences",
    personalCurrentDescLine2: "The way you actually operate right now",
    personalRealizedTitle: "Current Self",
    personalRealizedDesc:
      "Built through relationships & experiences\nThe way you actually operate right now",
    personalGapLabel: "GAP · The Divide Between Two Selves",
    personalGapQuote:
      "“The greater the difference between your innate nature and current mode, the more exhausting it feels even when doing well.”",
    personalGapBodyLine1:
      "The greater the difference between your innate nature and current mode,\nthe more exhausting it feels even when doing well.",
    personalGapBodyLine2:
      "Aha It's me! reveals that difference—\nnot to tell you what to change,\nbut where you can ease off your energy.",
    personalGapBodyLine2Highlight: "where you can ease off your energy.",
    radarLabels: {
      structure: "Structure",
      connection: "Connection",
      stability: "Stability",
      growth: "Growth",
      adaptability: "Adaptability",
      autonomy: "Autonomy",
    },
    relBridgeEyebrow: "FROM ME TO US",
    relBridgeHeadline: "Once you understand yourself,\nyou begin to see the other person differently.",
    relBridgeSupporting: "Even in the same situation,\nyou and the other person can feel and react differently.",
    relBridgePersonA: "My Mode (ME)",
    relBridgePersonB: "Their Mode (YOU)",
    relBridgeSampleBadge: "Sample Demo Data",
    relBridgeStatement: "The more you understand the other person,\nthe more you see in your relationship.",
    relBridgeStatementSupporting:
      "When you know each other's strengths and friction points,\nyou don't have to force yourself to adapt—\nyou can find a better way that truly fits.",
    relBridgeHighlight: "find a better way that truly fits",
    personalCta: "See My Personal Analysis",
    reportsHeadline: "A clear guide tailored to the relationship in front of you",
    reportsCtaLabel: "View report",
    reportsLoverTitle: "Lovers",
    reportsLoverDesc:
      "Understand each other's core differences and step into deeper intimacy.",
    reportsCoupleTitle: "Couples",
    reportsCoupleDesc:
      "Untangle the source of everyday friction and find practical common ground.",
    reportsFamilyTitle: "Parent & Child",
    reportsFamilyDesc:
      "A communication guide that respects the innate nature of both parent and child.",
    reportsColleagueTitle: "Colleagues",
    reportsColleagueDesc:
      "The optimal collaboration strategy, built on an analysis of workplace behavior patterns.",
    reportsFriendTitle: "Friends",
    reportsFriendDesc:
      "The right distance, and the warmth that lets you both shine.",
    reportsStartTitle: "Get Started",
    reportsStartDesc: "Pick a relationship, and lay both of your natures side by side.",
    reportsStartCta: "Start Relationship Analysis",
    frameworkEyebrow: "PRINCIPLES",
    frameworkHeadline: "Understand yourself, read your relationships,\nand make choices that are true to you",
    frameworkStep1Title: "Discover Your Inherent Self",
    frameworkStep1Desc: "Understand the sources of your internal comfort and friction.",
    frameworkStep1Tag: "Self Discovery",
    frameworkStep2Title: "Embrace Differences",
    frameworkStep2Desc: "Understand each other's ways without forcing change.",
    frameworkStep2Tag: "Understanding Others",
    frameworkStep3Title: "Find the Optimal Path",
    frameworkStep3Desc: "Choose tailored communication instead of exhausting conflicts.",
    frameworkStep3Tag: "Optimal Choice",
    frameworkStep4Title: "Grow Together Through Reflection",
    frameworkStep4Desc: "Reflect on daily choices to build deeper understanding.",
    frameworkStep4Tag: "Continuous Growth",
    journalEyebrow: "DECISION JOURNAL",
    journalHeadline: "As your choices accumulate,\nyou come to know yourself better.",
    journalBody:
      "Log your important choices and feelings in the moment, then review the outcomes.\nAha It's me! reads those records together to help you discover the decision pattern that works best for you.",
    journalCta: "Start Decision Journal",
    journalClosing: "Today's choice becomes the data to understand tomorrow's self.",
    footerPhilosophy: "Don't misunderstand yourself—\nunderstand yourself.",
    footerDesc: "Using scientific data to build a better perspective for understanding yourself and your relationships.",
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
    viewSentRequests: "View sent requests",
    personalLinkHeading: "My friend invite link",
    personalLinkLoading: "Loading your link…",
    resetLink: "Reset my link",
    resetLinkConfirm: "Reset your link? The old link will stop working.",
    resetLinkDone: "Your new link is ready.",
    resetLinkFailed: "We couldn't reset your link. Please try again.",
    personalLinkLoadFailed: "We couldn't load your link. Please try again.",
  },
  footer: {
    support: "Support",
    legal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
    copyrightSuffix: "All rights reserved.",
    business: {
      companyLabel: "Company",
      companyName: "Ahaitsme",
      ceoLabel: "CEO",
      ceoName: "Hong Seonghyeon",
      bizNumberLabel: "Business registration no.",
      bizNumber: "387-06-03769",
      mailOrderLabel: "Mail-order registration no.",
      mailOrderNumber: "[통신판매업 번호]",
      addressLabel: "Address",
      address: "Yongsan-gu, Seoul (detailed address TBD)",
      phoneLabel: "Phone",
      phone: "02-1234-5678",
      emailLabel: "Email",
      email: "hong@ahaitsme.com",
    },
  },
  legalConsent: {
    ageLabel: "I confirm that I am at least 13 years of age (required)",
    termsPrefix: "I agree to the ",
    termsLink: "Terms of Service",
    termsMiddle: " and ",
    privacyLink: "Privacy Policy",
    termsSuffix: " (required)",
    gateHint: "Please check both boxes above to continue with sign-up.",
    pageTitle: "Age & terms confirmation",
    pageSubtitle:
      "Before using Aha It's me, please confirm your age and accept our terms.",
    submit: "Agree and continue",
    saving: "Saving…",
    loading: "Loading…",
    saveError: "Could not save your consent. Please try again.",
    marketingLabel: "(Optional) I agree to receive marketing and event updates",
    marketingLabelOptional: "(Optional) I agree to receive marketing emails",
    byContinuingPrefix: "By continuing, you agree to our",
    byContinuingMiddle: "and",
    byContinuingSuffix: ".",
  },
  aiDisclaimer:
    "This analysis is AI-generated and provided for entertainment and informational purposes only. We assume no liability for any decisions made based on this report.",
  cookieBanner: {
    ariaLabel: "Cookie consent",
    message: "We use cookies to provide a smooth service experience.",
    accept: "Accept",
    reject: "Decline",
    doNotSell: "Do Not Sell My Personal Information",
  },
  doNotSellPage: {
    title: "Do Not Sell My Personal Information",
    body: "Under the California Consumer Privacy Act (CCPA), you may request that we do not sell or share your personal information. Email us with the subject “Do Not Sell” and we will process your request.",
    emailLabel: "Contact",
    metaTitle: "Do Not Sell My Personal Information | Aha It's me!",
    metaDescription:
      "Submit a CCPA request to opt out of the sale or sharing of your personal information.",
  },
  paymentRefund: {
    checkboxLabel:
      "I agree that due to the nature of digital goods (AI Saju results), refunds are not available after results have been generated. (required)",
    requiredHint: "Please check the refund notice before continuing to payment.",
    processing: "Starting checkout…",
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
      "If birth time and location are unknown, your chart is calculated using 12:00 PM (Eastern Time / New York, NY) as the default reference.",
    placeNeededHint:
      "Needed for the astrology chart. Saju (essence) doesn't depend on location.",
    enterPlaceManually: "Enter place manually",
    skipPlace: "Skip place",
    placePlaceholder: "e.g., Los Angeles, CA or New York, NY",
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
      dnaCardTitle: "Partnership DNA — who are you at work?",
      dnaWorkStyleLabel: "The work style you pursue",
      dnaInnerStandardLabel: "Your inner standard",
      dnaCharacterLabel: "Office character",
      contributionStyleLabel: "Contribution style",
      mixFitCardTitle: "How you each work & your mix fit",
      workStyleLabel: (name: string) => `[${name}'s work style]`,
      communicationFitLabel: "[Your communication fit]",
      reportingStyleFitLabel: "Reporting & feedback fit",
      respectCardTitle: "A guide to mutual respect that keeps the peace",
      boundaryLabel: (name: string) => `[${name}'s territory]`,
      breakBoundaryFitLabel: "Lunch & recharge boundary",
      rolesCardTitle: "Role-split cheat sheet",
      myWeaponsLabel: (name: string) => `[What ${name} should own]`,
      roleWeaponsLabel: (nickname: string) => `What ${nickname} should own`,
      handoffLabel: (nickname: string) => `What ${nickname} should hand off to their partner`,
      noHandoffNote:
        "There isn't a clear area to hand off to your partner. Better to each focus on your own strengths.",
      idealRolesCardTitle: "Roles & departments where you'd thrive",
      idealRolesLabel: "Good-fit roles",
      idealDeptsLabel: "Good-fit departments/teams",
      upsetCardTitle: "How to respond when work stress builds up",
      upsetTitle: (nickname: string) => `When ${nickname} is under work stress`,
      upsetSignalLabel: "Signals",
      upsetDoLabel: "Try this",
      upsetAvoidLabel: "Avoid this",
      feedbackCushionLabel: "Feedback cushion phrase",
      warningCardTitle: "Office warnings & conflict antidotes",
      conflictTriggerLabel: "Conflict trigger",
      compareTableCardTitle: "At a glance — 6 ways you compare",
      compareTableColMe: "Me",
      compareTableColPartner: "Partner",
      compareTableColMeaning: "What it means for collaboration",
      loopStrengthLabel: "Where your strengths connect",
      loopFrictionLabel: "Where misunderstandings build up",
      weeklyCheckInTitle: "Weekly 10-min check-in",
      deepReadVoiceMeLabel: "From my perspective",
      deepReadVoicePartnerLabel: "From their perspective",
      deepReadPatternLabel: "Where instincts diverge",
      deepReadAdviceMeLabel: "Advice for me",
      deepReadAdvicePartnerLabel: "Advice for my colleague",
      deepReadTogetherLabel: "Things to try together",
      defaultKindLabel: "Colleague · Business Partner",
      part1Title: "Part 1. Where You Stand, at a Glance",
      part2Title: "Part 2. How You Each Work",
      part3Title: "Part 3. Roles & the Loop You Fall Into",
      part4Title: "Part 4. Collaboration Safeguards",
      part5Title: "Part 5. Playbook for Working Together",
    },
    family: {
      gradeBadge: (grade: string) => `Family grade ${grade}`,
      scoreLabelBond: "Emotional bond",
      scoreLabelSynergy: "Growth synergy",
      scoreLabelFriction: "Discipline friction",
      relationshipIndexCardTitle: "Discipline Friction Index",
      relationshipIndexSafeDistanceLabel: "Safe distance",
      talentStudyTypeLabel: "Study type",
      talentWealthVesselLabel: "Vessel for success",
      dnaCardTitle: "Child DNA profile",
      dnaLayerLabel: "Innate pattern",
      dnaLayerHint: "How this child naturally learns, relates, and focuses",
      dnaCommunicationLabel: "Communication style",
      dnaHiddenSensitivityLabel: "Hidden sensitivity",
      dnaEnergyLabel: "Energy & focus style",
      dnaHiddenGeniusLabel: "Late-bloomer potential",
      destinyCardTitle: "Your destined score",
      destinyLayerLabel: "Relationship pattern",
      destinyLayerHint: "How the two of you tend to click — not this year's luck, not a fixed prophecy",
      harmonyLabel: "Harmony",
      favoritismRiskLabel: "Favoritism risk",
      parentLensLayerLabel: "Reading for this relationship",
      parentLensLayerHint: "A supporting line based on the parent–child roles you chose",
      growthTunnelCardTitle: "This year's growth challenge",
      growthLayerLabel: "This year's growth tunnel",
      growthLayerHint: "A time-specific challenge or transition for the current year",
      familyRoleCardTitle: "What role your child carries at home",
      familyRoleDescriptionLabel: "What helps, from a parent",
      filialFrequencyCardTitle: "Your parent's filial frequency",
      focusAreasPrefix: "Focus areas: ",
      filialRewardCardTitle: "Future family reward",
      filialLayerLabel: "Future possibility",
      filialLayerHint: "What may grow from how you relate now — a possibility, not a prediction",
      deEscalationCardTitle: "De-escalation cheat sheet",
      deEscalationLayerLabel: "Right after conflict",
      deEscalationLayerHint: "What to say and avoid when tempers rise — not a fixed personality label",
      whenAngryLabel: "When upset",
      avoidLabel: "Don't do this",
      contactWaitLabel: "Contact wait time",
      childFallback: "Child",
      parentFallback: "Parent",
      compareTableCardTitle: "At a Glance — 4 Family Axes",
      compareTableColParent: "Parent",
      compareTableColChild: "Child",
      compareTableColMeaning: "What it means for the family",
      householdRolesCardTitle: "Your roles at home",
      householdRolesSelfLabel: (name: string) => `My main family role · ${name}`,
      householdRolesPartnerLabel: (name: string) => `Their main family role · ${name}`,
      householdRolesComplementLabel: "Where the roles complement each other",
      householdRolesTensionLabel: "Where roles clash or one side carries more load",
      psychRadarCardTitle: "11-Axis Compatibility Radar",
      deepReadCardTitle: "Deep Read — Beyond the Saju Chart",
      deepReadVoiceParentLabel: "From the parent's perspective",
      deepReadVoiceChildLabel: "From the child's perspective",
      deepReadPatternLabel: "Where instincts diverge",
      deepReadAdviceParentLabel: "Advice for the parent",
      deepReadAdviceChildLabel: "Advice for the child",
      deepReadTogetherLabel: "Things to try together",
      prescriptionCardTitle: "Real-Life Action Prescription",
      prescriptionLayerLabel: "Relationship routines",
      prescriptionLayerHint: "Habits that soften repeating patterns — not a forecast",
      part2Title: "Part 2. Scored, Side by Side",
      part3Title: "Part 3. Innate DNA & this year's growth",
      part4Title: "Part 4. Relationship chemistry & future possibility",
      part5Title: "Part 5. Guardrails & Action Plan",
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
      hiddenFlowCardTitle: "🔄 The hidden flow of your friendship",
      travelStyleLabel: "✈️ Travel & itinerary friction",
      travelPlannerLabel: "The spreadsheet planner",
      travelFlexibleLabel: "The go-with-the-flow healer",
      counselingStyleLabel: "🍃 Counseling style",
      breakupGuideCardTitle: "⚠️ Falling-out prevention guide",
      deEscalationCardTitle: "⚡ Best-friend fight antidote",
      compareTableCardTitle: "📊 At a glance — 6 ways you compare",
      compareTableColMe: "Me",
      compareTableColPartner: "Friend",
      compareTableColMeaning: "What it means for the friendship",
      psychRadarCardTitle: "🎯 11-Axis Compatibility Radar",
      deepReadCardTitle: "🔍 Deep Read — Beyond the Numbers",
      deepReadVoiceMeLabel: "From my perspective",
      deepReadVoicePartnerLabel: "From their perspective",
      deepReadPatternLabel: "Where instincts diverge",
      deepReadAdviceMeLabel: "Advice for me",
      deepReadAdvicePartnerLabel: "Advice for my friend",
      deepReadTogetherLabel: "Things to try together",
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
      dnaCardTitle: "Home-life DNA — who are you each under one roof?",
      dnaValuesLabel: "The life values you pursue",
      dnaPrivateSelfLabel: "Who you are behind closed doors",
      dnaEnergyLabel: "Energy battery",
      dnaEnergyAxisNoteLabel: "11-axis check",
      dnaFamilyIdentityLabel: "Family identity",
      weatherCardTitle: "Home-risk forecast for the next 3 years",
      bedroomCardTitle: "Bedroom chemistry & attachment style",
      bedroomChemistryLabel: "Nighttime compatibility",
      bedroomMatrixLabel: "Nighttime performance & tendency matrix",
      bedroomProfileTitle: (nickname: string) => `${nickname}'s nighttime profile`,
      bedroomStaminaLabel: "Stamina & staying power",
      bedroomStaminaPrecisionNoteLabel: "A closer chart check",
      bedroomFantasyLabel: "Fantasy & novelty",
      bedroomMannerLabel: "Bedroom manners & consideration",
      bedroomFrequencyLabel: "Bedroom frequency, in one line",
      sleepPrescriptionLabel: "Sleep prescription",
      attachmentStyleLabel: "Emotional attachment style",
      rejectionScriptLabel: (nickname: string) => `Declining ${nickname} without hurting them`,
      rejectionAxisNoteLabel: "11-axis check",
      moneyChoresCardTitle: "Money leadership & chore split",
      coupleActionPlanCardTitle: "Suggestions Made for Us",
      coupleActionPlanForMeLabel: "For Me",
      coupleActionPlanForPartnerLabel: "For My Partner",
      coupleActionPlanTogetherLabel: "Something to Try Together",
      cfoQuestionLabel: "Who should hold the wallet? ",
      choresLabel: "[Chore split] ",
      spendingStyleLabel: "Spending style",
      cfoAxisNoteLabel: "11-axis check",
      familyBoundaryCardTitle: "Boundaries with family of origin & independence",
      inlawStressLabel: "In-law stress index",
      parentingCardTitle: "Parenting & education values",
      parentingRoleNoteLabel: "Parenting role check",
      privacyCardTitle: "A guide to respecting each other's privacy",
      myPrivacyLineLabel: "[The line I don't want crossed] ",
      partnerPrivacyLineLabel: "[The line I'll guarantee for my partner] ",
      warningCardTitle: "Home warnings & marital-fight antidotes",
      conflictTriggerLabel: "Conflict trigger",
      neglectRiskLabel: "Emotional neglect risk",
      coldWarGoldenTimeLabel: "Cold-war golden time",
      reconciliationCueLabel: "Reconciliation cheat code",
      dePrescriptionHeading: "De-escalation prescriptions — one card each",
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
      deEscalationCardUpsetLabel: (nickname: string) => `When ${nickname} is upset`,
      deEscalationCardArrowLabel: (partnerNickname: string) =>
        `→ ${partnerNickname}'s de-escalation prescription`,
      deEscalationPsychStateLabel: (nickname: string) => `${nickname}'s state of mind`,
      deEscalationAvoidLabel: (partnerNickname: string) =>
        `What ${partnerNickname} shouldn't do`,
      deEscalationScriptLabel: (partnerNickname: string, nickname: string) =>
        `${partnerNickname} → ${nickname} script`,
      compareTableCardTitle: "Side-by-Side Comparison",
      compareTableColMe: "Me",
      compareTableColPartner: "Partner",
      compareTableColMeaning: "What it means for your household",
      psychRadarCardTitle: "11-Axis Compatibility Radar",
      prescriptionCardTitle: "Your Household Playbook",
      upsetSectionCardTitle: "How You Each Respond When Upset",
      originStoryCardTitle: "Why You Two, of All People",
      originStoryWhyUsLabel: "Why you were drawn together",
      originStoryPositiveChangeLabel: (nickname: string) => `What ${nickname} gains from this`,
      dailyLifeMirrorCardTitle: "A Glimpse of Your Everyday Life",
      dailyLifeMirrorCharmLabel: (nickname: string) => `${nickname}'s natural charm`,
      dailyLifeMirrorSpouseTraitLabel: (nickname: string) => `The spouse ${nickname} sees`,
      dailyLifeMirrorAuthorityLabel: (nickname: string) => `${nickname}'s style after marriage`,
      deepReadCardTitle: "Deep Read — Reading Between the Lines",
      deepReadVoiceMeLabel: "From my perspective",
      deepReadVoicePartnerLabel: "From their perspective",
      deepReadPatternLabel: "Where instincts diverge",
      deepReadAdviceMeLabel: "Advice for me",
      deepReadAdvicePartnerLabel: "Advice for my partner",
      deepReadTogetherLabel: "Things to try together",
      part1Title: "Part 1. Why You Became a Household",
      part2Title: "Part 2. Your Household, Fully Scored",
      part3Title: "Part 3. Bedroom Chemistry & Attachment",
      part4Title: "Part 4. Home-Life DNA & the Next 3 Years",
      part5Title: "Part 5. Your Fight-Proofing Playbook",
      defaultKindLabel: "Household · Life Partnership",
    },
    layout: {
      conflictPatternLink: "See conflict pattern",
      scoreIndexEyebrow: "Relationship Index",
      scoreIndexTitle: "Your relationship index, at a glance",
      scoreCalcAria: "How the relationship index is calculated",
      toggleOpenLabel: "Hide details",
      toggleClosedLabel: "See each metric in detail",
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
        structure: "Planning",
        empathy: "Relational empathy",
        conflict_style: "Conflict coping",
        resilience: "Relationship resilience",
        recognition: "Need for recognition",
        energy_style: "Extraversion",
        thinking_style: "Analytical thinking",
        decision_style: "Prudence",
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
    structuredDesignFallbackTitle: "Couldn't load the structured report design",
    structuredDesignFallbackBody:
      "Showing the plain-text version for now. Regenerate to restore the Part 01–05 layout.",
  },
  relationshipMap: {
    title: "My Relationship Map",
    subtitle: "What kinds of people show up most around me?",
    meLabel: "Me",
    emptyTitle: "Invite people and watch your Relationship Map come to life.",
    emptyCta: "Invite someone",
    inviteCtaTitle: "Invite someone",
    inviteCtaSubtitle: "Create invite link",
    addFriendMapCta: "Add friend",
    dayMasterDisclaimer: "Based on Day Masters",
    forMeLabel: "For me:",
    exploreRelationshipCta: "Explore this relationship",
    peopleMoreCount: (n: number) => `+${n} more`,
    ariaRolePlanet: (roleLabel: string, countLabel: string) =>
      `${roleLabel}, ${countLabel}`,
    personCount: (n: number) => (n === 1 ? "1 person" : `${n} people`),
    roleDirectoryLabel: (roleLabel: string) => `People in ${roleLabel}`,
    showMoreCta: (n: number) => (n === 1 ? "Show 1 more" : `Show ${n} more`),
    reportShare: {
      sectionTitle: "Want to share this analysis?",
      prompt: (name: string) => `You can share this relationship report with ${name}.`,
      explain: (name: string) =>
        `If you share it, ${name} will be able to open and read the report.`,
      shareButton: (name: string) => `Share with ${name}`,
      reassurance:
        "This report stays private unless you choose to share it.\nThey won't be notified unless you share it.",
      linkReadyTitle: "Your share link is ready.",
      stopSharingCta: "Stop sharing",
      stopSharingConfirm:
        "Stop sharing this report? They will no longer be able to open it.",
      stopSharingDone: "Sharing stopped. The link no longer works.",
      accessDeniedTitle: "This report isn't shared with you",
      accessDeniedBody: "Only the person this report was shared with can open it.",
      authRequiredBody: "Please sign in to open this shared report.",
      createFailed: "We couldn't create a share link. Please try again.",
    },
    mapShare: {
      cta: "Share my Relationship Map",
      previewNote: "No names are included — just role names, counts, and percentages.",
      copied: "Copied to your clipboard.",
      copyFailed: "We couldn't copy that. Please try again.",
    },
  },
  connect: {
    invitedByTitle: (name: string) => `${name} invited you to their Relationship Map.`,
    invitedByBody:
      "Answer a few quick questions and add your birth information to explore your connection.",
    startCta: "Get started",
    invalidTitle: "This link isn't valid",
    invalidBody: "This link may have expired or is incorrect. Ask them for a new one.",
    selfLinkError: "You can't connect using your own invite link.",
    someoneFallbackName: "a friend",
    pendingRequestTitle: (name: string) => `${name} would like to be added to your Relationship Map.`,
    pendingSectionTitle: "Connection requests",
    acceptCta: "Accept",
    declineCta: "Decline",
  },
  signupName: {
    title: "Your name",
    body: "Tell us what to call you in the app. It doesn't need to be your real name — just something that helps you recognize yourself here.",
    placeholder: "e.g. Sera",
    submitCta: "Continue",
    required: "Please enter a name.",
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
    removeFriendTitle: string;
    removeFriendConfirm: (name: string) => string;
    removeFriendCta: string;
    removeFriendFailed: string;
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
    kindPickerSectionBasic: string;
    kindPickerSectionPremium: string;
    kindPickerBasicFree: string;
    kindPickerFamily: string;
    kindPickerRomantic: string;
    kindPickerFriendship: string;
    kindPickerWork: string;
    kindPickerCohabitation: string;
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
    friendListSubtitle: string;
    friendListLoading: string;
    selectFriendBelowListHint: string;
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
    recentAnalysisSubtitle: string;
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
    continuationTitle: string;
    exploreAnotherLensCta: string;
    exploreAnotherPersonCta: string;
    addSomeoneNewCta: string;
    recipientContinuationTitle: string;
    viewMyMapCta: string;
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
    deleteAccountHint: string;
    profileMenuLabel: string;
    deleteAccountButton: string;
    deleteAccountConfirmTitle: string;
    deleteAccountConfirmBody: string;
    deleteAccountCancel: string;
    deleteAccountConfirm: string;
    deleteAccountDeleting: string;
    deleteAccountError: string;
    deleteAccountFarewell: string;
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
    displayNameTitle: string;
    displayNameSubtitle: string;
    displayNamePlaceholder: string;
    displayNameSave: string;
    displayNameSaving: string;
    displayNameSaved: string;
    displayNameSaveFailed: string;
    displayNameRequired: string;
    displayNameLoading: string;
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
    metaTitle: string;
    metaDescription: string;
    items: { question: string; answer: string }[];
  };
  contact: {
    title: string;
    body: string;
    metaTitle: string;
    metaDescription: string;
    emailLabel: string;
    instagramLabel: string;
    faqPrompt: string;
    faqLinkLabel: string;
  };
  about: {
    metaTitle: string;
    metaDescription: string;
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
    birthDefaultNotice: string;
    calendarTypeLabel: string;
    calendarTypeSolar: string;
    calendarTypeLunar: string;
    surveyTitle: string;
    surveyModeAnswer: string;
    surveyModeSkip: string;
    surveySkippedNote: string;
    createRelationship: string;
  };
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    heroSubtitleLine1: string;
    heroSubtitleLine2: string;
    heroHook: string;
    heroBody1: string;
    heroBody2: string;
    heroCtaText: string;
    philosophyEyebrow: string;
    philosophyHeadline: string;
    philosophySubheadline: string;
    philosophyPoint1: string;
    philosophyPoint1Highlight: string;
    philosophyPoint2: string;
    philosophyPoint2Highlight: string;
    philosophyPoint3: string;
    philosophyPoint3Highlight: string;
    philosophySolution: string;
    philosophyConclusion: string;
    philosophyBridge: string;
    personalEyebrow: string;
    personalHeadline: string;
    personalInnateEyebrow: string;
    personalInnateTitle: string;
    personalInnateDescLine1: string;
    personalInnateDescLine2: string;
    personalInnateDesc: string;
    personalCurrentEyebrow: string;
    personalCurrentTitle: string;
    personalCurrentDescLine1: string;
    personalCurrentDescLine2: string;
    personalRealizedTitle: string;
    personalRealizedDesc: string;
    personalGapLabel: string;
    personalGapQuote: string;
    personalGapBodyLine1: string;
    personalGapBodyLine2: string;
    personalGapBodyLine2Highlight: string;
    radarLabels: {
      structure: string;
      connection: string;
      stability: string;
      growth: string;
      adaptability: string;
      autonomy: string;
    };
    relBridgeEyebrow: string;
    relBridgeHeadline: string;
    relBridgeSupporting: string;
    relBridgePersonA: string;
    relBridgePersonB: string;
    relBridgeSampleBadge: string;
    relBridgeStatement: string;
    relBridgeStatementSupporting: string;
    relBridgeHighlight: string;
    personalCta: string;
    reportsHeadline: string;
    reportsCtaLabel: string;
    reportsLoverTitle: string;
    reportsLoverDesc: string;
    reportsCoupleTitle: string;
    reportsCoupleDesc: string;
    reportsFamilyTitle: string;
    reportsFamilyDesc: string;
    reportsColleagueTitle: string;
    reportsColleagueDesc: string;
    reportsFriendTitle: string;
    reportsFriendDesc: string;
    reportsStartTitle: string;
    reportsStartDesc: string;
    reportsStartCta: string;
    frameworkEyebrow: string;
    frameworkHeadline: string;
    frameworkStep1Title: string;
    frameworkStep1Desc: string;
    frameworkStep1Tag: string;
    frameworkStep2Title: string;
    frameworkStep2Desc: string;
    frameworkStep2Tag: string;
    frameworkStep3Title: string;
    frameworkStep3Desc: string;
    frameworkStep3Tag: string;
    frameworkStep4Title: string;
    frameworkStep4Desc: string;
    frameworkStep4Tag: string;
    journalEyebrow: string;
    journalHeadline: string;
    journalBody: string;
    journalCta: string;
    journalClosing: string;
    footerPhilosophy: string;
    footerDesc: string;
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
    viewSentRequests: string;
    personalLinkHeading: string;
    personalLinkLoading: string;
    resetLink: string;
    resetLinkConfirm: string;
    resetLinkDone: string;
    resetLinkFailed: string;
    personalLinkLoadFailed: string;
  };
  footer: {
    support: string;
    legal: string;
    terms: string;
    privacy: string;
    refund: string;
    copyrightSuffix: string;
    business: {
      companyLabel: string;
      companyName: string;
      ceoLabel: string;
      ceoName: string;
      bizNumberLabel: string;
      bizNumber: string;
      mailOrderLabel: string;
      mailOrderNumber: string;
      addressLabel: string;
      address: string;
      phoneLabel: string;
      phone: string;
      emailLabel: string;
      email: string;
    };
  };
  legalConsent: {
    ageLabel: string;
    termsPrefix: string;
    termsLink: string;
    termsMiddle: string;
    privacyLink: string;
    termsSuffix: string;
    gateHint: string;
    pageTitle: string;
    pageSubtitle: string;
    submit: string;
    saving: string;
    loading: string;
    saveError: string;
    marketingLabel: string;
    marketingLabelOptional: string;
    byContinuingPrefix: string;
    byContinuingMiddle: string;
    byContinuingSuffix: string;
  };
  aiDisclaimer: string;
  cookieBanner: {
    ariaLabel: string;
    message: string;
    accept: string;
    reject: string;
    doNotSell: string;
  };
  doNotSellPage: {
    title: string;
    body: string;
    emailLabel: string;
    metaTitle: string;
    metaDescription: string;
  };
  paymentRefund: {
    checkboxLabel: string;
    requiredHint: string;
    processing: string;
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
      deepReadVoiceMeLabel: string;
      deepReadVoicePartnerLabel: string;
      deepReadPatternLabel: string;
      deepReadAdviceMeLabel: string;
      deepReadAdvicePartnerLabel: string;
      deepReadTogetherLabel: string;
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
      relationshipIndexCardTitle: string;
      relationshipIndexSafeDistanceLabel: string;
      talentStudyTypeLabel: string;
      talentWealthVesselLabel: string;
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
      familyRoleCardTitle: string;
      familyRoleDescriptionLabel: string;
      filialFrequencyCardTitle: string;
      focusAreasPrefix: string;
      filialRewardCardTitle: string;
      filialLayerLabel: string;
      filialLayerHint: string;
      deEscalationCardTitle: string;
      deEscalationLayerLabel: string;
      deEscalationLayerHint: string;
      whenAngryLabel: string;
      avoidLabel: string;
      contactWaitLabel: string;
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
      deepReadCardTitle: string;
      deepReadVoiceParentLabel: string;
      deepReadVoiceChildLabel: string;
      deepReadPatternLabel: string;
      deepReadAdviceParentLabel: string;
      deepReadAdviceChildLabel: string;
      deepReadTogetherLabel: string;
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
      hiddenFlowCardTitle: string;
      travelStyleLabel: string;
      travelPlannerLabel: string;
      travelFlexibleLabel: string;
      counselingStyleLabel: string;
      breakupGuideCardTitle: string;
      deEscalationCardTitle: string;
      compareTableCardTitle: string;
      compareTableColMe: string;
      compareTableColPartner: string;
      compareTableColMeaning: string;
      psychRadarCardTitle: string;
      deepReadCardTitle: string;
      deepReadVoiceMeLabel: string;
      deepReadVoicePartnerLabel: string;
      deepReadPatternLabel: string;
      deepReadAdviceMeLabel: string;
      deepReadAdvicePartnerLabel: string;
      deepReadTogetherLabel: string;
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
      dnaEnergyAxisNoteLabel: string;
      dnaFamilyIdentityLabel: string;
      weatherCardTitle: string;
      bedroomCardTitle: string;
      bedroomChemistryLabel: string;
      bedroomMatrixLabel: string;
      bedroomProfileTitle: (nickname: string) => string;
      bedroomStaminaLabel: string;
      bedroomStaminaPrecisionNoteLabel: string;
      bedroomFantasyLabel: string;
      bedroomMannerLabel: string;
      bedroomFrequencyLabel: string;
      sleepPrescriptionLabel: string;
      attachmentStyleLabel: string;
      rejectionScriptLabel: (nickname: string) => string;
      rejectionAxisNoteLabel: string;
      moneyChoresCardTitle: string;
      coupleActionPlanCardTitle: string;
      coupleActionPlanForMeLabel: string;
      coupleActionPlanForPartnerLabel: string;
      coupleActionPlanTogetherLabel: string;
      cfoQuestionLabel: string;
      choresLabel: string;
      spendingStyleLabel: string;
      cfoAxisNoteLabel: string;
      familyBoundaryCardTitle: string;
      inlawStressLabel: string;
      parentingCardTitle: string;
      parentingRoleNoteLabel: string;
      privacyCardTitle: string;
      myPrivacyLineLabel: string;
      partnerPrivacyLineLabel: string;
      warningCardTitle: string;
      conflictTriggerLabel: string;
      neglectRiskLabel: string;
      coldWarGoldenTimeLabel: string;
      reconciliationCueLabel: string;
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
      originStoryCardTitle: string;
      originStoryWhyUsLabel: string;
      originStoryPositiveChangeLabel: (nickname: string) => string;
      dailyLifeMirrorCardTitle: string;
      dailyLifeMirrorCharmLabel: (nickname: string) => string;
      dailyLifeMirrorSpouseTraitLabel: (nickname: string) => string;
      dailyLifeMirrorAuthorityLabel: (nickname: string) => string;
      deepReadCardTitle: string;
      deepReadVoiceMeLabel: string;
      deepReadVoicePartnerLabel: string;
      deepReadPatternLabel: string;
      deepReadAdviceMeLabel: string;
      deepReadAdvicePartnerLabel: string;
      deepReadTogetherLabel: string;
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
    structuredDesignFallbackTitle: string;
    structuredDesignFallbackBody: string;
  };
  relationshipMap: {
    title: string;
    subtitle: string;
    meLabel: string;
    emptyTitle: string;
    emptyCta: string;
    inviteCtaTitle: string;
    inviteCtaSubtitle: string;
    addFriendMapCta: string;
    dayMasterDisclaimer: string;
    forMeLabel: string;
    exploreRelationshipCta: string;
    peopleMoreCount: (n: number) => string;
    ariaRolePlanet: (roleLabel: string, countLabel: string) => string;
    personCount: (n: number) => string;
    roleDirectoryLabel: (roleLabel: string) => string;
    showMoreCta: (n: number) => string;
    reportShare: {
      sectionTitle: string;
      prompt: (name: string) => string;
      explain: (name: string) => string;
      shareButton: (name: string) => string;
      reassurance: string;
      linkReadyTitle: string;
      stopSharingCta: string;
      stopSharingConfirm: string;
      stopSharingDone: string;
      accessDeniedTitle: string;
      accessDeniedBody: string;
      authRequiredBody: string;
      createFailed: string;
    };
    mapShare: {
      cta: string;
      previewNote: string;
      copied: string;
      copyFailed: string;
    };
  };
  connect: {
    invitedByTitle: (name: string) => string;
    invitedByBody: string;
    startCta: string;
    invalidTitle: string;
    invalidBody: string;
    selfLinkError: string;
    someoneFallbackName: string;
    pendingRequestTitle: (name: string) => string;
    pendingSectionTitle: string;
    acceptCta: string;
    declineCta: string;
  };
  signupName: {
    title: string;
    body: string;
    placeholder: string;
    submitCta: string;
    required: string;
  };
};

/**
 * Host Onboarding v1 - COPY LOCK
 * This file is the single source of truth for host onboarding user-facing text.
 * COPY MUST COME FROM this file.
 * DO NOT inline user-facing strings in components.
 * Changes here require product + legal review.
 */

export const HOST_ONBOARDING_COPY = {
  meta: {
    title: "Restaurant Sign Up - MealScout | Grow Your Business",
    description:
      "Join MealScout and reach more customers with targeted local deals. Restaurant owners can create promotional deals, attract new diners, and boost sales. Sign up for free today!",
    keywords:
      "restaurant signup, business registration, restaurant promotions, attract customers, boost restaurant sales, local marketing",
    canonicalUrl: "https://mealscout.us/restaurant-signup",
  },

  unauth: {
    headerTitle: "MealScout for Businesses",
    hero: {
      badge: "Step 2 of 2 - Business account",
      title: "Set Up Your Restaurant or Food Truck",
      subtitle:
        "Connect your existing MealScout login, add your business details, and start reaching nearby diners who already use MealScout to find local deals.",
    },
    toggles: {
      signup: "Create Account",
      login: "Sign In",
    },
    oauth: {
      button: "Continue with Google",
    },
    divider: {
      or: "or",
    },
    signupCta: {
      buttonIdle: "Create Restaurant Account",
      buttonPending: "Creating Account...",
    },
    loginCta: {
      buttonIdle: "Sign In to Restaurant Account",
      buttonPending: "Signing In...",
    },
    forgotPassword: "Forgot your password?",
    finalCta: {
      title: "Ready to Get Started?",
      subtitle:
        "Join hundreds of restaurants already using MealScout to grow their business. Set up your first deal in minutes.",
      primaryButton: "Create Restaurant Account",
      secondaryButton: "Login to Existing Account",
    },
  },

  main: {
    backHeaderTitle: "Business Registration",
    hero: {
      badge: "Business profile setup",
      prompt: "Choose your business type",
      restaurant: {
        label: "Restaurant",
        title: "Fill more tables with local diners",
        subtitle:
          "Promote your restaurant to nearby customers searching for a great meal right now.",
        description:
          "Ideal for dine-in, cafes, or quick-serve spots looking to boost traffic.",
      },
      foodTruck: {
        label: "Food Truck",
        title: "Grow your route and get discovered",
        subtitle:
          "Show up on the map, share your schedule, and connect with hungry fans on the go.",
        description:
          "Perfect for mobile kitchens that change locations throughout the week.",
      },
      bar: {
        label: "Bar",
        description:
          "Bars and nightlife venues can choose Restaurant and list deals too.",
      },
      action: "Continue as",
    },
  },

  benefits: {
    cards: {
      reachMore: {
        title: "Reach More Customers",
        body: "Target hungry customers within walking distance of your restaurant when they're actively looking for deals.",
        bullets: [
          "Hyper-local targeting",
          "Peak hunger times",
          "Mobile-first audience",
        ],
      },
      fillSlow: {
        title: "Fill Slow Periods",
        body: "Boost revenue during off-peak hours with targeted lunch and dinner deals that bring customers when you need them most.",
        bullets: [
          "Time-based targeting",
          "Flexible deal scheduling",
          "Revenue optimization",
        ],
      },
      trackPerformance: {
        title: "Track Performance",
        body: "Get detailed analytics on your deal performance and optimize your campaigns for maximum ROI and customer acquisition.",
        bullets: ["Real-time analytics", "Customer insights", "ROI tracking"],
      },
    },
    compact: {
      local: {
        title: "Hyper-Local Targeting",
        desc: "Reach workers and customers within a few blocks of your restaurant",
      },
      allDay: {
        title: "All-Day Service",
        desc: "Great deals throughout the day for busy customers",
      },
      track: {
        title: "Track Performance",
        desc: "See how your deals perform and optimize for better results",
      },
    },
  },

  pricing: {
    hero: {
      title: "Simple, Transparent Pricing",
      coreLine: "Create unlimited deals and reach more customers",
      originalPrice: "$50",
      monthlyPrice: "$25",
      monthlySuffix: "/month",
      everythingIncludedTitle: "Everything included:",
      everythingIncludedBullets: [
        "Unlimited deals",
        "Edit deals anytime",
        "Performance analytics",
        "Customer targeting",
        "Real-time notifications",
        "Location-based promotion",
        "24/7 support",
        "Cancel anytime",
      ],
    },
    formCard: {
      title: "Simple Pricing",
      badge: "Best Deal",
      originalPrice: "$50",
      monthlyPrice: "$25",
      monthlySuffix: "/month",
      unlimitedTitle: "Unlimited Deals",
      unlimitedBody: "Post as many deals as you want - no limits!",
      everythingIncludedTitle: "Everything included:",
      features: [
        "Unlimited active deals",
        "Random deal display in feeds",
        "Performance analytics",
        "Location-based promotion",
        "Real-time notifications",
        "Cancel anytime",
      ],
    },
  },

  promo: {
    helperText: "Enter promo code for beta access...",
    betaNote: 'Enter "BETA" for free access during beta testing period',
  },

  terms: {
    labelPrefix: "I agree to the",
    termsText: "Terms of Service",
    andText: "and",
    privacyText: "Privacy Policy",
  },

  steps: {
    businessDetails: "Business Details",
    businessVerification: "Business Verification",
  },

  verification: {
    title: "Upload business documents",
    intro:
      "Add one or more recent documents so we can quickly confirm this is a real, operating business.",
    claimRequiredNote:
      "Claims require verification. You can submit documents now to complete your request.",
    bullets: [
      "Filing documents (LLC/Corp/DBA articles or city license)",
      "EIN or tax registration documents",
      "Updated insurance or health department certificates",
    ],
    whyVerify:
      "Verified businesses get a visible trust badge and priority placement when diners search for nearby food trucks and restaurants.",
    backButton: "Back to Restaurant Details",
    skipButton: "Skip for Now",
    submitIdle: "Submit for Review",
    submitPending: "Submitting...",
  },

  validation: {
    restaurant: {
      nameRequired: "Business name is required",
      addressRequired: "Address is required",
      phoneInvalid: "Valid phone number is required",
      businessTypeRequired: "Please select your business type",
      cuisineRequired: "Cuisine type is required",
      acceptTermsRequired: "You must accept the terms",
    },
    signup: {
      emailInvalid: "Valid email is required",
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      phoneInvalid: "Valid phone number is required",
      passwordTooShort:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      confirmPasswordRequired: "Please confirm your password",
      passwordsMismatch: "Passwords don't match",
    },
    login: {
      emailInvalid: "Valid email is required",
      passwordRequired: "Password is required",
    },
  },

  notifications: {
    signup: {
      successTitle: "Success!",
      successDescription: "Account created successfully!",
      errorTitle: "Signup Failed",
      errorDescription: "Failed to create account",
    },
    login: {
      successTitle: "Success!",
      successDescription: "Logged in successfully!",
      errorTitle: "Login Failed",
      errorDescription: "Invalid email or password",
    },
    restaurant: {
      successTitle: "Restaurant Registered!",
      successDescription:
        "Now let's verify your business to build trust with customers.",
      unauthorizedTitle: "Unauthorized",
      unauthorizedDescription: "You are logged out. Logging in again...",
      errorTitle: "Error",
      errorDescription: "Failed to register restaurant",
    },
    verification: {
      successTitle: "Verification Submitted!",
      successDescription:
        "Your documents have been submitted for review. You'll be notified of the decision.",
      errorTitle: "Submission Failed",
      errorDescription: "Failed to submit verification request",
      missingDocsTitle: "Documents Required",
      missingDocsDescription:
        "Please upload at least one business document for verification.",
      skippedTitle: "Verification Skipped",
      skippedDescription:
        "You can submit verification documents later from your dashboard.",
    },
    betaAccess: {
      title: "Beta Access Granted!",
      description:
        "You can now create deals without payment during beta testing.",
    },
  },

  forms: {
    signup: {
      firstNameLabel: "First Name",
      firstNamePlaceholder: "John",
      lastNameLabel: "Last Name",
      lastNamePlaceholder: "Doe",
      emailLabel: "Email",
      emailPlaceholder: "john@restaurant.com",
      phoneLabel: "Phone Number",
      phonePlaceholder: "(555) 123-4567",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters with strong mix",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your password",
    },
    login: {
      emailLabel: "Email",
      emailPlaceholder: "john@restaurant.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Your password",
    },
    restaurant: {
      nameLabel: "Business Name",
      namePlaceholder: "Enter your business name",
      businessTypeLabel: "Business Type",
      businessTypePlaceholder: "Select your business type...",
      addressLabel: "Business Address",
      addressPlaceholder: "123 Main Street, Chicago, IL",
      cityLabel: "City",
      cityPlaceholder: "Chicago",
      stateLabel: "State",
      statePlaceholder: "IL",
      phoneLabel: "Phone",
      phonePlaceholder: "(555) 123-4567",
      claimTitle: "Claim an Existing Food Truck",
      claimDescription:
        "If your truck is already listed from a government registry, claim it and verify ownership.",
      claimSearchLabel: "Search by license ID or truck name",
      claimSearchPlaceholder: "Start typing your license ID or truck name",
      claimSearchButton: "Find My Truck",
      claimSelectButton: "Use This Truck",
      claimSelectedLabel: "Selected listing",
      claimClearButton: "Clear Selection",
      claimNoResults: "No matches found. You can continue with manual entry.",
      claimDisclaimer:
        "Claiming requires verification documents that match your license or insurance.",
      cuisineLabel: "Cuisine Type",
      cuisinePlaceholder: "Select cuisine type...",
      promoLabel: "Promo Code",
      promoOptionalSuffix: "(Optional)",
    },
  },

  cta: {
    restaurantSubmit: {
      idle: "Get Started",
      pending: "Creating...",
    },
  },
} as const;

export type HostOnboardingCopy = typeof HOST_ONBOARDING_COPY;
export type HostCopyKey =
  | "pricing.hero.originalPrice"
  | "pricing.hero.monthlyPrice"
  | "pricing.formCard.originalPrice"
  | "pricing.formCard.monthlyPrice"
  | "terms.labelPrefix"
  | "terms.termsText"
  | "terms.privacyText"
  | "validation.restaurant.nameRequired"
  | "validation.restaurant.addressRequired"
  | "validation.restaurant.phoneInvalid"
  | "validation.signup.emailInvalid"
  | "validation.signup.passwordTooShort"
  | "validation.login.emailInvalid"
  | "validation.login.passwordRequired"
  | "notifications.signup.successTitle"
  | "notifications.signup.errorTitle"
  | "notifications.restaurant.successTitle"
  | "notifications.verification.successTitle"
  | "notifications.verification.errorTitle";

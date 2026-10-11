"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * Google (OAuth) sign-up/sign-in lands here (CustomSignUpForm
 * redirectUrl: /sso-callback). Clerk finishes the session and then goes to
 * redirectUrlComplete, which is the server-checked continue URL.
 */
export default function SsoCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}

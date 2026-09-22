"use client";

import CustomSignUpForm from "@/components/auth/CustomSignUpForm";
import { ROUTES } from "@/constants/routes";

export default function HomeAuthSignUpPanel({
  fallbackRedirectPath = ROUTES.home,
  onSuccess,
}: {
  fallbackRedirectPath?: string;
  onSuccess?: () => void;
} = {}) {
  return (
    <CustomSignUpForm
      fallbackRedirectPath={fallbackRedirectPath}
      onSuccess={onSuccess}
    />
  );
}

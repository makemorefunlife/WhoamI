"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { Check, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";

type Props = {
  fallbackRedirectPath?: string;
  signInUrl?: string;
  onSuccess?: () => void;
};

export default function CustomSignUpForm({
  fallbackRedirectPath = ROUTES.home,
  signInUrl,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { locale, href } = useLocale();
  const isKr = locale === "ko-KR";

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isValidPassword = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const isConfirmTyped = confirmPassword.length > 0;
  const passwordsMatch = isConfirmTyped && password === confirmPassword;

  // Text translations
  const labels = isKr
    ? {
        email: "이메일 주소",
        emailPlaceholder: "name@example.com",
        password: "비밀번호",
        passwordPlaceholder: "비밀번호를 입력해 주세요",
        confirmPassword: "비밀번호 확인",
        confirmPasswordPlaceholder: "비밀번호를 한번 더 입력해 주세요",
        reqTitle: "비밀번호 보안 조건",
        reqMinLength: "8자 이상",
        reqUpper: "영문 대문자 1개 이상",
        reqLower: "영문 소문자 1개 이상",
        reqNumber: "숫자 1개 이상",
        reqSpecial: "특수문자 1개 이상 (!@#$%^&*)",
        matchSuccess: "✓ 비밀번호가 일치합니다.",
        matchError: "✕ 비밀번호가 일치하지 않습니다.",
        submit: "회원가입하기",
        verifyingTitle: "이메일 인증 코드 입력",
        verifyingSub: `${emailAddress}(으)로 전송된 6자리 인증 코드를 입력해 주세요.`,
        codePlaceholder: "6자리 코드 입력",
        verifyBtn: "인증 완료",
        resendBtn: "코드 재전송",
        signInPrompt: "이미 계정이 있으신가요?",
        signInLink: "로그인",
        googleBtn: "Google 계정으로 계속하기",
        dividerOr: "또는 이메일로 가입",
        errFillAll: "이메일과 비밀번호를 모두 입력해 주세요.",
        errRules: "비밀번호 보안 조건을 모두 충족해 주세요.",
        errMismatch: "비밀번호 확인이 일치하지 않습니다.",
      }
    : {
        email: "Email address",
        emailPlaceholder: "name@example.com",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        confirmPassword: "Confirm password",
        confirmPasswordPlaceholder: "Re-enter your password",
        reqTitle: "Password security requirements",
        reqMinLength: "At least 8 characters",
        reqUpper: "At least 1 uppercase letter",
        reqLower: "At least 1 lowercase letter",
        reqNumber: "At least 1 number",
        reqSpecial: "At least 1 special character (!@#$%^&*)",
        matchSuccess: "✓ Passwords match.",
        matchError: "✕ Passwords do not match.",
        submit: "Create Account",
        verifyingTitle: "Enter verification code",
        verifyingSub: `Please enter the 6-digit code sent to ${emailAddress}.`,
        codePlaceholder: "Enter 6-digit code",
        verifyBtn: "Verify Email",
        resendBtn: "Resend Code",
        signInPrompt: "Already have an account?",
        signInLink: "Sign in",
        googleBtn: "Continue with Google",
        dividerOr: "or sign up with email",
        errFillAll: "Please fill in all fields.",
        errRules: "Please fulfill all password security requirements.",
        errMismatch: "Passwords do not match.",
      };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setErrorMessage(null);

    if (!emailAddress.trim() || !password || !confirmPassword) {
      setErrorMessage(labels.errFillAll);
      return;
    }
    if (!isValidPassword) {
      setErrorMessage(labels.errRules);
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage(labels.errMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await signUp.create({
        emailAddress: emailAddress.trim(),
        password: password,
      });

      if (res.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerifying(true);
      } else if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(href(fallbackRedirectPath));
        }
      }
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      const clerkErr = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }> };
      if (clerkErr?.errors?.[0]) {
        const first = clerkErr.errors[0];
        if (first.code === "form_identifier_exists") {
          setErrorMessage(
            isKr
              ? "이미 가입된 이메일 주소입니다. 로그인해 주세요."
              : "That email is already registered. Please sign in."
          );
        } else if (first.code === "password_pwned" || first.code === "password_too_weak") {
          setErrorMessage(
            isKr
              ? "비밀번호가 보안에 취약합니다. 다른 비밀번호를 설정해 주세요."
              : "Password is too weak. Please choose a stronger password."
          );
        } else {
          setErrorMessage(first.longMessage || first.message || "Sign up failed.");
        }
      } else {
        setErrorMessage(isKr ? "회원가입 중 오류가 발생했습니다." : "An error occurred during sign up.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading || !code.trim()) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(href(fallbackRedirectPath));
        }
      } else {
        setErrorMessage(
          isKr
            ? "인증 절차가 완전히 끝나지 않았습니다. 다시 시도해 주세요."
            : "Verification incomplete. Please try again."
        );
      }
    } catch (err: unknown) {
      console.error("Verification error:", err);
      const clerkErr = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      setErrorMessage(
        clerkErr?.errors?.[0]?.longMessage ||
          clerkErr?.errors?.[0]?.message ||
          (isKr ? "잘못된 인증 코드입니다. 다시 확인해 주세요." : "Invalid verification code.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setErrorMessage(
        isKr ? "인증 코드가 다시 전송되었습니다." : "Verification code resent."
      );
    } catch {
      setErrorMessage(
        isKr ? "코드 재전송에 실패했습니다." : "Failed to resend code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: href("/sso-callback"),
        redirectUrlComplete: href(fallbackRedirectPath),
      });
    } catch (err) {
      console.error("Google sign up error:", err);
    }
  };

  // If in email verification step
  if (verifying) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-6 shadow-[0_12px_32px_rgba(26,51,40,0.06)] sm:p-8">
        <h2 className="text-xl font-bold text-[#1A3328]">{labels.verifyingTitle}</h2>
        <p className="mt-1 text-xs text-[#4A5C52]">{labels.verifyingSub}</p>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={labels.codePlaceholder}
              className="w-full rounded-2xl border border-[#D4CFC4] bg-white px-4 py-3 text-center text-lg font-bold letter-spacing-2 text-[#1A3328] shadow-sm outline-none focus:border-[#1A3328] focus:ring-1 focus:ring-[#1A3328]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length < 6}
            className="w-full cursor-pointer rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] py-3.5 text-sm font-semibold text-[#FFFDF8] shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : labels.verifyBtn}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="w-full cursor-pointer text-xs font-medium text-[#4A5C52] hover:text-[#1A3328] hover:underline"
          >
            {labels.resendBtn}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-6 shadow-[0_12px_32px_rgba(26,51,40,0.06)] sm:p-8">
      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#D4CFC4] bg-white px-4 py-3 text-sm font-semibold text-[#1A3328] shadow-sm transition hover:bg-[#F5F0E8]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{labels.googleBtn}</span>
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#D4CFC4]/60" />
        <span className="text-[11px] font-medium text-[#6A7D73] uppercase tracking-wider">
          {labels.dividerOr}
        </span>
        <div className="h-px flex-1 bg-[#D4CFC4]/60" />
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSignUpSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-[#1A3328] mb-1">
            {labels.email}
          </label>
          <input
            type="email"
            required
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder={labels.emailPlaceholder}
            className="w-full rounded-2xl border border-[#D4CFC4] bg-white px-4 py-2.5 text-sm text-[#1A3328] shadow-sm outline-none focus:border-[#1A3328] focus:ring-1 focus:ring-[#1A3328]"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-[#1A3328] mb-1">
            {labels.password}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={labels.passwordPlaceholder}
              className="w-full rounded-2xl border border-[#D4CFC4] bg-white px-4 py-2.5 pr-10 text-sm text-[#1A3328] shadow-sm outline-none focus:border-[#1A3328] focus:ring-1 focus:ring-[#1A3328]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A7D73] hover:text-[#1A3328]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Real-time Password Security Checklist Guidance */}
          <div className="mt-2.5 rounded-2xl border border-[#D4CFC4]/60 bg-[#F5F0E8]/70 p-3 text-xs">
            <p className="mb-2 font-bold text-[#1A3328] flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#3A8F6E]" />
              <span>{labels.reqTitle}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasMinLength ? "text-[#3A8F6E] font-semibold" : "text-[#6A7D73]"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    hasMinLength ? "bg-[#3A8F6E] text-white" : "bg-[#D4CFC4] text-[#4A5C52]"
                  }`}
                >
                  {hasMinLength ? "✓" : "○"}
                </div>
                <span>{labels.reqMinLength}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasUpper ? "text-[#3A8F6E] font-semibold" : "text-[#6A7D73]"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    hasUpper ? "bg-[#3A8F6E] text-white" : "bg-[#D4CFC4] text-[#4A5C52]"
                  }`}
                >
                  {hasUpper ? "✓" : "○"}
                </div>
                <span>{labels.reqUpper}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasLower ? "text-[#3A8F6E] font-semibold" : "text-[#6A7D73]"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    hasLower ? "bg-[#3A8F6E] text-white" : "bg-[#D4CFC4] text-[#4A5C52]"
                  }`}
                >
                  {hasLower ? "✓" : "○"}
                </div>
                <span>{labels.reqLower}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasNumber ? "text-[#3A8F6E] font-semibold" : "text-[#6A7D73]"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    hasNumber ? "bg-[#3A8F6E] text-white" : "bg-[#D4CFC4] text-[#4A5C52]"
                  }`}
                >
                  {hasNumber ? "✓" : "○"}
                </div>
                <span>{labels.reqNumber}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  hasSpecial ? "text-[#3A8F6E] font-semibold" : "text-[#6A7D73]"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    hasSpecial ? "bg-[#3A8F6E] text-white" : "bg-[#D4CFC4] text-[#4A5C52]"
                  }`}
                >
                  {hasSpecial ? "✓" : "○"}
                </div>
                <span>{labels.reqSpecial}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-xs font-bold text-[#1A3328] mb-1">
            {labels.confirmPassword}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={labels.confirmPasswordPlaceholder}
              className={`w-full rounded-2xl border bg-white px-4 py-2.5 pr-10 text-sm text-[#1A3328] shadow-sm outline-none focus:ring-1 ${
                isConfirmTyped
                  ? passwordsMatch
                    ? "border-[#3A8F6E] focus:border-[#3A8F6E] focus:ring-[#3A8F6E]"
                    : "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                  : "border-[#D4CFC4] focus:border-[#1A3328] focus:ring-[#1A3328]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A7D73] hover:text-[#1A3328]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Real-time Match Indicator */}
          {isConfirmTyped && (
            <p
              className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
                passwordsMatch ? "text-[#3A8F6E]" : "text-rose-600"
              }`}
            >
              {passwordsMatch ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{labels.matchSuccess}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{labels.matchError}</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isValidPassword || !passwordsMatch}
          className="w-full cursor-pointer rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] py-3.5 text-sm font-bold text-[#FFFDF8] shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : labels.submit}
        </button>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-5 text-center text-xs text-[#4A5C52]">
        <span>{labels.signInPrompt} </span>
        <a
          href={signInUrl || href(ROUTES.signIn)}
          className="font-bold text-[#1A3328] underline decoration-[#1A3328]/30 underline-offset-2 hover:text-[#3A8F6E]"
        >
          {labels.signInLink}
        </a>
      </div>
    </div>
  );
}

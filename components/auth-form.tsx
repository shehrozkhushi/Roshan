"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowIcon } from "@/components/icons";
import type { Dictionary, Locale } from "@/lib/i18n";

type AuthMode = "login" | "signup";
type AuthCopy = Dictionary["auth"];
type FormErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "code" | "form", string>
>;
type ApiResult = {
  ok?: boolean;
  code?: string;
  retryAfterSeconds?: number;
  resendAfterSeconds?: number;
};
type PendingSignup = {
  name: string;
  email: string;
  password: string;
  website: string;
  locale: Locale;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verificationCodePattern = /^\d{6}$/;
const resendCooldownSeconds = 60;

export function AuthForm({
  locale,
  mode,
  copy,
}: {
  locale: Locale;
  mode: AuthMode;
  copy: AuthCopy;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);
  const pendingSignupRef = useRef<PendingSignup | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const pageCopy = mode === "login" ? copy.login : copy.signup;

  useEffect(() => {
    if (!verificationEmail) return;
    verificationInputRef.current?.focus();
  }, [verificationEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  function localError(code: string) {
    switch (code) {
      case "EMAIL_EXISTS":
        return copy.errors.emailExists;
      case "INVALID_CREDENTIALS":
        return copy.errors.invalidCredentials;
      case "RATE_LIMITED":
        return copy.errors.tooManyAttempts;
      case "AUTH_UNAVAILABLE":
        return copy.errors.unavailable;
      case "EMAIL_SEND_FAILED":
      case "EMAIL_DELIVERY_FAILED":
      case "VERIFICATION_SEND_FAILED":
        return copy.verification.deliveryError;
      default:
        return copy.errors.generic;
    }
  }

  function verificationError(code: string) {
    switch (code) {
      case "INVALID_CODE":
      case "INVALID_VERIFICATION_CODE":
      case "VERIFICATION_CODE_INVALID":
        return copy.verification.invalidCode;
      case "CODE_EXPIRED":
      case "VERIFICATION_EXPIRED":
      case "VERIFICATION_CODE_EXPIRED":
      case "VERIFICATION_NOT_FOUND":
        return copy.verification.expiredCode;
      case "RATE_LIMITED":
        return copy.errors.tooManyAttempts;
      case "EMAIL_EXISTS":
        return copy.errors.emailExists;
      case "AUTH_UNAVAILABLE":
        return copy.errors.unavailable;
      default:
        return copy.verification.sendFailure;
    }
  }

  function validate(values: Record<string, string>) {
    const nextErrors: FormErrors = {};

    if (mode === "signup" && values.name.trim().length < 2) {
      nextErrors.name = copy.validation.shortName;
    }
    if (!emailPattern.test(values.email.trim())) {
      nextErrors.email = copy.validation.invalidEmail;
    }
    if (values.password.length < 8) {
      nextErrors.password = copy.validation.shortPassword;
    }
    if (mode === "signup" && values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = copy.validation.passwordMismatch;
    }

    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );
    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      const control = event.currentTarget.elements.namedItem(firstError);
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: mode === "signup" ? values.name : undefined,
        email: values.email,
        password: values.password,
        website: values.website,
        ...(mode === "signup" ? { locale } : {}),
      };
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResult;

      if (
        mode === "signup" &&
        (response.status === 202 || result.code === "VERIFICATION_COOLDOWN")
      ) {
        const email = values.email.trim().toLowerCase();
        pendingSignupRef.current = {
          name: values.name.trim(),
          email,
          password: values.password,
          website: values.website,
          locale,
        };
        setVerificationEmail(email);
        setVerificationCode("");
        setResendCooldown(
          (result.resendAfterSeconds ??
            result.retryAfterSeconds ??
            Number(response.headers.get("Retry-After"))) ||
            resendCooldownSeconds,
        );
        setResendStatus("idle");
        setErrors(
          result.code === "VERIFICATION_COOLDOWN"
            ? { form: copy.verification.cooldown }
            : {},
        );
        return;
      }

      if (!response.ok || !result.ok) {
        setErrors({ form: localError(result.code ?? "") });
        return;
      }

      formRef.current?.reset();
      window.dispatchEvent(new Event("roshan-auth-changed"));
      router.push(`/${locale}/account`);
      router.refresh();
    } catch {
      setErrors({ form: copy.errors.network });
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendStatus("idle");

    if (!verificationCodePattern.test(verificationCode)) {
      setErrors({ code: copy.verification.invalidLength });
      verificationInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationEmail,
          code: verificationCode,
          locale,
        }),
      });
      const result = (await response.json()) as ApiResult;

      if (!response.ok || !result.ok) {
        setErrors({ form: verificationError(result.code ?? "") });
        return;
      }

      pendingSignupRef.current = null;
      router.push(`/${locale}/login?verified=1`);
      router.refresh();
    } catch {
      setErrors({ form: copy.errors.network });
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    const payload = pendingSignupRef.current;
    if (!payload || resendCooldown > 0 || resendStatus === "sending") return;

    setResendStatus("sending");
    setErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResult;

      if (response.status !== 202 || !result.ok) {
        if (
          result.code === "RATE_LIMITED" ||
          result.code === "VERIFICATION_COOLDOWN"
        ) {
          setResendCooldown(
            (result.retryAfterSeconds ??
              Number(response.headers.get("Retry-After"))) ||
              resendCooldownSeconds,
          );
          setErrors({
            form:
              result.code === "VERIFICATION_COOLDOWN"
                ? copy.verification.cooldown
                : copy.errors.tooManyAttempts,
          });
        } else {
          setErrors({ form: copy.verification.resendError });
        }
        setResendStatus("error");
        return;
      }

      setVerificationCode("");
      setResendCooldown(
        result.resendAfterSeconds ??
          result.retryAfterSeconds ??
          resendCooldownSeconds,
      );
      setResendStatus("sent");
      verificationInputRef.current?.focus();
    } catch {
      setErrors({ form: copy.verification.resendError });
      setResendStatus("error");
    }
  }

  function changeEmail() {
    pendingSignupRef.current = null;
    setVerificationEmail("");
    setVerificationCode("");
    setResendCooldown(0);
    setResendStatus("idle");
    setErrors({});
  }

  const alternate =
    mode === "login"
      ? {
          prompt: copy.login.noAccount,
          label: copy.login.signupLink,
          href: `/${locale}/signup`,
        }
      : {
          prompt: copy.signup.hasAccount,
          label: copy.signup.loginLink,
          href: `/${locale}/login`,
        };

  if (mode === "signup" && verificationEmail) {
    return (
      <form className="auth-form auth-verification" onSubmit={verify} noValidate>
        <div className="auth-verification-heading">
          <h2>{copy.verification.title}</h2>
          <p>
            {copy.verification.intro}{" "}
            <strong dir="ltr">{verificationEmail}</strong>.{" "}
            {copy.verification.instruction}
          </p>
        </div>

        <div className="field">
          <label htmlFor="auth-verification-code">{copy.verification.code}</label>
          <input
            ref={verificationInputRef}
            id="auth-verification-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            dir="ltr"
            value={verificationCode}
            placeholder={copy.verification.codePlaceholder}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? "auth-verification-code-error" : undefined}
            onChange={(event) => {
              setVerificationCode(event.currentTarget.value.replace(/\D/g, "").slice(0, 6));
              setErrors((current) => ({
                ...current,
                code: undefined,
                form: undefined,
              }));
              setResendStatus("idle");
            }}
          />
          {errors.code && (
            <span className="field-error" id="auth-verification-code-error">
              {errors.code}
            </span>
          )}
        </div>

        {errors.form && (
          <p className="auth-error" role="alert">
            {errors.form}
          </p>
        )}

        <button
          className="button button--ink auth-submit"
          type="submit"
          disabled={submitting}
        >
          <span>
            {submitting ? copy.verification.submitting : copy.verification.submit}
          </span>
          <ArrowIcon />
        </button>

        <div className="auth-verification-actions">
          <button
            className="auth-text-button"
            type="button"
            disabled={resendCooldown > 0 || resendStatus === "sending"}
            onClick={resendCode}
          >
            {resendStatus === "sending"
              ? copy.verification.resending
              : resendCooldown > 0
                ? copy.verification.resendIn.replace(
                    "{seconds}",
                    String(resendCooldown),
                  )
                : copy.verification.resend}
          </button>
          <button className="auth-text-button" type="button" onClick={changeEmail}>
            {copy.verification.changeEmail}
          </button>
        </div>

        {resendStatus === "sent" && (
          <p className="auth-resend-status" role="status">
            {copy.verification.resendSent}
          </p>
        )}
      </form>
    );
  }

  return (
    <form className="auth-form" ref={formRef} onSubmit={submit} noValidate>
      {mode === "signup" && (
        <div className="field">
          <label htmlFor="auth-name">{copy.signup.name}</label>
          <input
            id="auth-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={60}
            placeholder={copy.signup.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "auth-name-error" : undefined}
            onChange={() => setErrors((current) => ({ ...current, name: undefined }))}
          />
          {errors.name && (
            <span className="field-error" id="auth-name-error">
              {errors.name}
            </span>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="auth-email">{pageCopy.email}</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          inputMode="email"
          dir="ltr"
          autoComplete="email"
          maxLength={254}
          placeholder={pageCopy.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "auth-email-error" : undefined}
          onChange={() => setErrors((current) => ({ ...current, email: undefined }))}
        />
        {errors.email && (
          <span className="field-error" id="auth-email-error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="auth-password">{pageCopy.password}</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          maxLength={72}
          placeholder={pageCopy.passwordPlaceholder}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "auth-password-error" : undefined}
          onChange={() => setErrors((current) => ({ ...current, password: undefined }))}
        />
        {errors.password && (
          <span className="field-error" id="auth-password-error">
            {errors.password}
          </span>
        )}
      </div>

      {mode === "signup" && (
        <div className="field">
          <label htmlFor="auth-confirm-password">{copy.signup.confirmPassword}</label>
          <input
            id="auth-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            placeholder={copy.signup.confirmPasswordPlaceholder}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "auth-confirm-password-error" : undefined
            }
            onChange={() =>
              setErrors((current) => ({ ...current, confirmPassword: undefined }))
            }
          />
          {errors.confirmPassword && (
            <span className="field-error" id="auth-confirm-password-error">
              {errors.confirmPassword}
            </span>
          )}
        </div>
      )}

      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`auth-website-${mode}`}>Website</label>
        <input
          id={`auth-website-${mode}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {errors.form && (
        <p className="auth-error" role="alert">
          {errors.form}
        </p>
      )}

      <button
        className="button button--ink auth-submit"
        type="submit"
        disabled={submitting}
      >
        <span>
          {submitting
            ? mode === "login"
              ? copy.login.submitting
              : copy.signup.submitting
            : mode === "login"
              ? copy.login.submit
              : copy.signup.submit}
        </span>
        <ArrowIcon />
      </button>

      <p className="auth-alternate">
        {alternate.prompt} <Link href={alternate.href}>{alternate.label}</Link>
      </p>
    </form>
  );
}

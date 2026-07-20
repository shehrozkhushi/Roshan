"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import type { Dictionary, Locale } from "@/lib/i18n";

type ContactCopy = Dictionary["contact"];
type FieldName = "name" | "email" | "service" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({
  locale,
  copy,
}: {
  locale: Locale;
  copy: ContactCopy;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function validate(values: Record<string, string>) {
    const nextErrors: FieldErrors = {};

    if (values.name.trim().length < 2) nextErrors.name = copy.shortName;
    if (!emailPattern.test(values.email.trim())) nextErrors.email = copy.invalidEmail;
    if (!values.service) nextErrors.service = copy.required;
    if (values.message.trim().length < 20) nextErrors.message = copy.shortMessage;

    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );
    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (firstError) {
      const control = form.elements.namedItem(firstError);
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
      setErrors({});
      formRef.current?.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="contact-form-wrap">
      <div className="form-heading">
        <span className="form-index">01</span>
        <h2>{copy.formTitle}</h2>
      </div>

      {status === "success" ? (
        <div className="form-success" role="status">
          <span className="success-icon">
            <CheckIcon />
          </span>
          <h3>{copy.successTitle}</h3>
          <p>{copy.successText}</p>
          <button className="text-button" type="button" onClick={() => setStatus("idle")}>
            {locale === "ur" ? "ایک اور پیغام بھیجیں" : "Send another enquiry"}
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">{copy.name}</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={copy.namePlaceholder}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                onChange={() => setErrors((current) => ({ ...current, name: undefined }))}
              />
              {errors.name && (
                <span className="field-error" id="name-error">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="email">{copy.email}</label>
              <input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={() => setErrors((current) => ({ ...current, email: undefined }))}
              />
              {errors.email && (
                <span className="field-error" id="email-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="company">
                {copy.company} <span>({copy.optional})</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder={copy.companyPlaceholder}
                maxLength={120}
              />
            </div>

            <div className="field">
              <label htmlFor="service">{copy.service}</label>
              <span className="select-wrap">
                <select
                  id="service"
                  name="service"
                  defaultValue=""
                  aria-invalid={Boolean(errors.service)}
                  aria-describedby={errors.service ? "service-error" : undefined}
                  onChange={() => setErrors((current) => ({ ...current, service: undefined }))}
                >
                  <option value="" disabled>
                    {copy.servicePlaceholder}
                  </option>
                  {copy.services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </span>
              {errors.service && (
                <span className="field-error" id="service-error">
                  {errors.service}
                </span>
              )}
            </div>

            <div className="field field--full">
              <label htmlFor="budget">{copy.budget}</label>
              <span className="select-wrap">
                <select id="budget" name="budget" defaultValue="">
                  <option value="" disabled>
                    {copy.budgetPlaceholder}
                  </option>
                  {copy.budgets.map((budget) => (
                    <option key={budget} value={budget}>
                      {budget}
                    </option>
                  ))}
                </select>
              </span>
            </div>

            <div className="field field--full">
              <label htmlFor="message">{copy.message}</label>
              <textarea
                id="message"
                name="message"
                rows={6}
                maxLength={2000}
                placeholder={copy.messagePlaceholder}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                onChange={() => setErrors((current) => ({ ...current, message: undefined }))}
              />
              {errors.message && (
                <span className="field-error" id="message-error">
                  {errors.message}
                </span>
              )}
            </div>
          </div>

          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="form-submit-row">
            <button
              className="button button--ink submit-button"
              type="submit"
              disabled={status === "sending"}
            >
              <span>{status === "sending" ? copy.sending : copy.send}</span>
              <ArrowIcon />
            </button>
            <p className="form-privacy">
              {locale === "ur"
                ? "آپ کی معلومات صرف آپ کے پیغام کا جواب دینے کے لیے استعمال ہوں گی۔"
                : "Your details are only used to respond to this enquiry."}
            </p>
          </div>

          {status === "error" && (
            <p className="form-status form-status--error" role="alert">
              {copy.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

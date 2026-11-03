"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { PublicFooter } from "../components/PublicFooter";
import { PublicNavbar } from "../components/PublicNavbar";
import { getErrorMessage, submitContactForm } from "@/lib/api";
import {
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  CONTACT_OTHER_TOPIC_MAX_LENGTH,
  CONTACT_TOPICS,
  type ContactField,
  type ContactFieldErrors,
  validateContactForm,
} from "@/lib/contact";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1 text-xs font-semibold text-red-600">
      <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("feedback");
  const [otherTopic, setOtherTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLSelectElement>(null);
  const otherTopicRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const clearFieldError = (field: ContactField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const focusFirstError = (errors: ContactFieldErrors) => {
    const firstInvalidField = (["name", "email", "topic", "otherTopic", "message"] as const).find(
      (field) => errors[field],
    );
    if (!firstInvalidField) return;

    const elements: Record<ContactField, HTMLElement | null> = {
      name: nameRef.current,
      email: emailRef.current,
      topic: topicRef.current,
      otherTopic: otherTopicRef.current,
      message: messageRef.current,
    };
    elements[firstInvalidField]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateContactForm({ name, email, topic, otherTopic, message });
    setFieldErrors(validation.errors);
    setError("");

    if (!validation.normalized) {
      focusFirstError(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitContactForm(validation.normalized);
      if (!response.success) {
        throw new Error(response.message || "Your message could not be sent.");
      }
      setSuccessMessage(response.message || "Your message has been sent.");
      setSubmitted(true);
      setName("");
      setEmail("");
      setTopic("feedback");
      setOtherTopic("");
      setMessage("");
      setFieldErrors({});
    } catch (submissionError: unknown) {
      setError(
        getErrorMessage(
          submissionError,
          "Your message could not be sent. Please try again later.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-brand-cream/30 px-3.5 py-3 text-sm font-medium text-brand-deep outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-brand-deep/35 hover:border-brand-green/50 focus:bg-white focus:ring-4 focus:ring-brand-green/10 ${
      hasError ? "border-red-400 focus:border-red-500" : "border-brand-green/25 focus:border-brand-green"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream text-brand-deep">
      <PublicNavbar />

      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-green/5 blur-[90px]" />

        <header className="relative mb-10 max-w-2xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">Contact AuditWeave</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-deep sm:text-4xl">
            Contact &amp; Support Portal
          </h1>
          <p className="text-sm font-medium leading-relaxed text-brand-deep/70 sm:text-base">
            Get in touch with GRC specialists, report vulnerabilities, or submit platform feedback.
          </p>
        </header>

        <div className="relative grid grid-cols-1 items-stretch gap-8 md:grid-cols-12">
          <section className="flex flex-col justify-between space-y-6 rounded-2xl border border-brand-green/20 bg-white p-6 shadow-sm md:col-span-5 sm:p-7">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-brand-deep">About AuditWeave</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-deep/70">
                  AuditWeave is an advanced GRC auditing platform. We build hybrid deterministic and language-modeling pipelines to check statutory notice guidelines under India&apos;s Digital Personal Data Protection Act 2023.
                </p>
              </div>

              <div className="space-y-3 border-t border-brand-deep/8 pt-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-deep/60">Contact Info</h3>
                <div className="space-y-3 text-sm font-medium text-brand-deep/70">
                  <a
                    href="https://www.linkedin.com/company/axoreon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-2 rounded-sm transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-green" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    <span>linkedin.com/company/axoreon</span>
                  </a>
                  <a
                    href="https://www.instagram.com/axoreon.official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-2 rounded-sm transition-colors hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2"
                  >
                    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-green" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>instagram.com/axoreon.official</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-green/10 bg-brand-cream/50 p-4 text-xs leading-relaxed text-brand-deep/65">
              <span className="mb-1 block font-bold text-brand-deep/80">Response SLA</span>
              Enterprise GRC messages are handled within 12 business hours. Bug reports and security disclosures trigger immediate engineering review.
            </div>
          </section>

          <section className="rounded-2xl border border-brand-green/20 bg-white p-6 shadow-sm md:col-span-7 sm:p-7">
            <h2 className="mb-6 border-b border-brand-green/10 pb-4 text-lg font-bold text-brand-deep">
              Support &amp; Feedback
            </h2>

            {submitted ? (
              <div className="space-y-5 py-12 text-center" role="status" aria-live="polite">
                <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-brand-green" />
                <div className="space-y-1.5">
                  <p className="text-base font-bold text-brand-deep">Your message has been sent.</p>
                  <p className="text-sm text-brand-deep/65">{successMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSuccessMessage("");
                    window.requestAnimationFrame(() => nameRef.current?.focus());
                  }}
                  className="rounded-xl border border-brand-green/30 bg-white px-4 py-2.5 text-sm font-bold text-brand-deep shadow-sm transition-[background-color,border-color,box-shadow] hover:border-brand-green/50 hover:bg-brand-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700"
                  >
                    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-[11px] font-bold uppercase tracking-wider text-brand-deep/65">
                      Your Name
                    </label>
                    <input
                      ref={nameRef}
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      maxLength={CONTACT_NAME_MAX_LENGTH}
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                      onChange={(event) => {
                        setName(event.target.value);
                        clearFieldError("name");
                      }}
                      placeholder="Example: John Doe"
                      className={inputClass(Boolean(fieldErrors.name))}
                    />
                    <FieldError id="contact-name-error" message={fieldErrors.name} />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-[11px] font-bold uppercase tracking-wider text-brand-deep/65">
                      Email Address
                    </label>
                    <input
                      ref={emailRef}
                      id="contact-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      maxLength={CONTACT_EMAIL_MAX_LENGTH}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError("email");
                      }}
                      placeholder="name@company.com"
                      className={inputClass(Boolean(fieldErrors.email))}
                    />
                    <FieldError id="contact-email-error" message={fieldErrors.email} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-topic" className="block text-[11px] font-bold uppercase tracking-wider text-brand-deep/65">
                    Support Category
                  </label>
                  <div className="relative">
                    <select
                      ref={topicRef}
                      id="contact-topic"
                      name="topic"
                      value={topic}
                      aria-invalid={Boolean(fieldErrors.topic)}
                      aria-describedby={fieldErrors.topic ? "contact-topic-error" : "contact-topic-help"}
                      onChange={(event) => {
                        setTopic(event.target.value);
                        clearFieldError("topic");
                        clearFieldError("otherTopic");
                      }}
                      className={`${inputClass(Boolean(fieldErrors.topic))} cursor-pointer appearance-none pr-11`}
                    >
                      {CONTACT_TOPICS.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-deep/55"
                    />
                  </div>
                  <p id="contact-topic-help" className="text-xs text-brand-deep/50">
                    Choose the option that best matches your request.
                  </p>
                  <FieldError id="contact-topic-error" message={fieldErrors.topic} />

                  {topic === "other" && (
                    <div className="mt-3 rounded-xl border border-brand-green/15 bg-brand-cream/35 p-4">
                      <label
                        htmlFor="contact-other-topic"
                        className="block text-[11px] font-bold uppercase tracking-wider text-brand-deep/65"
                      >
                        Please specify
                      </label>
                      <input
                        ref={otherTopicRef}
                        id="contact-other-topic"
                        name="other_topic"
                        type="text"
                        value={otherTopic}
                        maxLength={CONTACT_OTHER_TOPIC_MAX_LENGTH}
                        aria-invalid={Boolean(fieldErrors.otherTopic)}
                        aria-describedby={fieldErrors.otherTopic ? "contact-other-topic-error" : "contact-other-topic-help"}
                        onChange={(event) => {
                          setOtherTopic(event.target.value);
                          clearFieldError("otherTopic");
                        }}
                        placeholder="Example: Partnership or media enquiry"
                        className={`mt-2 ${inputClass(Boolean(fieldErrors.otherTopic))}`}
                      />
                      <div className="mt-1.5 flex items-start justify-between gap-3">
                        <p id="contact-other-topic-help" className="text-xs text-brand-deep/50">
                          Briefly describe your category.
                        </p>
                        <span className="shrink-0 text-[11px] font-medium text-brand-deep/45">
                          {otherTopic.length}/{CONTACT_OTHER_TOPIC_MAX_LENGTH}
                        </span>
                      </div>
                      <FieldError id="contact-other-topic-error" message={fieldErrors.otherTopic} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-end justify-between gap-4">
                    <label htmlFor="contact-message" className="block text-[11px] font-bold uppercase tracking-wider text-brand-deep/65">
                      Message
                    </label>
                    <span className="text-[11px] font-medium text-brand-deep/50">
                      {message.length}/{CONTACT_MESSAGE_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    ref={messageRef}
                    id="contact-message"
                    name="message"
                    rows={6}
                    value={message}
                    maxLength={CONTACT_MESSAGE_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "contact-message-error" : "contact-message-help"}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      clearFieldError("message");
                    }}
                    placeholder="Detail your inquiry, feedback, or technical issue..."
                    className={`${inputClass(Boolean(fieldErrors.message))} resize-y`}
                  />
                  <p id="contact-message-help" className="text-xs text-brand-deep/55">
                    Include enough detail for our team to understand your request. Do not include passwords or secret keys.
                  </p>
                  <FieldError id="contact-message-error" message={fieldErrors.message} />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-3.5 text-sm font-bold text-white shadow-md shadow-brand-green/15 transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

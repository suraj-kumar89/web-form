"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Value = string | string[] | undefined;

type FormState = {
  need?: string;
  goal?: string;
  stage?: string;
  channels?: string[];
  currentUrl?: string;
  problems?: string[];
  revenue?: string;
  platform?: string;
  pageFor?: string;
  adspend?: string;
  pageCount?: string;
  budget?: string;
  timeline?: string;
  company?: string;
  notes?: string;
  name?: string;
  phone?: string;
  email?: string;
};

type Option = {
  value: string;
  title?: string;
  desc?: string;
  score?: number;
  decline?: boolean;
};

type Question = {
  key: keyof FormState;
  type: "single" | "multi" | "text" | "textarea" | "phone" | "email";
  label: string;
  title: string;
  help?: string;
  required: boolean;
  branch?: string;
  options?: Option[];
  placeholder?: string;
  autocomplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error: string;
  cards?: boolean;
};

const CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "916379017116",
  calculatorUrl:
    process.env.NEXT_PUBLIC_CALCULATOR_URL || "https://shitanshu.digital/",
};

const branchLabels: Record<number, string> = {
  1: "The project",
  2: "Commercial",
  3: "Your details",
};

const questions: Question[] = [
  {
    key: "need",
    type: "single",
    label: "Project",
    title: "What do you need?",
    required: true,
    error: "Pick one to carry on.",
    cards: true,
    options: [
      {
        value: "A new website",
        desc: "Starting fresh, or replacing something basic.",
      },
      {
        value: "A redesign",
        desc: "You have a site. It isn't pulling its weight.",
      },
      {
        value: "A landing page",
        desc: "For a campaign, launch or specific offer.",
      },
    ],
  },

  // NEW WEBSITE
  {
    key: "goal",
    type: "single",
    branch: "A new website",
    label: "Site goal",
    title: "What does the site need to do?",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "Sell products directly", score: 3 },
      { value: "Generate leads and enquiries", score: 3 },
      { value: "Both", score: 3 },
      {
        value: "Mostly credibility, we sell offline",
        title: "Mostly credibility",
        desc: "We sell offline.",
        score: 0,
      },
    ],
  },
  {
    key: "stage",
    type: "single",
    branch: "A new website",
    label: "Business size",
    title: "What's the business doing right now?",
    help: "Offline sales, marketplaces and Instagram all count. We're sizing the business, not the website.",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "₹25L+ a month", score: 4 },
      { value: "₹5L to ₹25L a month", score: 3 },
      { value: "Under ₹5L a month", score: 1 },
      { value: "Nothing yet, we're launching", score: 0 },
    ],
  },
  {
    key: "channels",
    type: "multi",
    branch: "A new website",
    label: "Traffic sources",
    title: "Where will the traffic come from?",
    help: "Pick as many as apply.",
    required: true,
    error: "Pick at least one.",
    options: [
      { value: "Meta ads", score: 3 },
      { value: "Google ads", score: 3 },
      { value: "SEO and organic search", score: 2 },
      { value: "Instagram and word of mouth" },
      { value: "Marketplaces like Amazon or Nykaa" },
      { value: "Not sure yet" },
    ],
  },

  // REDESIGN
  {
    key: "currentUrl",
    type: "text",
    branch: "A redesign",
    label: "Current site",
    title: "What's the current site?",
    help: "We'll look at it properly before we call you.",
    required: true,
    error: "We need the URL to review the site.",
    placeholder: "yourbrand.com",
    autocomplete: "url",
    inputMode: "url",
  },
  {
    key: "problems",
    type: "multi",
    branch: "A redesign",
    label: "What's wrong",
    title: "What's not working?",
    help: "Pick as many as apply.",
    required: true,
    error: "Pick at least one.",
    options: [
      { value: "Traffic comes but doesn't convert", score: 3 },
      { value: "Looks dated, hurts credibility" },
      { value: "Too slow" },
      { value: "Can't update it without a developer" },
      { value: "Doesn't work properly on mobile" },
    ],
  },
  {
    key: "revenue",
    type: "single",
    branch: "A redesign",
    label: "Monthly revenue",
    title: "Monthly revenue through the site?",
    help: "This is how we work out what a conversion lift is actually worth to you.",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "₹1Cr+", score: 4 },
      { value: "₹25L to ₹1Cr", score: 4 },
      { value: "₹5L to ₹25L", score: 3 },
      { value: "Under ₹5L", score: 1 },
      { value: "Not selling online yet", score: 0 },
    ],
  },
  {
    key: "platform",
    type: "single",
    branch: "A redesign",
    label: "Platform",
    title: "What's it built on?",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "Shopify" },
      { value: "WordPress" },
      { value: "Wix, Squarespace or similar" },
      { value: "Custom build" },
      { value: "Not sure" },
    ],
  },

  // LANDING PAGE
  {
    key: "pageFor",
    type: "single",
    branch: "A landing page",
    label: "Page purpose",
    title: "What's the page for?",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "A paid campaign, cold traffic", score: 3 },
      { value: "A product launch", score: 2 },
      { value: "Webinar or event registration", score: 2 },
      { value: "Lead generation for a service", score: 3 },
    ],
  },
  {
    key: "adspend",
    type: "single",
    branch: "A landing page",
    label: "Monthly ad spend",
    title: "Monthly ad spend behind it?",
    help: "A page only earns its cost if there's traffic hitting it.",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "₹20L+", score: 4 },
      { value: "₹5L to ₹20L", score: 4 },
      { value: "₹1L to ₹5L", score: 2 },
      { value: "Under ₹1L", score: 0 },
      { value: "Not running ads yet", score: 0 },
    ],
  },
  {
    key: "pageCount",
    type: "single",
    branch: "A landing page",
    label: "How many pages",
    title: "How many pages?",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "Just one" },
      { value: "Two to three variants for testing", score: 2 },
      { value: "Five or more", score: 2 },
    ],
  },

  // STEP 2
  {
    key: "budget",
    type: "single",
    label: "Budget",
    title: "Rough budget?",
    required: true,
    error: "Pick a range so we know where to start.",
    options: [
      { value: "₹5,00,000+", score: 4 },
      { value: "₹2,50,000 to ₹5,00,000", score: 3 },
      { value: "₹1,00,000 to ₹2,50,000", score: 2 },
      { value: "Under ₹1,00,000", score: -20, decline: true },
      { value: "Not sure, I want a recommendation", score: 1 },
    ],
  },
  {
    key: "timeline",
    type: "single",
    label: "Start date",
    title: "When do you want to start?",
    required: true,
    error: "Pick one to carry on.",
    options: [
      { value: "This week", score: 3 },
      { value: "Within two weeks", score: 3 },
      { value: "Within a month", score: 2 },
      { value: "Just exploring", score: 0 },
    ],
  },
  {
    key: "company",
    type: "text",
    label: "Company",
    title: "Company or brand name",
    required: true,
    error: "We need a name to look you up.",
    placeholder: "Your brand",
    autocomplete: "organization",
  },
  {
    key: "notes",
    type: "textarea",
    label: "Notes",
    title: "Anything else we should know?",
    help: "Optional, but it makes the first call much better.",
    required: false,
    error: "",
    placeholder: "What you sell, what's stuck, what you're trying to fix.",
  },

  // STEP 3
  {
    key: "name",
    type: "text",
    label: "Name",
    title: "Your name",
    required: true,
    error: "Tell us who we're speaking to.",
    placeholder: "Founder name",
    autocomplete: "name",
  },
  {
    key: "phone",
    type: "phone",
    label: "WhatsApp",
    title: "WhatsApp number",
    help: "We'll use this to contact you about the project.",
    required: true,
    error: "Enter a 10 digit Indian mobile number.",
    placeholder: "98765 43210",
    autocomplete: "tel-national",
    inputMode: "numeric",
  },
  {
    key: "email",
    type: "email",
    label: "Email",
    title: "Email",
    required: true,
    error: "Enter a valid email address.",
    placeholder: "you@company.com",
    autocomplete: "email",
    inputMode: "email",
  },
];

function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as typeof window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...(data || {}) });
}

function captureTrackingParams() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "wbraid",
    "gbraid",
  ];

  const out: Record<string, string> = {};
  keys.forEach((key) => {
    const value = params.get(key);
    if (value) out[key] = value;
  });

  out.referrer = document.referrer || "direct";
  out.landing_page = window.location.href;

  return out;
}

function getQuestionsForStep(step: number, state: FormState) {
  return questions.filter(
    (q) =>
      (step === 1 &&
        (q.key === "need" || q.branch === state.need)) ||
      (step === 2 &&
        ["budget", "timeline", "company", "notes"].includes(q.key)) ||
      (step === 3 && ["name", "phone", "email"].includes(q.key)),
  );
}

function getOption(question: Question, value: string) {
  return question.options?.find((option) => option.value === value);
}

function scoreLead(state: FormState) {
  let total = 0;

  questions.forEach((question) => {
    const value = state[question.key];

    if (Array.isArray(value)) {
      value.forEach((item) => {
        total += getOption(question, item)?.score || 0;
      });
    } else if (typeof value === "string") {
      total += getOption(question, value)?.score || 0;
    }
  });
  

  const declined = getOption(
    questions.find((q) => q.key === "budget")!,
    state.budget || "",
  )?.decline;

  if (declined) return { score: total, band: "Decline" };
  if (total >= 10) return { score: total, band: "Hot" };
  if (total >= 6) return { score: total, band: "Warm" };
  return { score: total, band: "Nurture" };
}

function IconArrow() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 7h10m0 0L7 2m5 5L7 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Header() {
  const href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(
    "Hi Bluvo, I'd like to talk about a website project.",
  )}`;

  return (
    <header>
      <div className="wrap">
        <div className="brand">
          <img
            src="/bluvo-logo.png"
            alt="Bluvo Studio"
            className="brand-logo"
          />
          <a
            className="brand-cta"
            href={href}
            target="_blank"
            rel="noopener"
            onClick={() => pushEvent("header_cta_click")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 12.05C20 16.47 16.42 20.05 12 20.05C10.59 20.05 9.27 19.68 8.13 19.04L4 20.05L5.08 16.08C4.39 14.9 4 13.53 4 12.05C4 7.63 7.58 4.05 12 4.05C16.42 4.05 20 7.63 20 12.05Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.2 10.2C9.2 10.2 9.7 13 12.7 14.3C12.7 14.3 13.5 13.7 14 13.8C14.5 13.9 15.7 14.8 15.7 15.2C15.7 15.6 15 16.5 13.9 16.5C12.8 16.5 10.9 15.9 9.3 14.4C7.7 12.9 7 11.1 7 10C7 8.9 7.9 8.2 8.3 8.2C8.7 8.2 9.5 9.4 9.6 9.9C9.7 10.3 9.2 10.2 9.2 10.2Z"
                fill="currentColor"
              />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-eyebrow mono">
          <span className="hero-eyebrow-dot" />
          Website development
        </div>
        <h1>
          Tell us what you&apos;re <em>building</em>.
        </h1>
        <p className="hero-sub">
          We&apos;re the performance marketing team that also builds the site.
          Answer a few questions and we&apos;ll come back with a real scope,{" "}
          <strong>not a template quote</strong>.
        </p>
        <div className="proof">
          <div className="proof-item">
            <div className="proof-value">
              ₹40Cr<span className="accent">+</span>
            </div>
            <div className="proof-label">AD SPEND MANAGED</div>
          </div>
          <div className="proof-item">
            <div className="proof-value">
              68<span className="accent">+</span>
            </div>
            <div className="proof-label">SITES SHIPPED</div>
          </div>
          <div className="proof-item">
            <div className="proof-value">
              21<span className="accent">d</span>
            </div>
            <div className="proof-label">TYPICAL BUILD</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="progress">
      <div className="wrap">
        <div className="progress-row">
          <span className="progress-step-label mono">
            Step {step} of 3 · {branchLabels[step]}
          </span>
          <span className="progress-count mono">
            {step === 3
              ? "Last step"
              : step === 2
                ? "Almost there"
                : "About 90 seconds"}
          </span>
        </div>
        <div className="progress-bars">
          {[1, 2, 3].map((n) => (
            <div
              className={`progress-seg ${
                n < step ? "done" : n === step ? "active" : ""
              }`}
              data-seg={n}
              key={n}
            >
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  question,
  option,
  selected,
  onClick,
}: {
  question: Question;
  option: Option;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`opt ${selected ? "selected" : ""}`}
      data-value={option.value}
      tabIndex={0}
      role={question.type === "multi" ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <span className="opt-mark" />
      <span className="opt-text">
        <span className="opt-title">{option.title || option.value}</span>
        {option.desc && <span className="opt-desc">{option.desc}</span>}
      </span>
    </div>
  );
}

function QuestionField({
  question,
  state,
  error,
  onOption,
  onInput,
}: {
  question: Question;
  state: FormState;
  error: boolean;
  onOption: (question: Question, value: string) => void;
  onInput: (question: Question, value: string) => void;
}) {
  const value = state[question.key];

  const selected = (option: Option) =>
    Array.isArray(value)
      ? value.includes(option.value)
      : value === option.value;

  return (
    <div
      className={`q ${error ? "invalid" : ""}`}
      data-key={question.key}
      data-type={question.type}
    >
      <div className="q-label">{question.title}</div>
      {question.help && <div className="q-help">{question.help}</div>}

      <div className="q-body">
        {question.key === "budget" && (
          <div className="anchor">
            <p className="anchor-text">
              Most of our website projects land between{" "}
              <strong>₹1.5L and ₹4L</strong>, depending on scope. We&apos;re
              not the cheapest and we&apos;d rather say that now than on the
              call.
            </p>
          </div>
        )}

        {question.options && (
          <div
            className={`opts ${
              question.type === "multi" ? "multi" : ""
            } ${question.cards ? "cards" : ""}`}
          >
            {question.options.map((option) => (
              <OptionCard
                key={option.value}
                question={question}
                option={option}
                selected={selected(option)}
                onClick={() => onOption(question, option.value)}
              />
            ))}
          </div>
        )}

        {["text", "textarea", "phone", "email"].includes(question.type) && (
          <div className={question.type === "phone" ? "phone-row" : "field"}>
            {question.type === "phone" && (
              <span className="phone-prefix">+91</span>
            )}
            {question.type === "textarea" ? (
              <textarea
                className="textarea"
                value={typeof value === "string" ? value : ""}
                placeholder={question.placeholder}
                onChange={(event) => onInput(question, event.target.value)}
              />
            ) : (
              <input
                className="input"
                type={
                  question.type === "email"
                    ? "email"
                    : question.type === "phone"
                      ? "tel"
                      : "text"
                }
                inputMode={question.inputMode}
                maxLength={question.type === "phone" ? 10 : undefined}
                autoComplete={question.autocomplete}
                placeholder={question.placeholder}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onInput(question, event.target.value)}
              />
            )}
          </div>
        )}

        {question.error && (
          <div className={`err ${error ? "show" : ""}`}>
            <span>{question.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Review({
  state,
  onEdit,
}: {
  state: FormState;
  onEdit: () => void;
}) {
  const visible = [1, 2].flatMap((step) =>
    getQuestionsForStep(step, state).filter((q) => {
      const value = state[q.key];
      return value && (!Array.isArray(value) || value.length > 0);
    }),
  );

  return (
    <div className="review">
      <div className="review-head">
        <span className="review-title mono">Your answers</span>
        <button type="button" className="review-edit" onClick={onEdit}>
          Edit answers
        </button>
      </div>
      {visible.map((question) => {
        const value = state[question.key] as Value;
        return (
          <div className="review-row" key={String(question.key)}>
            <div className="review-key">{question.label}</div>
            <div className="review-val">
              {Array.isArray(value) ? value.join(", ") : value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepThreeExtra() {
  return (
    <>
      <div className="proofcard">
        <div className="proofcard-label mono">One of ours · HOYVS</div>
        <div className="proofcard-stat">
          1.6<span className="accent">%</span>
          <span className="arrow">→</span>
          14<span className="accent">%</span>
        </div>
        <p className="proofcard-text">
          A brand on the verge of shutting down. Same product, same category,
          different architecture.
        </p>
      </div>
      <p className="consent">
        By sending this, you agree to be contacted about your project.
      </p>
    </>
  );
}

function Navigation({
  step,
  navNote,
  loading,
  onBack,
  onNext,
}: {
  step: number;
  navNote: string;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="nav">
      <div className="wrap">
        <div className="nav-inner">
          {step !== 1 && (
            <button
              className="btn btn-back"
              type="button"
              aria-label="Go back"
              onClick={onBack}
              disabled={loading}
            >
              <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M9 12L4 7L9 2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <button
            className="btn btn-primary"
            type="button"
            onClick={onNext}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Sending</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? "Send my details" : "Continue"}</span>
                <IconArrow />
              </>
            )}
          </button>
        </div>
        <p className="nav-note mono">{navNote}</p>
      </div>
    </div>
  );
}

function SuccessView({ name }: { name: string }) {
  const firstName = name.split(" ")[0] || "there";
  const message = `Hi Bluvo, I just submitted the form. I'm ${name} from ${
    // This is replaced below through the parent-generated URL when rendered.
    "my company"
  }, looking for a website project.`;

  // The actual WhatsApp URL is supplied by the parent through the same state.
  void message;

  return (
    <div className="end active">
      <div className="wrap">
        <div className="end-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12.5l5.5 5.5L20 7" />
          </svg>
        </div>
        <h2>
          You&apos;re <em>in</em>.
        </h2>
        <p className="end-sub">
          We&apos;ve got your details, <strong>{firstName}</strong>. Here&apos;s
          exactly what happens next.
        </p>

        <div className="next">
          <div className="next-label mono">What happens next</div>
          <div className="next-item">
            <div className="next-num">1</div>
            <div>
              <div className="next-title">We look at your business</div>
              <div className="next-desc">
                Your site, your category, your funnel. We come to the
                conversation having already done the reading.
              </div>
              <span className="next-time">Usually the same working day</span>
            </div>
          </div>
          <div className="next-item">
            <div className="next-num">2</div>
            <div>
              <div className="next-title">We message you on WhatsApp</div>
              <div className="next-desc">
                A few questions to pin down scope, and an honest read on
                whether we&apos;re the right fit.
              </div>
            </div>
          </div>
          <div className="next-item">
            <div className="next-num">3</div>
            <div>
              <div className="next-title">You get a real scope and price</div>
              <div className="next-desc">
                Fixed quote, clear deliverables, a delivery date. Nothing gets
                sprung on you later.
              </div>
            </div>
          </div>
        </div>

        <div className="end-actions">
          <a className="end-link secondary" href="https://www.bluvo.studio/#work" target="_blank" rel="noopener">
            See the work while you wait
          </a>
        </div>
      </div>
    </div>
  );
}

function DeclineView() {
  return (
    <div className="end active">
      <div className="wrap">
        <div className="end-icon neutral">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 8v5" />
            <path d="M12 16.5v.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h2>
          Honest answer: we&apos;re probably <em>not</em> the right fit.
        </h2>
        <p className="end-sub">
          At under ₹1,00,000, we can&apos;t build the thing we&apos;d want to
          put our name on. Telling you now beats wasting your afternoon on a
          call. <strong>Here&apos;s what we&apos;d do in your position.</strong>
        </p>

        <div className="next">
          <div className="next-label mono">What we&apos;d actually suggest</div>

          <div className="next-item">
            <div className="next-num">1</div>
            <div>
              <div className="next-title">Work out your break-even first</div>
              <div className="next-desc">
                Before you spend anything on a site, know what a customer is
                worth to you. Our calculator does it in about a minute, free.
              </div>
            </div>
          </div>

          <div className="next-item">
            <div className="next-num">2</div>
            <div>
              <div className="next-title">
                Start on a good template, not a bad custom build
              </div>
              <div className="next-desc">
                At this budget a well-chosen Shopify theme, set up properly,
                will beat a cheap bespoke site every time.
              </div>
            </div>
          </div>

          <div className="next-item">
            <div className="next-num">3</div>
            <div>
              <div className="next-title">Come back when the maths works</div>
              <div className="next-desc">
                Once you&apos;re selling and running ads, a rebuild pays for
                itself. We&apos;ll still be here.
              </div>
            </div>
          </div>
        </div>

        <div className="end-actions">
          <a
            className="end-link primary"
            href={CONFIG.calculatorUrl}
            target="_blank"
            rel="noopener"
          >
            Try the break-even ROAS calculator
          </a>
          <a
            className="end-link secondary"
            href="https://www.bluvo.studio/"
            target="_blank"
            rel="noopener"
          >
            Look around the site instead
          </a>
        </div>
        <p className="end-foot">
          We&apos;d rather be straight with you than sell you something that
          won&apos;t work.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  const [state, setState] = useState<FormState>({});
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "decline" | null>(null);

  const startedAt = useRef(Date.now());
  const trackingParams = useRef<Record<string, string>>({});

  useEffect(() => {
    trackingParams.current = captureTrackingParams();
    pushEvent("form_view");
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = result ? "0" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [result]);

  const visibleQuestions = useMemo(
    () => getQuestionsForStep(step, state),
    [step, state],
  );

  const navNote = useMemo(() => {
    if (step === 3) return "";

    const left = visibleQuestions.filter((question) => {
      if (!question.required) return false;
      const value = state[question.key];
      return Array.isArray(value)
        ? value.length === 0
        : !(value && String(value).trim().length > 1);
    }).length;

    return left === 0
      ? `Step ${step} complete`
      : `${left} question${left === 1 ? "" : "s"} left`;
  }, [step, state, visibleQuestions]);

  function clearBranchFields(nextNeed: string) {
    setState((previous) => {
      const next = { ...previous, need: nextNeed };

      questions
        .filter((question) => question.branch && question.branch !== nextNeed)
        .forEach((question) => {
          delete next[question.key];
        });

      return next;
    });

    setErrors((previous) => {
      const next = { ...previous };
      questions
        .filter((question) => question.branch && question.branch !== nextNeed)
        .forEach((question) => {
          delete next[String(question.key)];
        });
      return next;
    });
  }

  function handleOption(question: Question, optionValue: string) {
    if (question.type === "multi") {
      setState((previous) => {
        const current = Array.isArray(previous[question.key])
          ? [...(previous[question.key] as string[])]
          : [];

        const index = current.indexOf(optionValue);

        if (index >= 0) current.splice(index, 1);
        else current.push(optionValue);

        return {
          ...previous,
          [question.key]: current.length ? current : undefined,
        };
      });
    } else if (question.key === "need") {
      clearBranchFields(optionValue);
      pushEvent("form_branch_selected", { branch: optionValue });
    } else {
      setState((previous) => ({
        ...previous,
        [question.key]: optionValue,
      }));
    }

    setErrors((previous) => ({
      ...previous,
      [String(question.key)]: false,
    }));
  }

  function handleInput(question: Question, rawValue: string) {
    const value =
      question.type === "phone"
        ? rawValue.replace(/\D/g, "").slice(0, 10)
        : rawValue.trimStart();

    setState((previous) => ({
      ...previous,
      [question.key]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [String(question.key)]: false,
    }));
  }

  function validateCurrentStep() {
    let ok = true;
    let firstBad: HTMLElement | null = null;
    const nextErrors: Record<string, boolean> = {};

    visibleQuestions.forEach((question) => {
      if (!question.required) return;

      const value = state[question.key];
      let good = true;

      if (question.type === "multi") {
        good = Array.isArray(value) && value.length > 0;
      } else if (question.type === "phone") {
        good = /^[6-9]\d{9}$/.test(value || "");
      } else if (question.type === "email") {
        good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value || "");
      } else {
        good = !!(value && String(value).trim().length > 1);
      }

      nextErrors[String(question.key)] = !good;

      if (!good && !firstBad) {
        firstBad = document.querySelector(
          `.q[data-key="${String(question.key)}"]`,
        );
        ok = false;
      }
    });

    setErrors(nextErrors);

    if (firstBad) {
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return ok;
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setLoading(true);

    const scored = scoreLead(state);

    const payload = {
      submitted_at: new Date().toISOString(),
      need: state.need || "",
      goal: state.goal || "",
      stage: state.stage || "",
      channels: Array.isArray(state.channels) ? state.channels : [],
      current_url: state.currentUrl || "",
      problems: Array.isArray(state.problems) ? state.problems : [],
      revenue: state.revenue || "",
      platform: state.platform || "",
      page_for: state.pageFor || "",
      ad_spend: state.adspend || "",
      page_count: state.pageCount || "",
      budget: state.budget || "",
      timeline: state.timeline || "",
      company: state.company || "",
      notes: state.notes || "",
      name: state.name || "",
      phone: `+91${state.phone || ""}`,
      email: state.email || "",
      lead_score: scored.score,
      lead_band: scored.band,
      time_to_complete_sec: Math.round(
        (Date.now() - startedAt.current) / 1000,
      ),
      ...trackingParams.current,
    };

    pushEvent("generate_lead", {
      lead_band: scored.band,
      lead_score: scored.score,
      project_type: payload.need,
      budget: payload.budget,
    });

    try {
      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: payload,
      });

      if (error) {
        console.error("[Bluvo] Supabase submission failed:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.message || "Lead submission failed.");
      }

      if (scored.band === "Decline") {
        setResult("decline");
        pushEvent("lead_declined");
      } else {
        setResult("success");
      }

      window.scrollTo({ top: 0 });
    } catch (error: unknown) {
      console.error("[Bluvo] Submit failed:", error);

      // IMPORTANT:
      // Do NOT show the success screen when the Edge Function returns
      // a non-2xx response. That would make a failed submission look
      // successful to the user.
      let message = "We couldn't submit your details. Please try again.";

      if (error && typeof error === "object") {
        const functionsError = error as {
          message?: string;
          context?: Response;
        };

        // Supabase FunctionsHttpError exposes the Edge Function response
        // through `context`.
        if (functionsError.context instanceof Response) {
          console.error(
            "[Bluvo] Edge Function HTTP status:",
            functionsError.context.status,
          );

          try {
            const responseText = await functionsError.context.text();

            console.error(
              "[Bluvo] Edge Function response:",
              responseText,
            );

            if (responseText) {
              try {
                const responseJson = JSON.parse(responseText) as {
                  message?: string;
                  error?: string;
                };

                message =
                  responseJson.message ||
                  responseJson.error ||
                  message;
              } catch {
                // The function may return plain text instead of JSON.
                message = responseText;
              }
            }
          } catch (readError) {
            console.error(
              "[Bluvo] Could not read Edge Function response:",
              readError,
            );
          }
        } else if (functionsError.message) {
          message = functionsError.message;
        }
      }

      // Keep the user on the form so they can retry.
      setResult(null);

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (!validateCurrentStep()) return;

    if (step === 1) {
      pushEvent("form_step_1", { branch: state.need });
      goToStep(2);
      return;
    }

    if (step === 2) {
      pushEvent("form_step_2", { budget: state.budget });
      goToStep(3);
      return;
    }

    void submit();
  }

  if (result === "success") {
    const message = `Hi Bluvo, I just submitted the form. I'm ${
      state.name || ""
    } from ${state.company || ""}, looking for: ${state.need || ""}.`;

    const waHref = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(
      message,
    )}`;

    return (
      <div>
        <div className="end active">
          <div className="wrap">
            <div className="end-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12.5l5.5 5.5L20 7" />
              </svg>
            </div>
            <h2>
              You&apos;re <em>in</em>.
            </h2>
            <p className="end-sub">
              We&apos;ve got your details,{" "}
              <strong>{state.name?.split(" ")[0] || "there"}</strong>. Here&apos;s
              exactly what happens next.
            </p>

            <div className="next">
              <div className="next-label mono">What happens next</div>

              <div className="next-item">
                <div className="next-num">1</div>
                <div>
                  <div className="next-title">
                    We look at your business
                  </div>
                  <div className="next-desc">
                    Your site, your category, your funnel. We come to the
                    conversation having already done the reading.
                  </div>
                  <span className="next-time">
                    Usually the same working day
                  </span>
                </div>
              </div>

              <div className="next-item">
                <div className="next-num">2</div>
                <div>
                  <div className="next-title">
                    We message you on WhatsApp
                  </div>
                  <div className="next-desc">
                    A few questions to pin down scope, and an honest read on
                    whether we&apos;re the right fit.
                  </div>
                </div>
              </div>

              <div className="next-item">
                <div className="next-num">3</div>
                <div>
                  <div className="next-title">
                    You get a real scope and price
                  </div>
                  <div className="next-desc">
                    Fixed quote, clear deliverables, a delivery date. Nothing
                    gets sprung on you later.
                  </div>
                </div>
              </div>
            </div>

            <div className="end-actions">
              <a
                className="end-link primary"
                href={waHref}
                target="_blank"
                rel="noopener"
              >
                Message us now on WhatsApp
              </a>
              <a
                className="end-link secondary"
                href="https://www.bluvo.studio/#work"
                target="_blank"
                rel="noopener"
              >
                See the work while you wait
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result === "decline") {
    return <DeclineView />;
  }

  return (
    <div id="formView">
      <Header />
      <Hero />
      <Progress step={step} />

      <main>
        <div className="wrap">
          <section className="step active" data-step={step}>
            {visibleQuestions.map((question) => (
              <QuestionField
                key={String(question.key)}
                question={question}
                state={state}
                error={Boolean(errors[String(question.key)])}
                onOption={handleOption}
                onInput={handleInput}
              />
            ))}

            {step === 3 && (
              <>
                <Review
                  state={state}
                  onEdit={() => {
                    goToStep(1);
                  }}
                />
                <StepThreeExtra />
              </>
            )}
          </section>
        </div>
      </main>

      <Navigation
        step={step}
        navNote={navNote}
        loading={loading}
        onBack={() => goToStep(step - 1)}
        onNext={handleNext}
      />

      <footer>
        <div className="wrap">
          <p className="foot-text">
            Bluvo Studio, part of Bluvo Digital Pvt Ltd.
            <br />
            <a href="mailto:hello@bluvo.studio">hello@bluvo.studio</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
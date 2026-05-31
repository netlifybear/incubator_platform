"use client";

import { useState, useCallback, useActionState } from "react";
import type { ReviewActionState } from "./actions";
import { useReviewQuality } from "@/hooks/useReviewQuality";
import { QualityFeedbackPanel } from "@/app/components/quality-feedback-panel";
import { PreSubmissionModal } from "@/app/components/pre-submission-modal";
import { CelebrationToast } from "@/app/components/celebration-toast";
import { composeFromTemplate, emptyTemplate, type ReviewTemplateData } from "@/lib/review-template";
import founderRules from "@/config/review-rules-founder.json" with { type: "json" };
import consumerRules from "@/config/review-rules-consumer.json" with { type: "json" };

type ReviewFormProps = {
  action: (state: ReviewActionState, formData: FormData) => Promise<ReviewActionState>;
  mode?: "founder" | "consumer";
};

const initialState: ReviewActionState = {};

const MODE_RULES = {
  founder: founderRules,
  consumer: consumerRules,
} as const;

export function ReviewForm({ action, mode = "founder" }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [guided, setGuided] = useState(true);
  const [template, setTemplate] = useState<ReviewTemplateData>(emptyTemplate);
  const [text, setText] = useState("");
  const [disclosed, setDisclosed] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const rules = MODE_RULES[mode];
  const activeText = guided ? composeFromTemplate(template) : text;
  const { warnings, metrics, score, checklist } = useReviewQuality(activeText, rules, disclosed || template.disclosedIncentive);

  const updateTemplate = useCallback((partial: Partial<ReviewTemplateData>) => {
    setTemplate((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      const finalText = guided ? composeFromTemplate(template) : text;
      formData.set("comment", finalText);
      formData.set("disclosedIncentive", (disclosed || template.disclosedIncentive) ? "on" : "");
      if (mode === "founder" && checklist.length > 0 && !checklist.every((c) => c.passed)) {
        setShowChecklist(true);
        return;
      }
      formAction(formData);
    },
    [formAction, disclosed, mode, checklist, guided, template, text],
  );

  const handleFormSubmit = useCallback(
    (formData: FormData) => {
      handleSubmit(formData);
    },
    [handleSubmit],
  );

  const handleChecklistConfirm = useCallback(() => {
    setShowChecklist(false);
    const form = document.querySelector<HTMLFormElement>("form");
    if (form) {
      const fd = new FormData(form);
      fd.set("disclosedIncentive", (disclosed || template.disclosedIncentive) ? "on" : "");
      fd.set("comment", guided ? composeFromTemplate(template) : text);
      formAction(fd);
    }
  }, [formAction, disclosed, guided, template, text]);

  return (
    <>
      <form
        action={handleFormSubmit}
        className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Add a named review</h2>
          <button
            type="button"
            onClick={() => setGuided((g) => !g)}
            className="cursor-pointer rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold transition hover:bg-white"
          >
            {guided ? "Switch to free text" : "Switch to guided"}
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Your name will appear with this review so other founders can judge context and credibility.
        </p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="rating">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          defaultValue="5"
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        >
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Strong</option>
          <option value="3">3 - Mixed</option>
          <option value="2">2 - Weak</option>
          <option value="1">1 - Avoid</option>
        </select>

        {guided ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold" htmlFor="template-service">
                What service or product did you use?
              </label>
              <input
                id="template-service"
                value={template.service}
                onChange={(e) => updateTemplate({ service: e.target.value })}
                placeholder="e.g., Delaware incorporation, monthly bookkeeping, brand design"
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="template-outcome">
                What was the specific outcome or experience?
              </label>
              <textarea
                id="template-outcome"
                value={template.outcome}
                onChange={(e) => updateTemplate({ outcome: e.target.value })}
                placeholder="e.g., They responded within 2 hours and fixed the error same day."
                rows={2}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold" htmlFor="template-positive">
                  One positive aspect
                </label>
                <input
                  id="template-positive"
                  value={template.positive}
                  onChange={(e) => updateTemplate({ positive: e.target.value })}
                  placeholder="e.g., Fast turnaround"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold" htmlFor="template-negative">
                  One constructive point
                </label>
                <input
                  id="template-negative"
                  value={template.negative}
                  onChange={(e) => updateTemplate({ negative: e.target.value })}
                  placeholder="e.g., Expensive compared to alternatives"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="template-would-use">
                Would you use this service again?
              </label>
              <select
                id="template-would-use"
                value={template.wouldUseAgain ?? ""}
                onChange={(e) => updateTemplate({ wouldUseAgain: e.target.value as ReviewTemplateData["wouldUseAgain"] })}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
              </select>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Preview</p>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                {activeText || "Your review will appear here as you fill in the fields above."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold" htmlFor="comment">
              What should another founder know?
            </label>
            <textarea
              id="comment"
              name="comment"
              required
              minLength={10}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              placeholder="Share specific context, pricing surprises, turnaround time, or who this vendor is best for."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}

        <QualityFeedbackPanel
          warnings={warnings}
          metrics={metrics}
          score={score}
        />

        {mode === "founder" ? (
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm font-semibold">
            <input
              name="disclosedIncentive"
              type="checkbox"
              checked={disclosed || template.disclosedIncentive}
              onChange={(e) => {
                const checked = e.target.checked;
                setDisclosed(checked);
                updateTemplate({ disclosedIncentive: checked });
              }}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <span>
              I received a discount or free service for this review
              <span className="mt-1 block font-normal leading-6 text-[var(--muted)]">
                FTC requires disclosure of incentivized reviews. Required for founder reviews.
              </span>
            </span>
          </label>
        ) : (
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm font-semibold">
            <input
              name="disclosedIncentive"
              type="checkbox"
              checked={disclosed || template.disclosedIncentive}
              onChange={(e) => {
                const checked = e.target.checked;
                setDisclosed(checked);
                updateTemplate({ disclosedIncentive: checked });
              }}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <span>
              I received a discount or free service for this review
              <span className="mt-1 block font-normal leading-6 text-[var(--muted)]">
                FTC encourages disclosure of incentivized reviews.
              </span>
            </span>
          </label>
        )}

        {guided && template.disclosedIncentive && (
          <div className="mt-3">
            <label className="block text-sm font-semibold" htmlFor="incentive-detail">
              Describe the incentive
            </label>
            <input
              id="incentive-detail"
              value={template.incentiveDetail}
              onChange={(e) => updateTemplate({ incentiveDetail: e.target.value })}
              placeholder="e.g., I received a 10% discount for this honest review"
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
          </div>
        )}

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm font-semibold">
          <input
            name="usedVendor"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--border)]"
          />
          <span>
            I have used this vendor
            <span className="mt-1 block font-normal leading-6 text-[var(--muted)]">
              This helps other founders distinguish firsthand experience from lighter recommendations.
            </span>
          </span>
        </label>

        <label className="mt-5 block text-sm font-semibold" htmlFor="workType">
          What did they help with?
        </label>
        <input
          id="workType"
          name="workType"
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          placeholder="SAFE financing, monthly bookkeeping, brand design..."
        />

        {state.error ? <p className="mt-4 text-sm font-medium text-red-700">{state.error}</p> : null}
        {state.celebration ? (
          <div className="mt-4">
            <CelebrationToast
              pointsEarned={state.celebration.pointsEarned}
              newTotal={state.celebration.newTotal}
              rank={state.celebration.rank}
            />
          </div>
        ) : state.success ? (
          <p className="mt-4 text-sm font-medium text-[var(--accent)]">{state.success}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 cursor-pointer rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding review..." : "Add review"}
        </button>
      </form>

      {showChecklist && (
          <PreSubmissionModal
            checklist={checklist}
            reviewText={activeText}
            onConfirm={handleChecklistConfirm}
            onEdit={() => setShowChecklist(false)}
            disableBypass={mode === "founder" && activeText.length < 20}
          />
      )}
    </>
  );
}

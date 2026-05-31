"use client";

import { useState, useEffect, useRef } from "react";
import {
  analyzeReviewText,
  generateChecklist,
} from "@/lib/review-quality";
import type { AnalysisResult, QualityMetrics, ChecklistItem } from "@/lib/review-quality";
import type { ModeConfig } from "@/lib/review-quality";

export function useReviewQuality(
  text: string,
  modeConfig: ModeConfig,
  disclosed: boolean = false,
  debounceMs: number = 500,
) {
  const [warnings, setWarnings] = useState<AnalysisResult["warnings"]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics>({
    length: 0,
    wordCount: 0,
    hasNumbers: false,
    hasProperNouns: false,
    hasServiceMention: false,
    hasOutcome: false,
    keywordRepetitionDensity: 0,
    hasBothSentiments: false,
    hasExcessivePunctuation: false,
  });
  const [score, setScore] = useState(100);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTextRef = useRef(text);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    prevTextRef.current = text;

    timerRef.current = setTimeout(() => {
      if (text.length === 0) {
        setWarnings([]);
        setScore(100);
        setChecklist([]);
      } else {
        const result = analyzeReviewText(text, modeConfig, disclosed);
        setWarnings(result.warnings);
        setMetrics(result.metrics);
        setScore(result.score);
        setChecklist(generateChecklist(text, disclosed, result.metrics));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, modeConfig, disclosed, debounceMs]);

  return { warnings, metrics, score, checklist };
}

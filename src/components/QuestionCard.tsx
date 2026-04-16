"use client";

import { useState } from "react";
import { VerifyQuestion, AnswerFeedback } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Loader2, CheckCircle, XCircle } from "lucide-react";

const BLOOM_COLORS: Record<string, string> = {
  Remember: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Understand: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Apply: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Analyze: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Evaluate: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Create: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface QuestionCardProps {
  question: VerifyQuestion;
  feedback?: AnswerFeedback | null;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
  isSubmitting?: boolean;
}

export function QuestionCard({
  question,
  feedback,
  onAnswer,
  onContinue,
  isSubmitting,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");

  const progress = ((question.number - 1) / question.totalQuestions) * 100;
  const bloomColor =
    BLOOM_COLORS[question.bloomLevel] ??
    "bg-gray-500/20 text-gray-300 border-gray-500/30";

  const handleSubmit = () => {
    if (question.type === "mcq") {
      if (selected === null) return;
      onAnswer(String.fromCharCode(65 + selected));
    } else if (question.type === "true_false") {
      if (tfAnswer === null) return;
      onAnswer(tfAnswer ? "true" : "false");
    } else {
      // open / scenario
      if (openAnswer.trim().length < 5) return;
      onAnswer(openAnswer.trim());
    }
  };

  const canSubmit =
    !isSubmitting &&
    !feedback &&
    ((question.type === "mcq" && selected !== null) ||
      (question.type === "true_false" && tfAnswer !== null) ||
      ((question.type === "open" || question.type === "scenario") &&
        openAnswer.trim().length >= 5));

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            Question {question.number} of {question.totalQuestions}
          </span>
          <Badge className={`border ${bloomColor} bg-transparent text-xs`}>
            {question.bloomLevel}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5 mb-4" />
        <CardTitle className="text-base font-medium leading-relaxed">
          {question.text}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* MCQ options */}
        {question.type === "mcq" && question.options && (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => { if (!feedback) setSelected(i); }}
                disabled={!!feedback}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                  selected === i
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                } disabled:cursor-not-allowed`}
              >
                <span className="font-mono text-xs mr-3 opacity-60">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* True / False */}
        {question.type === "true_false" && (
          <div className="flex gap-3">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => { if (!feedback) setTfAnswer(val); }}
                disabled={!!feedback}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                  tfAnswer === val
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                } disabled:cursor-not-allowed`}
              >
                {val ? "True" : "False"}
              </button>
            ))}
          </div>
        )}

        {/* Open / Scenario */}
        {(question.type === "open" || question.type === "scenario") && (
          <textarea
            value={openAnswer}
            onChange={e => setOpenAnswer(e.target.value)}
            disabled={!!feedback}
            placeholder="Write your answer here — be specific and use concepts from the document…"
            className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-60"
          />
        )}

        {/* Feedback panel */}
        {feedback && (
          <div
            className={`rounded-lg border p-3 space-y-2 ${
              feedback.correct
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.correct ? (
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  feedback.correct ? "text-green-300" : "text-red-300"
                }`}
              >
                {feedback.correct ? "Correct" : "Incorrect"} — Score:{" "}
                {feedback.score}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feedback.reasoning}
            </p>
            {feedback.dimensions && (
              <div className="grid grid-cols-4 gap-1 pt-1">
                {Object.entries(feedback.dimensions).map(([dim, val]) => (
                  <div key={dim} className="text-center">
                    <div className="text-xs font-mono text-primary">{val}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      {dim}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        {!feedback ? (
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Grading…
              </>
            ) : (
              <>
                Submit Answer <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onContinue} className="w-full gap-2">
            {feedback.isComplete ? "See Results" : "Next Question"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

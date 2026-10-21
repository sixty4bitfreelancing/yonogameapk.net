import type { ReactNode } from "react";

export interface FaqItem {
  question: string;
  answer: ReactNode;
  /** Plain-text version of a non-string answer, for FAQPage markup. Must read the same as the visible answer. */
  text?: string;
}

export function faqPlainText(items: FaqItem[]): { question: string; answer: string }[] {
  return items.flatMap((item) => {
    const answer = typeof item.answer === "string" ? item.answer : item.text;
    return answer ? [{ question: item.question, answer }] : [];
  });
}

export function FAQ({ items }: { items: FaqItem[] }) {
  return (
    <dl className="divide-y divide-gray-200 border-y border-gray-200">
      {items.map((item) => (
        <div key={item.question} className="py-4">
          <dt className="font-medium text-gray-900">{item.question}</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-gray-700">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}

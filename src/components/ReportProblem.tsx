"use client";

import { useId, useState, type FormEvent } from "react";

const KINDS: [string, string][] = [
  ["broken-link", "Broken link"],
  ["changed-link", "Link now points somewhere else"],
  ["wrong-info", "Wrong or outdated information"],
  ["other", "Something else"],
];

export function ReportProblem({ slug, name }: { slug: string; name: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const id = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          kind: form.get("kind"),
          url: form.get("url"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Your report couldn't be sent.");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Your report couldn't be sent.");
    }
  }

  if (status === "sent") {
    return (
      <p role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        Thanks — your report about {name} was received. We review reports and update the page after checking.
      </p>
    );
  }

  return (
    <details className="rounded-lg border border-gray-200 p-4">
      <summary className="-m-4 cursor-pointer p-4 text-sm font-medium text-gray-900">
        Report a broken link, changed link or wrong information
      </summary>
      <form onSubmit={submit} className="mt-3 space-y-3 text-sm">
        <div>
          <label htmlFor={`${id}-kind`} className="block font-medium text-gray-900">
            What’s wrong?
          </label>
          <select id={`${id}-kind`} name="kind" required defaultValue="broken-link" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:w-auto">
            {KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-url`} className="block font-medium text-gray-900">
            Link concerned <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input id={`${id}-url`} name="url" type="url" inputMode="url" placeholder="https://" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label htmlFor={`${id}-message`} className="block font-medium text-gray-900">
            Details
          </label>
          <textarea
            id={`${id}-message`}
            name="message"
            required
            minLength={5}
            maxLength={1000}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor={`${id}-website`}>Leave this empty</label>
          <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <p className="text-xs text-gray-500">
          Don’t include personal details, passwords or OTPs. We store only what you type here, with the date.
        </p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-11 w-full rounded-md bg-blue-700 px-4 font-medium text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
        >
          {status === "sending" ? "Sending…" : "Send report"}
        </button>
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </details>
  );
}

import type { FieldSource, ProvenanceField, SourceOrigin } from "@/data/types";
import { formatDate } from "@/lib/format";

const originLabel: Record<SourceOrigin, string> = {
  "supplied-document": "Imported from the supplied collection document (not verified by import)",
  "local-image": "Matched to a supplied image file",
  editorial: "Editorial note",
  "independent-check": "Independently checked",
};

const fieldLabel: Record<ProvenanceField, string> = {
  name: "Name",
  aliases: "Other names",
  category: "Category",
  image: "Icon",
  banner: "Banner",
  summary: "Summary",
  developer: "Developer",
  sourceUrl: "Official source",
  downloadUrl: "Download page",
  version: "Version",
  addedAt: "Date added",
  checkedAt: "Check date",
  screenshots: "Screenshots",
  notes: "Limitations",
};

export function SourceNote({ provenance }: { provenance: Partial<Record<ProvenanceField, FieldSource>> }) {
  const entries = Object.entries(provenance) as [ProvenanceField, FieldSource][];
  if (!entries.length) return null;
  return (
    <ul className="space-y-2 text-sm text-gray-700">
      {entries.map(([field, source]) => (
        <li key={field}>
          <span className="font-medium text-gray-900">{fieldLabel[field]}:</span> {originLabel[source.origin]}
          {source.checkedAt ? ` on ${formatDate(source.checkedAt)}` : ""}. <span className="text-gray-600">{source.reference}</span>
          {source.note ? <span className="text-gray-600"> {source.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

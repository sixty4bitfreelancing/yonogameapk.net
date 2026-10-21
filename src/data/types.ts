export type AppCategory = "rummy" | "slots" | "spin" | "bingo" | "general" | "collection";

/**
 * published / listed: shown in the directory with its own app page. "published" marks an
 * entry you have researched; what the page shows still depends on `isChecked`.
 * excluded: kept in the inventory only, no page.
 */
export type PublicationStatus = "published" | "listed" | "excluded";

export type SourceOrigin =
  | "supplied-document"
  | "local-image"
  | "editorial"
  | "independent-check";

export interface FieldSource {
  origin: SourceOrigin;
  reference: string;
  note?: string | null;
  checkedAt?: string | null;
}

export type ProvenanceField =
  | "name"
  | "aliases"
  | "category"
  | "image"
  | "banner"
  | "summary"
  | "developer"
  | "sourceUrl"
  | "downloadUrl"
  | "version"
  | "addedAt"
  | "checkedAt"
  | "screenshots"
  | "notes";

export interface AppImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface ImportRecord {
  documentEntry: string;
  documentLabel: string;
  categoryEvidence: string;
  imageFile: string | null;
  imageStatus: "matched" | "matched-manual" | "rejected" | "missing";
  imageNote: string | null;
  exclusionReason: string | null;
}

export interface ImportedApp {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: AppCategory;
  image: AppImage | null;
  /** 16:9 page banner used as the app page's hero background and social preview image. */
  banner: AppImage | null;
  summary: string | null;
  developer: string | null;
  sourceUrl: string | null;
  downloadUrl: string | null;
  version: string | null;
  /** ISO date the entry was genuinely added to the directory. */
  addedAt: string | null;
  /** ISO date of the most recent independent check. Never set by the importer. */
  checkedAt: string | null;
  screenshots: AppImage[];
  notes: string[];
  publicationStatus: PublicationStatus;
  provenance: Partial<Record<ProvenanceField, FieldSource>>;
  importRecord: ImportRecord;
}

export interface DocFaq {
  question: string;
  answer: string;
}

/** Per-entry text from the supplied document, used on app pages. Unverified guidance, not product facts. */
export interface AppDocContent {
  documentEntry: string;
  whatIsIt: string | null;
  clarification: string | null;
  howToSection: string | null;
  howTo: string | null;
  features: string | null;
  understandingSection: string | null;
  understanding: string | null;
  faqs: DocFaq[];
  similarNames: { name: string; slug: string; reason: string }[];
}

export type StatKey =
  | "apkSize"
  | "signupBonus"
  | "downloads"
  | "rating"
  | "support"
  | "minWithdrawal"
  | "encryption"
  | "paymentPartners"
  | "rngCertification"
  | "dataPrivacy"
  | "os"
  | "ram"
  | "storage"
  | "internet"
  | "screen";

/** A quick-stat value is shown only with a named source and the date it was checked. */
export interface SourcedStat {
  value: string;
  /** Where the value was found, e.g. a Google Play listing URL or the app's terms page. */
  source: string;
  checkedAt: string;
  /**
   * "operator": the app operator's own statement; "third-party": another website's claim;
   * "none": a fact we confirmed. Claims are labelled as unconfirmed on the page.
   */
  claim: "none" | "operator" | "third-party";
}

/** A rating published elsewhere (e.g. a store listing). Shown with attribution; never used in structured data. */
export interface ExternalRating {
  value: number;
  count: number | null;
  /** URL of the page showing the rating. */
  source: string;
  checkedAt: string;
}

export interface BonusData {
  source: string;
  checkedAt: string;
  apps: Record<
    string,
    {
      signupBonus: number | null;
      minWithdrawal: number | null;
      sheetName: string;
      rating: { value: number; count: number | null; source: string } | null;
    }
  >;
}

/** A dated, sourced statement about the app. */
export interface DatedNote {
  date: string;
  text: string;
  /** URL or description of where this was observed. */
  source: string | null;
}

export interface AppRecord extends ImportedApp {
  /** Marks `downloadUrl` as an affiliate destination so it renders with rel="sponsored". */
  downloadIsAffiliate: boolean;
  stats: Partial<Record<StatKey, SourcedStat>>;
  externalRating: ExternalRating | null;
  /** Our own editorial score out of 5 from src/data/editor-ratings.ts. Shown as "Editor Score", never as visitor ratings. */
  editorScore: number | null;
  /** The app's own release/update date as published by a source. Separate from our check dates. */
  appUpdate: { date: string; source: string } | null;
  /** Problems observed or reported, each dated. */
  knownIssues: DatedNote[];
  /** Our own checks of this page's information, newest first. */
  verificationLog: DatedNote[];
  /** Bonus eligibility and withdrawal conditions, only from a cited terms page. */
  bonusTerms: DatedNote[];
}

export type AppOverride = Partial<
  Pick<
    AppRecord,
    | "name"
    | "aliases"
    | "category"
    | "image"
    | "banner"
    | "summary"
    | "developer"
    | "sourceUrl"
    | "downloadUrl"
    | "downloadIsAffiliate"
    | "stats"
    | "externalRating"
    | "editorScore"
    | "appUpdate"
    | "knownIssues"
    | "verificationLog"
    | "bonusTerms"
    | "version"
    | "addedAt"
    | "checkedAt"
    | "screenshots"
    | "notes"
    | "publicationStatus"
  >
> & {
  provenance?: Partial<Record<ProvenanceField, FieldSource>>;
};

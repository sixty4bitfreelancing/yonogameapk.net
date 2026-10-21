import type { AppOverride } from "./types";

/**
 * Manual research, keyed by app id (the slug). Values here replace imported values and
 * survive re-running the import script. Record where each fact came from in `provenance`.
 * See README.md for the fields an app needs before it counts as independently checked.
 */
export const appOverrides: Record<string, AppOverride> = {};

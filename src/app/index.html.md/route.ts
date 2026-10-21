import { homeMarkdown, markdownResponse } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return markdownResponse(homeMarkdown(), absoluteUrl("/"));
}

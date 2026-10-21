import { notFound } from "next/navigation";
import { getListing } from "@/data/apps";
import { categoryMarkdown, markdownResponse } from "./markdown";
import { absoluteUrl } from "./site";

export function categoryMarkdownGet(listingId: string) {
  return function GET() {
    const body = categoryMarkdown(listingId);
    const listing = getListing(listingId);
    if (!body || !listing) notFound();
    return markdownResponse(body, absoluteUrl(listing.path));
  };
}

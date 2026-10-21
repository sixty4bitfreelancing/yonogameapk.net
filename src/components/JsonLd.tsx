import { serializeJsonLd, type JsonLdGraph } from "@/lib/jsonld";

export function JsonLd({ data }: { data: JsonLdGraph }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

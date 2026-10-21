import { JsonLd } from "@/components/JsonLd";
import { SimplePage } from "@/components/SimplePage";
import { responsibleGamingCopy } from "@/content/copy";
import { pageTrail } from "@/lib/breadcrumbs";
import { formatDate } from "@/lib/format";
import { breadcrumbNode, graph, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/metadata";
import { staticPages } from "@/lib/pages";

const page = staticPages.responsibleGaming;

export const metadata = pageMetadata({
  title: responsibleGamingCopy.title,
  description: responsibleGamingCopy.description,
  path: page.path,
});

export default function ResponsibleGamingPage() {
  const trail = pageTrail(page.label, page.path);
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            path: page.path,
            name: responsibleGamingCopy.title,
            description: responsibleGamingCopy.description,
            dateModified: page.lastModified,
          }),
          breadcrumbNode(page.path, trail),
        )}
      />
      <SimplePage trail={trail} heading="Responsible Gaming">
        <p className="text-sm text-gray-600">Last updated {formatDate(page.lastModified)}</p>
        <p>
          Games should be entertainment. These suggestions help keep them that way, especially with apps that involve
          deposits, bonuses or cash prizes.
        </p>

        <h2>Know the law</h2>
        <p>
          India’s Promotion and Regulation of Online Gaming Act, 2025 prohibits offering online money games, along with
          their advertising and related payment services. Check the rules that apply to you before depositing money in
          any app.
        </p>

        <h2>Set limits before you play</h2>
        <ul>
          <li>Decide in advance how much time and money you can afford to spend, and stop when you reach it.</li>
          <li>Only play with money you can afford to lose, never with money meant for rent, bills, fees or savings.</li>
          <li>Don’t borrow money or use credit to play.</li>
          <li>Take regular breaks, and don’t play when you are stressed, tired or upset.</li>
          <li>Don’t try to win back losses; a run of losses doesn’t make a win more likely.</li>
        </ul>

        <h2>Warning signs</h2>
        <ul>
          <li>Spending more time or money than you planned, or hiding it from family or friends.</li>
          <li>Feeling restless or irritable when you try to cut down.</li>
          <li>Playing to escape problems, or to recover money you have lost.</li>
          <li>Missing work, studies or sleep because of gaming.</li>
        </ul>

        <h2>Protect yourself from scams</h2>
        <ul>
          <li>Promises of guaranteed earnings, “sure-win” tricks or prediction groups are signs of a scam.</li>
          <li>Never share OTPs, UPI PINs, passwords or card details with anyone contacting you about a game.</li>
          <li>
            Report cyber fraud on the national cybercrime portal at cybercrime.gov.in or by calling the 1930 helpline.
          </li>
        </ul>

        <h2>Getting help</h2>
        <p>
          If gaming is affecting your health, money or relationships, talk to someone you trust. Tele-MANAS, the
          Government of India’s free mental health helpline, is available on <strong>14416</strong>. Most apps also let
          you set limits, take a break or close your account from their settings or support team.
        </p>

        <h2>Young people</h2>
        <p>
          Apps involving money are not suitable for children. Parents can use Google Play’s parental controls or Family
          Link to manage which apps can be installed.
        </p>
      </SimplePage>
    </>
  );
}

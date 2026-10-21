import { CategoryPageView, categoryPageMetadata } from "@/components/CategoryPageView";

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = categoryPageMetadata("rummy");

export default function RummyAppsPage() {
  return (
    <CategoryPageView
      listingId="rummy"
      guidanceHeading="What to check in a rummy app"
      guidance={
        <>
          <p>
            Many rummy apps offer 13-card Indian rummy. The aim is to arrange your hand into valid sequences and sets,
            including at least one pure sequence (a run without a joker), and then declare. On each turn you draw a
            card and discard one. Points, pool and deals rummy score differently, so read the rules for the table you
            join before you start.
          </p>
          <ul>
            <li>A rules screen that explains valid groups, jokers, dropping and scoring for each table type.</li>
            <li>Clear confirmation before a declaration, and a score breakdown after each round.</li>
            <li>What happens when your connection drops in the middle of a hand.</li>
            <li>
              Whether balances are play credits or real money, and the written terms for any bonus or withdrawal.
              Promotional screenshots aren’t terms.
            </li>
          </ul>
          <p>
            Similar names don’t prove that two apps share an operator, an account system or a support team. Check
            the publisher shown inside the app itself.
          </p>
        </>
      }
    />
  );
}

import { CategoryPageView, categoryPageMetadata } from "@/components/CategoryPageView";

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = categoryPageMetadata("slots");

export default function SlotsAppsPage() {
  return (
    <CategoryPageView
      listingId="slots"
      guidanceHeading="What to check in a slots game"
      guidance={
        <>
          <p>
            Open the game’s information panel or paytable before playing. It should show what each symbol pays,
            whether wins are counted on lines or “ways”, and what any wild, scatter or bonus feature does. Compare the
            amount credited after a round with the paytable to understand the net result.
          </p>
          <ul>
            <li>
              If a return-to-player (RTP) percentage is published, it is a long-run statistical average, not what one
              session will return.
            </li>
            <li>
              In games with independent random rounds, a run of losses doesn’t make a win more likely. Tapping
              patterns or the time of day give no advantage.
            </li>
            <li>“Free spins” and jackpots usually come with conditions; read them in the game rules.</li>
            <li>Check whether coins are play credits or redeemable balances, and read the withdrawal terms.</li>
          </ul>
        </>
      }
    />
  );
}

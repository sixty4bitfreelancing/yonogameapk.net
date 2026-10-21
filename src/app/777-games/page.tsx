import { CategoryPageView, categoryPageMetadata } from "@/components/CategoryPageView";

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = categoryPageMetadata("777");

export default function Games777Page() {
  return (
    <CategoryPageView
      listingId="777"
      guidanceHeading="What “777” in an app name tells you"
      guidance={
        <>
          <p>
            “777” is the classic jackpot line on slot machines, so it is popular in game-app names. On its own it
            doesn’t tell you what an app contains: these listings span several categories, and none has been confirmed
            to share a publisher with another.
          </p>
          <ul>
            <li>Check the publisher named inside each app rather than relying on similar names.</li>
            <li>If an app does offer slots, read its paytable before you play.</li>
            <li>Treat any “777” jackpot or bonus claim as a claim until you have read the app’s own terms.</li>
          </ul>
        </>
      }
    />
  );
}

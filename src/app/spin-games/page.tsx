import { CategoryPageView, categoryPageMetadata } from "@/components/CategoryPageView";

/** Re-render hourly so visitor ratings on the app cards stay current. */
export const revalidate = 3600;

export const metadata = categoryPageMetadata("spin");

export default function SpinGamesPage() {
  return (
    <CategoryPageView
      listingId="spin"
      guidanceHeading="What to check in a spin game"
      guidance={
        <>
          <p>
            Before you play, find out what “spin” means in the app you open. On a slot game it starts the reels; on a
            prize wheel it picks one segment; in some apps it is only part of the brand name.
          </p>
          <ul>
            <li>For reels, open the paytable and check how wins are counted and what each symbol pays.</li>
            <li>For a wheel, check the list of segments and the rules for when a spin is free or costs credits.</li>
            <li>
              “Free spins” and daily wheels usually come with conditions. Read them before you rely on a reward.
            </li>
            <li>Each round is independent: past results don’t make a win more likely, and timing tricks don’t help.</li>
          </ul>
        </>
      }
    />
  );
}

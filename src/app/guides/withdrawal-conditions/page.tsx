import Link from "next/link";
import { GuideArticle, guideMetadata } from "@/components/GuideArticle";
import { helpGuide } from "@/content/copy";
import { staticPages } from "@/lib/pages";

const guide = helpGuide("withdrawal");

export const metadata = guideMetadata(guide);

export default function WithdrawalConditionsGuide() {
  return (
    <GuideArticle
      guide={guide}
      intro={
        <>
          <p>
            Apps that advertise a sign-up bonus and a “minimum withdrawal” attach conditions to both. This guide explains
            the terms you will usually meet, so you can read an app’s rules before depositing anything.
          </p>
          <p>
            First, the law: India’s Promotion and Regulation of Online Gaming Act, 2025 prohibits offering online money
            games and related payment services. Check the rules that apply to you before using any app with deposits or
            cash prizes.
          </p>
        </>
      }
    >
      <h2>Terms you will see</h2>
      <ul>
        <li>
          <strong>Minimum withdrawal:</strong> the smallest amount you can request. Your withdrawable balance must reach
          it, after any deductions.
        </li>
        <li>
          <strong>Bonus balance vs. cash balance:</strong> sign-up bonuses are often credited to a separate bonus
          balance that can be used to play but not withdrawn directly.
        </li>
        <li>
          <strong>Wagering or turnover requirement:</strong> you may need to play through the bonus or deposit a set
          number of times before any of it becomes withdrawable.
        </li>
        <li>
          <strong>Verification (KYC):</strong> apps commonly require identity documents before the first withdrawal. A
          name mismatch with your bank account can block payouts.
        </li>
        <li>
          <strong>Limits and processing times:</strong> daily withdrawal caps, a set number of withdrawals per day, and
          processing times are all set in the terms.
        </li>
        <li>
          <strong>Tax:</strong> India’s Income Tax Act (section 194BA) requires tax to be deducted at 30% on net
          winnings from online games, so the amount paid out can be lower than the balance shown. Check the current
          rules with a tax adviser.
        </li>
      </ul>

      <h2>About the figures on our app pages</h2>
      <p>
        Bonus and minimum-withdrawal figures on our app pages are claims published by another website, shown with the
        date they were checked. They don’t describe the conditions above, and we haven’t confirmed them with
        the operators. An app page shows bonus eligibility and withdrawal conditions only when we can cite the app’s own
        terms.
      </p>

      <h2>Warning signs of a withdrawal scam</h2>
      <ul>
        <li>You are asked to pay a “fee”, “tax” or extra deposit before a withdrawal is released.</li>
        <li>Support is only available through Telegram or WhatsApp, or a stranger offers to “unlock” your withdrawal.</li>
        <li>The terms change after you deposit, or the withdrawal button keeps failing without an explanation.</li>
        <li>Anyone asks for your UPI PIN or an OTP to “send” you money; receiving money never needs your PIN.</li>
      </ul>
      <p>
        If you are worried about how much you are spending, see our{" "}
        <Link href={staticPages.responsibleGaming.path}>responsible gaming page</Link>. Report fraud on the national
        cybercrime portal (cybercrime.gov.in) or by calling 1930.
      </p>
    </GuideArticle>
  );
}

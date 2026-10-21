import Link from "next/link";
import { GuideArticle, guideMetadata } from "@/components/GuideArticle";
import { helpGuide } from "@/content/copy";

const guide = helpGuide("login");

export const metadata = guideMetadata(guide);

const STEPS = [
  "Check your connection: switch between Wi-Fi and mobile data, and turn off any VPN, which some apps block.",
  "Make sure the app is up to date. Older versions may stop working when the service changes.",
  "Confirm you are entering the same phone number or user ID you registered with, including the right country code.",
  "Use the app’s own “Forgot password” or OTP login option instead of guessing repeatedly, which can lock the account.",
  "Turn on automatic date and time in your phone’s settings; a wrong clock can make login codes and sessions fail.",
  "Clear the app’s cache (Settings → Apps → the app → Storage → Clear cache). Avoid “Clear data” unless you know your login details, because it signs you out and removes local data.",
  "If the app says your account is blocked or under review, contact the support channel shown inside the app.",
];

export default function LoginProblemsGuide() {
  return (
    <GuideArticle
      guide={guide}
      intro={
        <p>
          Login failures usually come from the connection, an outdated app version, the wrong account details or the
          account itself being restricted. Work through these checks in order. They apply to most Yono game apps, but
          each app’s own help screen and terms take priority.
        </p>
      }
      steps={{ heading: "Checks to try, in order", items: STEPS }}
    >
      <h2>When the problem is the account, not your phone</h2>
      <ul>
        <li>
          Apps can restrict accounts for reasons set out in their terms, such as more than one account per person or
          device, or incomplete verification (KYC). Only the operator can lift that.
        </li>
        <li>
          If an app has stopped operating, logins fail for everyone. India’s Promotion and Regulation of Online Gaming
          Act, 2025 prohibits offering online money games, so some apps may no longer be available.
        </li>
      </ul>
      <h2>Stay safe while getting help</h2>
      <ul>
        <li>Use only the support contact shown inside the app or on its official website.</li>
        <li>
          Never share your password, OTP, UPI PIN or card details with anyone, including people claiming to be support
          staff. Real support teams don’t ask for them.
        </li>
        <li>
          Be wary of “recovery” services that contact you on Telegram or WhatsApp and ask for a fee.
        </li>
      </ul>
      <p>
        Not receiving the login code at all? See <Link href={helpGuide("otp").path}>OTP not received</Link>.
      </p>
    </GuideArticle>
  );
}

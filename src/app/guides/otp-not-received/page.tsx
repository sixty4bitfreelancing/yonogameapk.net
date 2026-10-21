import { GuideArticle, guideMetadata } from "@/components/GuideArticle";
import { helpGuide } from "@/content/copy";

const guide = helpGuide("otp");

export const metadata = guideMetadata(guide);

const STEPS = [
  "Check that the phone number shown in the app is correct, including the country code.",
  "Make sure the SIM for that number is in the phone and has signal; on dual-SIM phones, check the right SIM is active.",
  "Wait at least a minute before tapping Resend. Many apps limit how often codes can be sent and may pause requests after several tries.",
  "Look in your messages app’s spam or “unknown senders” folder, and check that SMS from businesses isn’t blocked.",
  "Free up storage if your phone or SIM message inbox is full, then request a new code.",
  "Turn airplane mode on and off to reconnect to the network, then try again.",
  "If the app offers another way to receive the code, such as a voice call or email, try that.",
];

export default function OtpGuide() {
  return (
    <GuideArticle
      guide={guide}
      intro={
        <p>
          A one-time password (OTP) can be delayed by your network, blocked by message filters or held back because too
          many codes were requested. These checks cover the usual causes. If none work, the delay is likely on the
          app’s side; contact its support from inside the app.
        </p>
      }
      steps={{ heading: "What to check", items: STEPS }}
    >
      <h2>Good to know</h2>
      <ul>
        <li>
          Registering on India’s Do Not Disturb (DND) list generally doesn’t block OTPs, because they are transactional
          messages rather than promotions.
        </li>
        <li>Each code usually expires after a few minutes. Use the newest code you received, not an older one.</li>
        <li>Requesting many codes in a row can trigger a temporary block. Waiting is often quicker than retrying.</li>
      </ul>
      <h2>Keep OTPs private</h2>
      <ul>
        <li>An OTP is as sensitive as a password. Never share it by phone, chat or email, even with “support”.</li>
        <li>
          If you receive a code you didn’t request, someone may be trying to sign in to your account. Don’t share it, and
          change your password in the app.
        </li>
      </ul>
    </GuideArticle>
  );
}

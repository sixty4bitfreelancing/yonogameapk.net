import Link from "next/link";
import { GuideArticle, guideMetadata } from "@/components/GuideArticle";
import { helpGuide } from "@/content/copy";

const guide = helpGuide("update");

export const metadata = guideMetadata(guide);

const STEPS = [
  "Check your current version: open Settings → Apps → the app; the version is usually shown at the bottom of the App info page.",
  "Make sure you know your login details before updating, in case you need to sign in again.",
  "Get the update from the same official source you installed the app from, or use the app’s own in-app update prompt.",
  "Open the downloaded APK and tap Update. Installing over the existing app keeps your data, so don’t uninstall first.",
  "Open the app and confirm the new version number on the App info page.",
];

export default function UpdateGuide() {
  return (
    <GuideArticle
      guide={guide}
      intro={
        <p>
          Apps installed from Google Play update through Play. Apps installed from an APK file don’t: they update
          through an in-app prompt or by installing a newer APK from the same source. Android only accepts an update
          signed with the same key as the installed app, which protects you from look-alike files.
        </p>
      }
      steps={{ heading: "How to update safely", items: STEPS }}
    >
      <h2>If the update won’t install</h2>
      <ul>
        <li>
          <strong>“App not installed” or a conflict message</strong> usually means the new file was signed by someone
          else. It may come from a different source, so check where you downloaded it before doing anything else.
        </li>
        <li>
          Uninstalling the old version first does make the install go through, but it erases the app’s local data. Only
          do it if you are sure the new file is genuine.
        </li>
        <li>
          If the file is damaged or too new for your Android version, see the{" "}
          <Link href={helpGuide("install").path}>installation problems guide</Link>.
        </li>
      </ul>
      <h2>Watch for fake updates</h2>
      <ul>
        <li>Be wary of pop-ups on websites claiming your app is out of date.</li>
        <li>
          An update rarely needs new sensitive permissions, such as SMS, accessibility or display over other apps. If it
          asks for them, stop and check the source.
        </li>
      </ul>
    </GuideArticle>
  );
}

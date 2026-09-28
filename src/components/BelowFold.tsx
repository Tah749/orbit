import { Problem } from "./Problem";
import { Features } from "./Features";
import { Assistant } from "./Assistant";
import { Privacy } from "./Privacy";
import { Integrations } from "./Integrations";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";

/** Everything after the hero, split into its own chunk so the first paint ships less JavaScript. */
export default function BelowFold() {
  return (
    <>
      <Problem />
      <Features />
      <Assistant />
      <Privacy />
      <Integrations />
      <Faq />
      <FinalCta />
    </>
  );
}

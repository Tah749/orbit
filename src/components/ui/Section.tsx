import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  align = "center",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "mx-auto text-center items-center" : "items-start";
  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignCls}`}>
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-accent-fg">{eyebrow}</p>
      )}
      <h2 id={id} className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink md:text-[46px]">
        {title}
      </h2>
      {body && <p className="max-w-[58ch] text-pretty text-[16px] leading-relaxed text-muted md:text-[17px]">{body}</p>}
    </Reveal>
  );
}

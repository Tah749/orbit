import { Page, Screen, SkeletonList } from "../ui";

/** Stand-in for a section screen until its real page is built. Shows the section label over a skeleton list. */
export function Placeholder({ eyebrow, title, back = false, rows = 6 }: { eyebrow?: string; title: string; back?: boolean; rows?: number }) {
  return (
    <Screen back={back}>
      <Page eyebrow={eyebrow} title={title}>
        <SkeletonList rows={rows} />
      </Page>
    </Screen>
  );
}

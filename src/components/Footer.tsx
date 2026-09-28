import { Logo } from "./ui/Logo";

export function Footer({ home = true }: { home?: boolean }) {
  const h = (anchor: string) => (home ? anchor : "#/");
  const cols = [
    { title: "Orbit", links: [["Product", h("#product")], ["Features", h("#features")], ["FAQ", h("#faq")]] },
    { title: "Company", links: [["Contact", "mailto:hello@orbit.example"], ["Privacy", "#/privacy"], ["Terms", "#/terms"]] },
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-[14px] text-muted">Your life, connected.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:gap-20">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="text-[13px] font-medium text-ink">{c.title}</p>
              <ul className="flex flex-col gap-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-[14px] text-muted transition-colors hover:text-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-line/70 px-4 py-6 text-[12.5px] text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Orbit. All rights reserved.</p>
        <p>Product previews show illustrative demo data.</p>
      </div>
    </footer>
  );
}

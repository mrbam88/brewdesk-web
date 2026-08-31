import type { ReactNode } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { BAMWARE_URL, SCORING_URL } from "@/lib/site";

type ProductHeaderProps = {
  search?: ReactNode;
};

export function ProductHeader({ search }: ProductHeaderProps) {
  return (
    <header className="product-header">
      <div className="product-header-top">
        <div className="product-brand">
          <Link href="/" className="wordmark">
            BrewDesk
          </Link>
          <p className="work-fit-line">{COPY.workFitLine}</p>
        </div>
        <nav className="header-links" aria-label="About BrewDesk">
          <a href={SCORING_URL} rel="noreferrer">
            {COPY.howScoringWorks}
          </a>
          <a href={BAMWARE_URL} rel="noreferrer">
            bamware.io
          </a>
        </nav>
      </div>
      {search ? <div className="product-header-search">{search}</div> : null}
    </header>
  );
}

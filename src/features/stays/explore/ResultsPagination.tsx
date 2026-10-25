import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Filters } from './exploreFilters';

export function ResultsPagination({ filters, pages, pageNumbers, commit }: { filters: Filters; pages: number; pageNumbers: number[]; commit: (patch: Partial<Filters>) => void }) {
  return (
    <>
          {pages > 1 && filters.view !== 'map' && (
            <nav className="ex-pages" aria-label="Pagination">
              <button disabled={filters.page <= 1} onClick={() => { commit({ page: filters.page - 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Previous page"><ChevronLeft size={16} /></button>
              {pageNumbers.map((n, i) => <span key={n}>{i > 0 && n - pageNumbers[i - 1] > 1 && <em>…</em>}<button className={n === filters.page ? 'on' : ''} aria-current={n === filters.page ? 'page' : undefined} onClick={() => { commit({ page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{n}</button></span>)}
              <button disabled={filters.page >= pages} onClick={() => { commit({ page: filters.page + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Next page"><ChevronRight size={16} /></button>
            </nav>
          )}
    </>
  );
}

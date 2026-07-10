import React from "react";
import { Search, type LucideIcon } from "lucide-react";
import { inputClass } from "../components/ui-kit";

export type SearchResult = {
  id: string;
  title: string;
  meta: string;
  to: string;
  icon: LucideIcon;
};

interface SearchOverlayProps {
  searchRef: React.RefObject<HTMLFormElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  isSearchOpen: boolean;
  globalQuery: string;
  setGlobalQuery: (query: string) => void;
  openSearch: () => void;
  handleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleGlobalSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  searchResults: SearchResult[];
  visibleSearchResults: SearchResult[];
  showAllSearchResults: boolean;
  setShowAllSearchResults: React.Dispatch<React.SetStateAction<boolean>>;
  activeSearchIndex: number;
  setActiveSearchIndex: React.Dispatch<React.SetStateAction<number>>;
  handleNavigate: (to: string) => void;
  copy: {
    searchHint: string;
    searchPlaceholder: string;
    searchCollapse: string;
    searchViewAll: string;
    searchSelectionHint: string;
    searchResultsLabel: string;
    searchEmpty: string;
  };
  searchListboxId: string;
  interpolate: (template: string, vars: Record<string, string | number>) => string;
}

export const SearchOverlay = ({
  searchRef,
  searchInputRef,
  isSearchOpen,
  globalQuery,
  setGlobalQuery,
  openSearch,
  handleSearchKeyDown,
  handleGlobalSearch,
  searchResults,
  visibleSearchResults,
  showAllSearchResults,
  setShowAllSearchResults,
  activeSearchIndex,
  setActiveSearchIndex,
  handleNavigate,
  copy,
  searchListboxId,
  interpolate,
}: SearchOverlayProps) => {
  return (
    <form
      ref={searchRef}
      aria-label={copy.searchHint}
      className="relative w-full lg:max-w-xl"
      onSubmit={handleGlobalSearch}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      <input
        ref={searchInputRef}
        aria-activedescendant={
          activeSearchIndex >= 0
            ? `global-search-option-${activeSearchIndex}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls={searchListboxId}
        aria-expanded={isSearchOpen && visibleSearchResults.length > 0}
        aria-label={copy.searchPlaceholder}
        className={`${inputClass} w-full pl-10 pr-4`}
        onChange={(event) => {
          setGlobalQuery(event.target.value);
          openSearch();
          setShowAllSearchResults(false);
          setActiveSearchIndex(-1);
        }}
        onFocus={openSearch}
        onKeyDown={handleSearchKeyDown}
        placeholder={copy.searchPlaceholder}
        role="combobox"
        value={globalQuery}
      />
      {isSearchOpen && globalQuery.trim() ? (
        <div
          aria-label={copy.searchHint}
          className="absolute left-0 right-0 z-40 mt-2 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
          role="dialog"
          tabIndex={-1}
        >
          <div className="flex items-start justify-between gap-3 px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {copy.searchHint}
            </p>
            {searchResults.length > 8 ? ( // Hardcoded SEARCH_RESULT_LIMIT
              <button
                className="text-xs font-semibold text-[var(--accent)]"
                onClick={() => setShowAllSearchResults((current) => !current)}
                type="button"
              >
                {showAllSearchResults
                  ? copy.searchCollapse
                  : interpolate(copy.searchViewAll, {
                      count: searchResults.length,
                    })}
              </button>
            ) : null}
          </div>
          <p className="px-2 pt-1 text-xs text-[var(--muted)]">
            {copy.searchSelectionHint}
          </p>
          {searchResults.length > 0 ? (
            <ul
              aria-label={copy.searchResultsLabel}
              className="mt-2 space-y-1"
              id={searchListboxId}
              role="listbox"
            >
              {visibleSearchResults.map((result, index) => {
                const Icon = result.icon;
                const isActive = index === activeSearchIndex;
                return (
                  <li key={result.id}>
                    <button
                      aria-selected={isActive}
                      className={[
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                        isActive
                          ? "bg-[var(--surface-muted)] ring-2 ring-[var(--accent-soft)]"
                          : "hover:bg-[var(--surface-muted)]",
                      ].join(" ")}
                      id={`global-search-option-${index}`}
                      onClick={() => handleNavigate(result.to)}
                      onMouseEnter={() => setActiveSearchIndex(index)}
                      role="option"
                      type="button"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-[var(--muted)]">
                          {result.meta}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2 py-4 text-sm text-[var(--muted)]">
              {copy.searchEmpty}
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
};

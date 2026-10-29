import { Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Header search for every page except Tickets, which has its own live search in the inbox. It types freely
// and only leaves the page on submit, so the field keeps focus and nothing in the URL changes mid-word.
export function GlobalSearch() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  if (useLocation().pathname.startsWith('/tickets')) return null;

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = text.trim();
        navigate({ pathname: '/tickets', search: query ? `?q=${encodeURIComponent(query)}` : '' });
      }}
      className="flex items-center rounded-full bg-panel p-1.5 pl-5 focus-within:ring-2 focus-within:ring-accent"
    >
      <label className="flex-1">
        <span className="sr-only">Search tickets by ID, order, subject or customer</span>
        <input
          type="search"
          name="global-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search tickets…"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle sm:w-56"
        />
      </label>
      <button
        type="submit"
        aria-label="Search"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-badge text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

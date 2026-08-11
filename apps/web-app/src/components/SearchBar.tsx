import React, { useState, type FormEvent, type ChangeEvent } from "react";

export function SearchBar({
  onSearch,
  placeholder = "Search photos or videos…",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      className="search-bar"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        aria-label="Search media"
      />
      <button type="submit">Search</button>
    </form>
  );
}

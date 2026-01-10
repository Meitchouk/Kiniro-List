"use client";

import { useTranslations } from "next-intl";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * Reusable search form component
 */
export function SearchForm({ value, onChange, onSubmit, placeholder, className }: SearchFormProps) {
  const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className || ""}`}>
      <Input
        type="text"
        placeholder={placeholder || t("search.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-md"
      />
      <Button type="submit" disabled={!value.trim()}>
        <SearchIcon className="mr-2 h-4 w-4" />
        {t("common.search")}
      </Button>
    </form>
  );
}

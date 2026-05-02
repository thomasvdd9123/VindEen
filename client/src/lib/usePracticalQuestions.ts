import { useQuery } from "@tanstack/react-query";

export interface PracticalOption {
  id: string;
  key: string;
  name: string;
}

export interface PracticalQuestion {
  id: string;
  key: string;       // upper-case key from DB (e.g. "Languages")
  camelKey: string;  // lower-camel key used in /api/profiles body.practical
  name: string;
  fieldType: "OPTION" | "INT" | "DOUBLE" | "STRING" | "DATE" | "BOOLEAN";
  isMulti: boolean;
  isRequired: boolean;
  sortOrder: number;
  options: PracticalOption[];
}

// Single source of truth for practical questions defined in the DB.
// The vertical owner can add/remove rows in `practical_question` +
// `practical_option` and the UI re-renders automatically.
export function usePracticalQuestions() {
  const query = useQuery<PracticalQuestion[]>({
    queryKey: ["/api/practical-questions"],
    staleTime: Infinity,
  });
  return { ...query, questions: query.data ?? [] };
}

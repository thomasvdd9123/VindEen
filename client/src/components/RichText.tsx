import { Fragment, type ReactNode } from "react";

const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

export function renderRichText(text: string): ReactNode {
  if (!text || text.indexOf("**") === -1) {
    return text;
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  BOLD_PATTERN.lastIndex = 0;

  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={`b-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}

interface RichTextProps {
  children: string;
}

export function RichText({ children }: RichTextProps) {
  return <>{renderRichText(children)}</>;
}

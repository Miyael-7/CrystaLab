import katex from 'katex';
import { useMemo } from 'react';

interface Props {
  /** Expresión en LaTeX. */
  children: string;
  /** true: ecuación centrada en su propia línea. */
  block?: boolean;
  className?: string;
}

/** Ecuación renderizada con KaTeX (todo en el navegador, sin servicios externos). */
export function Tex({ children, block = false, className }: Props) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: 'ignore' }),
    [children, block],
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

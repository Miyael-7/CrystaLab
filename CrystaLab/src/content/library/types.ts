import type { ReactNode } from 'react';
import type { Source } from '../../components/ui/Callout';

export interface LibrarySection {
  id: string;
  title: string;
  /** De dónde proviene el contenido: presentaciones del curso, bibliografía o ambos. */
  sources: Source[];
  content: ReactNode;
}

export interface LibraryChapter {
  id: string;
  number: string;
  title: string;
  intro: ReactNode;
  sections: LibrarySection[];
}

import type { ReactNode } from 'react';

type PreviewProps = {
  svgMarkup: string;
  title?: string;
  children?: ReactNode;
};

export function Preview({ svgMarkup, title, children }: PreviewProps) {
  return (
    <div className="lg:col-span-2 bg-gray-950 p-8 rounded-2xl border border-gray-800 flex flex-col items-center justify-center relative shadow-inner">
      {title && <span className="absolute top-4 left-4 text-xs font-mono text-gray-500">{title}</span>}
      <div className="w-full max-w-md" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      {children}
    </div>
  );
}

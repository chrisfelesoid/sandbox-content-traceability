import { api } from '@/api/client';
import { LazyMedia, type MediaKind } from './lazy-media';

export function OriginalRow({
  modality,
  fileStem,
  ext,
  tools,
  mediaKind,
}: {
  modality: string;
  fileStem: string;
  ext: string | undefined;
  tools: string[];
  mediaKind: MediaKind;
}) {
  const src = ext ? api.sourceUrl(modality, `${fileStem}.${ext}`) : '';
  return (
    <tr>
      <th className="p-2 text-left text-sm font-semibold align-top whitespace-nowrap">original</th>
      {tools.map((tool) => (
        <td key={tool} className="p-2 align-top">
          {src ? (
            <LazyMedia src={src} kind={mediaKind} />
          ) : (
            <div className="text-xs text-muted-foreground">no source</div>
          )}
        </td>
      ))}
    </tr>
  );
}

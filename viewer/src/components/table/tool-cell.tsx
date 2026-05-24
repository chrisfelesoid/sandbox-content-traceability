import { cn } from '@/lib/utils';
import type { RawRow } from '@/scenarios/types';
import { LazyMedia, type MediaKind } from './lazy-media';

export type ToolCellProps = {
  row: RawRow | null;
  mediaUrl: string;
  mediaKind: MediaKind;
  onClick?: () => void;
};

export function ToolCell({ row, mediaUrl, mediaKind, onClick }: ToolCellProps) {
  if (row === null) {
    return <td className="bg-cell-empty p-2 align-top text-xs text-muted-foreground">no data</td>;
  }
  const failed = row.status === false;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <td> is an interactive table cell; keyboard navigation handled at table level
    <td
      className={cn(
        'p-2 align-top cursor-pointer hover:outline outline-2 outline-ring',
        failed && 'bg-cell-fail',
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <LazyMedia src={mediaUrl} kind={mediaKind} />
        <div className="text-xs font-mono">
          {failed ? '' : '✓ '}
          {Number(row.score).toFixed(4)}
        </div>
        {failed && row.cause && <div className="text-xs text-destructive">{String(row.cause)}</div>}
      </div>
    </td>
  );
}

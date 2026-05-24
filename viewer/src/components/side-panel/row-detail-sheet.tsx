import type { MediaKind } from '@/components/table/lazy-media';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { AlignedRow } from '@/scenarios/types';

export type SelectedCell = {
  tool: string;
  scenarioLabel: string;
  row: AlignedRow;
  mediaUrl: string;
  mediaKind: MediaKind;
};

export function RowDetailSheet({
  selected,
  onOpenChange,
}: {
  selected: SelectedCell | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = selected !== null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[28rem] overflow-y-auto">
        {selected && (
          <>
            <SheetHeader>
              <SheetTitle>
                {selected.tool} · {selected.scenarioLabel}
              </SheetTitle>
              <div className="text-sm text-muted-foreground">row: {selected.row.label}</div>
            </SheetHeader>
            <div className="p-4 space-y-4">
              {selected.mediaKind === 'audio' && (
                <audio controls src={selected.mediaUrl} className="w-full">
                  <track kind="captions" />
                </audio>
              )}
              {selected.mediaKind === 'video' && (
                <video controls src={selected.mediaUrl} className="w-full max-h-64">
                  <track kind="captions" />
                </video>
              )}
              {selected.mediaKind === 'image' && (
                <img src={selected.mediaUrl} alt="" className="w-full" />
              )}
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(selected.row.cells[selected.tool], null, 2)}
              </pre>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { api } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAlignedRows } from '@/hooks/use-aligned-rows';
import type { AlignedRow, ScenarioDef } from '@/scenarios/types';
import { mediaKindFromModality } from './lazy-media';
import { OriginalRow } from './original-row';
import { ToolCell } from './tool-cell';

export type BenchmarkTableProps = {
  modality: string;
  tools: string[];
  scenario: ScenarioDef;
  subId: string | null;
  fileStem: string;
  sourceExt: string | undefined;
  onCellClick: (args: { tool: string; row: AlignedRow }) => void;
};

export function BenchmarkTable(props: BenchmarkTableProps) {
  const { modality, tools, scenario, subId, fileStem, sourceExt, onCellClick } = props;
  const { rows, isLoading, errors } = useAlignedRows({
    modality,
    scenario,
    subId,
    fileStem,
    tools,
  });
  const kind = mediaKindFromModality(modality);

  return (
    <div className="w-full overflow-x-auto">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-48" />
            {tools.map((tool) => (
              <TableHead key={tool} className="text-sm font-semibold">
                {tool}
                {errors.find((e) => e.tool === tool) && (
                  <span className="ml-2 text-destructive">(load failed)</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <OriginalRow
            modality={modality}
            fileStem={fileStem}
            ext={sourceExt}
            tools={tools}
            mediaKind={kind}
          />
          {isLoading &&
            (['loading-0', 'loading-1', 'loading-2'] as const).map((k) => (
              <TableRow key={k}>
                <th className="p-2 text-left text-sm align-top">
                  <Skeleton className="h-4 w-24" />
                </th>
                {tools.map((tool) => (
                  <td key={tool} className="p-2 align-top">
                    <Skeleton className="h-12 w-full" />
                  </td>
                ))}
              </TableRow>
            ))}
          {!isLoading &&
            rows.map((row) => (
              <TableRow key={row.key}>
                <th className="p-2 text-left text-sm font-semibold align-top whitespace-nowrap">
                  {row.label}
                </th>
                {tools.map((tool) => {
                  const cell = row.cells[tool];
                  const url = api.filesUrl(
                    modality,
                    tool,
                    scenario.id,
                    [fileStem, row.mediaSubdir, row.mediaFilename].filter(Boolean).join('/'),
                  );
                  return (
                    <ToolCell
                      key={tool}
                      row={cell}
                      mediaUrl={url}
                      mediaKind={kind}
                      onClick={() => onCellClick({ tool, row })}
                    />
                  );
                })}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

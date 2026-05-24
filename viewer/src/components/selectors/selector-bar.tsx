import type { Manifest, ModalityEntry, ScenarioEntry } from '@/api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getScenario } from '@/scenarios';
import type { SubScenario } from '@/scenarios/types';

export type SelectorState = {
  modality: string;
  scenario: string;
  sub: string | null;
  file: string;
};

export type SelectorBarProps = {
  manifest: Manifest;
  state: SelectorState;
  onChange: (next: SelectorState) => void;
};

function entriesFor(manifest: Manifest, modality: string): ModalityEntry | undefined {
  return manifest.modalities.find((m) => m.name === modality);
}

export function SelectorBar({ manifest, state, onChange }: SelectorBarProps) {
  const modalityEntry = entriesFor(manifest, state.modality);
  const scenarios: ScenarioEntry[] = modalityEntry?.scenarios ?? [];
  const scenarioDef = getScenario(state.scenario);
  const subs: SubScenario[] = scenarioDef?.subScenarios ?? [];
  const files = scenarios.find((s) => s.id === state.scenario)?.files ?? [];

  function pick(modality: string) {
    const m = entriesFor(manifest, modality);
    const firstScenario = m?.scenarios[0];
    const firstScenarioId = firstScenario?.id ?? '';
    const def = firstScenarioId ? getScenario(firstScenarioId) : undefined;
    const firstSub = def?.subScenarios[0]?.id ?? null;
    const firstFile = firstScenario?.files[0] ?? '';
    onChange({ modality, scenario: firstScenarioId, sub: firstSub, file: firstFile });
  }
  function pickScenario(scenario: string) {
    const def = getScenario(scenario);
    const firstSub = def?.subScenarios[0]?.id ?? null;
    const firstFile = scenarios.find((s) => s.id === scenario)?.files[0] ?? '';
    onChange({ ...state, scenario, sub: firstSub, file: firstFile });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 border-b">
      <Field label="Modality">
        <Select value={state.modality} onValueChange={pick}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {manifest.modalities.map((m) => (
              <SelectItem key={m.name} value={m.name} disabled={m.tools.length === 0}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Scenario">
        <Select
          value={state.scenario}
          onValueChange={pickScenario}
          disabled={scenarios.length === 0}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {getScenario(s.id)?.label ?? s.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sub-Scenario">
        <Select
          value={state.sub ?? ''}
          onValueChange={(v) => onChange({ ...state, sub: v })}
          disabled={subs.length === 0}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {subs.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="File">
        <Select
          value={state.file}
          onValueChange={(v) => onChange({ ...state, file: v })}
          disabled={files.length === 0}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {files.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: wraps a Radix Select trigger which Biome cannot statically detect as a control
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

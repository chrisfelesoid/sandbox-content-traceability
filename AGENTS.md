# AGENTS.md

@AGENTS.local.md

# Development Stack

## Tooling
- Global Environment Manager: mise
- Python Project Manager: uv
- Node.js Project Manager: pnpm

## Workflow
1. Global: `mise install`
  - Manages Python, Node.js, uv, and pnpm versions via mise.toml.

2. Python: `uv sync`
  - Manages dependencies and virtual environments.

3. Node.js: `pnpm install`
  - Manages node_modules and scripts.

## Commands
- Python: `uv run <script>` / `uv add <package>`
- Node.js: `pnpm <command>` / `pnpm add <package>`

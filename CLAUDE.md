# Claude Code Bootstrap

This file is a client adapter for Claude Code only.

## Serena MCP Setup

Call `mcp__serena__initial_instructions` once at session start, then use the `mcp__serena__` tools for semantic navigation.

| Task            | Tool                                               |
| --------------- | -------------------------------------------------- |
| Symbol search   | `mcp__serena__jet_brains_find_symbol`              |
| File overview   | `mcp__serena__jet_brains_get_symbols_overview`     |
| References      | `mcp__serena__jet_brains_find_referencing_symbols` |
| Declaration     | `mcp__serena__jet_brains_find_declaration`         |
| Implementations | `mcp__serena__jet_brains_find_implementations`     |

Requires JetBrains with the project open and the Serena plugin installed.

Read `AGENTS.md` for the canonical rules; this file only covers Claude-specific setup.

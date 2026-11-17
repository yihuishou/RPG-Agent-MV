# Skill Configuration

[Back to User Guide](../README.md)

This page summarizes where and how Skills are configured in development builds and in the packaged release (Luna RPG Agent). For the definition and loading mechanism of skills, see [Skills](skill.md).

## Skill directory layout

A skill is a directory placed inside one of the skill zones below:

```text
my-plugin-events/
├─ SKILL.md          # required: frontmatter + body
├─ scripts/          # optional resources
└─ references/
```

`SKILL.md` must contain frontmatter:

```markdown
---
name: my-plugin-events
description: Use when a task involves the XX plugin's event commands or reworking events with that plugin
---
```

- Directory names and `name` use lowercase-hyphen form (for example `event-pacing`); names created through the settings UI must also match `^[a-z0-9][a-z0-9-]*$`.
- `description` is the only trigger surface: the model normally sees only names and descriptions, and reads the body when a task matches. State the plugin name and the applicable scenarios explicitly.

## Skill zones

| Zone | Scope | How it loads | Development path | Packaged path |
|---|---|---|---|---|
| Shipped | All projects | Static config `skills.paths` points at this directory | `RPG-Agent-MV\config\opencode\skills\` | `<install dir>\resources\app\config\opencode\skills\` |
| User | All projects | opencode scans `skills\` under its config directory at startup | `RPG-Agent-MV\.opencode\skills\` | `%APPDATA%\Luna RPG Agent\.opencode\skills\` |
| Project | Single game project | Discovered upward from the current project directory | `<game project>\.agents\skills\` (or `.claude\`, `.opencode\`) | same |
| Draft | Never loads | Not covered by any scan | `<root>\.opencode\logs\skills\` | same (under the user-data root) |

- The draft zone is `AGENT_RPG_SKILL_OUTPUT_DIR`. Per runtime rules, the Agent may only write skill drafts there; you move them into an official zone after review.
- opencode also scans `.agents\skills\` and `.claude\skills\` under the user home directory (not disabled by the product).
- The packaged build has two roots: the install root `<install dir>\resources\app` (read-only, replaced on update) and the user-data root `%APPDATA%\Luna RPG Agent` (writable, kept across updates); in development both are the product root.

## Three ways to configure a skill

### Option 1: create from the settings UI (recommended for the release build)

1. Open Settings → Rules & Skills.
2. Fill in the name and description in the "+ New Skill" form.
3. The skeleton is generated into the user zone (in the release build: `%APPDATA%\Luna RPG Agent\.opencode\skills\<name>\SKILL.md`). Use "Open" or go to that path to finish the body.

Notes:

- No administrator rights required; the file lives in user data and survives app updates.
- The list on that page shows only shipped skills (tagged as native, no per-skill switch); skills you create yourself do not appear there, so edit them directly at the user-zone path.

### Option 2: place files manually

- Global scope: put them in the user zone (recommended), or in the shipped zone — the shipped zone sits inside the install directory, needs administrator rights under `Program Files`, and **is overwritten by app updates or reinstalls**, so it is not a durable place for custom skills.
- Single-project scope: put them in the game project's `.agents\skills\`; they are only visible to sessions bound to that project.

### Option 3: ship inside the installer (maintainers)

Add skill directories under `config/opencode/skills/` in the repository and run `npm run release:electron`; they end up in the shipped zone of the artifact. The release check (release:check) only requires the presence of `skill-creator` and does not forbid extra skills.

## When changes take effect

- Skill discovery runs once when the opencode engine starts; after adding or changing a skill, start a new session or restart the app to verify it.
- Do not hand-edit `.opencode\opencode.json` under the user-data root to append `skills.paths`: the product rewrites that file from the shipped template on every start. To add a global skill, place it in the shipped or user zone.

## Compared with other mechanisms

- Versus [Rules](rules.md): a skill is triggered on demand and carries specialized "how to do this kind of thing" capability, while the AGENTS.md at the game project root is a long-lived constraint applied throughout that project. They complement each other.
- The release build includes `skill-creator`, which guides the Agent in authoring skills with the expected structure. Keep only mature skills in the official zones; keep experiments in the draft zone.

## Related

- Skill definition and mechanism: [Skills](skill.md)
- Rules system: [Rules](rules.md)

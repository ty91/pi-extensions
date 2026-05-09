# pi-extensions

Personal Pi extensions for Codex-style workflows.

## Install

```bash
pi install git:github.com/ty91/pi-extensions
```

Or using the full URL:

```bash
pi install https://github.com/ty91/pi-extensions
```

## Extensions

### Codex Apply Patch

Adds an `apply_patch` tool that accepts a raw Codex patch envelope (`*** Begin Patch` / `*** End Patch`) and applies it to files. For GPT-5-family models, it enables `apply_patch` and disables Pi's built-in `edit`/`write` tools so file edits go through structured patches.

See [`extensions/codex-apply-patch`](extensions/codex-apply-patch/).

### Codex Web Search

Injects OpenAI Responses API hosted `web_search` into GPT/Codex provider payloads. It supports `live`, `cached`, and `disabled` modes via the `--codex-web-search` flag.

See [`extensions/codex-web-search`](extensions/codex-web-search/).

## Load only one extension

To install the package but load only one extension, use Pi package filtering in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    {
      "source": "git:github.com/ty91/pi-extensions",
      "extensions": ["extensions/codex-apply-patch/index.ts"]
    }
  ]
}
```

## License

MIT

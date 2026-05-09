# Codex Web Search

Pi extension that enables Codex-style native OpenAI web search for GPT/Codex models.

This extension does **not** implement a local `web_run` function tool. Instead, it injects OpenAI's hosted Responses API tool into the provider payload, matching Codex's approach:

```json
{
  "type": "web_search",
  "external_web_access": true
}
```

## Behavior

- Enabled only for model IDs that look like GPT or Codex models (`gpt...` or containing `codex`).
- Enabled only for OpenAI Responses-compatible payloads.
- Default mode is **live** web search (`external_web_access: true`).
- Pi TUI may not render a special web-search cell; the model still receives the native hosted web-search capability.

## Install

```bash
pi install git:github.com/ty91/pi-extensions
```

Then start Pi normally with a GPT/Codex model.

## Usage

Default live web search:

```bash
pi --model openai/gpt-5.2
```

Change mode with the extension flag:

```bash
pi --model openai/gpt-5.2 --codex-web-search live
pi --model openai/gpt-5.2 --codex-web-search cached
pi --model openai/gpt-5.2 --codex-web-search disabled
```

Modes:

- `live`: native `web_search` with live internet access (`external_web_access: true`)
- `cached`: native `web_search` using cached/indexed web access (`external_web_access: false`)
- `disabled`: do not expose `web_search`

## Optional environment configuration

```bash
export PI_CODEX_WEB_SEARCH_MODE=live
export PI_CODEX_WEB_SEARCH_CONTEXT_SIZE=high      # low | medium | high
export PI_CODEX_WEB_SEARCH_ALLOWED_DOMAINS=example.com,docs.example.com
export PI_CODEX_WEB_SEARCH_COUNTRY=US
export PI_CODEX_WEB_SEARCH_CITY="New York"
export PI_CODEX_WEB_SEARCH_TIMEZONE=America/New_York
```

These map to the same hosted `web_search` fields Codex forwards when configured.

## Development

This is a single-file TypeScript Pi extension. Pi loads `index.ts` directly.

## License

MIT

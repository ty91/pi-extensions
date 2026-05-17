# Issue tracker: Linear

Issues and PRDs for this repo live in Linear. Use the Linear MCP server or available CLI for all operations.

## Repo configuration

- **Workspace**: <workspace-name-or-url>
- **Team**: <team-name>
- **Team key**: <TEAM>
- **Default project**: <project-name-or-none>
- **Default status for new issues**: <status-name>
- **Done/closed status**: <status-name>

## Conventions

- **Create an issue**: create a Linear issue in the configured team with a title and markdown description.
- **Read an issue**: fetch by Linear issue ID such as `<TEAM>-123` or by Linear URL.
- **List issues**: list issues for the configured team, filtered by status, assignee, label, project, or cycle when relevant.
- **Comment on an issue**: add a Linear comment to the issue.
- **Apply / remove labels**: update Linear issue labels by their configured names.
- **Update status**: move the issue to the requested workflow status.
- **Close**: move the issue to the configured done/closed status, adding a comment first when explanation is needed.

## When a skill says "publish to the issue tracker"

Create a Linear issue in the configured team.

## When a skill says "fetch the relevant ticket"

Fetch the Linear issue by ID or URL and read its description, comments, labels, status, assignee, project, and cycle.

## Authentication

Use the Linear MCP server or available CLI. If it is unavailable or unauthenticated, stop and ask the user to connect Linear before modifying issues.

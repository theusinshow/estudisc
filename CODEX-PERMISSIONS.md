# Codex Permissions for Estudisc

Use `/permissions` at the start of the Codex session and choose an automation-friendly mode that remains restricted to the repository workspace.

Recommended principle:

- allow reading, writing and routine commands inside the current Estudisc checkout;
- keep unrelated directories and the broader computer outside writable roots;
- keep external writes, deployment, publishing, real-secret access and destructive data operations behind user approval;
- do not use unrestricted full-computer access merely to reduce prompts.

Codex configuration changes over time. Inspect the active policy, writable roots and sandbox with `/status` before starting long autonomous work.

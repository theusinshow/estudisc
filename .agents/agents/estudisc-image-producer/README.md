# Native Image Producer setup

The genuine `Estudisc IMAGE PRODUCER` terminal is connected in Maestri with role `Image Producer`, running Antigravity CLI 1.2.9 and Gemini 3.8 Flash/high. Its launch command is:

```text
agy --add-dir C:/Dev/pessoal/vecta
```

The extra directory gives the native CLI access to the repository when Maestri launches it inside the assigned role folder. The current authenticated account is reused; no API key is required or read for this preparation.

Canonical instructions: `tools/estudisc-content-studio/agents/image-producer.md`. Observed capability report: `.local/vecta-image-producer/CAPABILITIES.md`. The session declares `generate_image` with prompt/image parameters; no generation call has been made and no exact image backend/model was verified. Nano Banana 2 is not assumed.

`agy agents` returned an empty list. Available documentation did not establish a native custom-agent schema for `.agents/agents/`; these files are explicit role/bootstrap instructions, not a claimed native registry entry. For manual startup from the repository, use the supported interactive prompt flag:

```text
agy --add-dir C:/Dev/pessoal/vecta --prompt-interactive "Read C:/Dev/pessoal/vecta/.agents/agents/estudisc-image-producer/AGENTS.md as your assigned role; remain in standby until an image request."
```

No automatic integration/generation was configured. The full optional Studio media workflow and dry-run requirements remain in `.local/mathematics-production/IMAGE-PRODUCER-NEXT.md`; generated images require independent review before approval and publication.

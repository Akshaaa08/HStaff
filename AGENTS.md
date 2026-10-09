<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep mobile screens in a shared app shell with reusable primitives and a browser-safe domain module; this supports native-style navigation without duplicated presentation.
- Validate simulated booking transitions with a client-side state machine and versioned local session recovery; this prototype intentionally has no backend infrastructure.
- Centralize visual roles, dimensions and motion in the global token stylesheet; this keeps the Android blueprint consistent.

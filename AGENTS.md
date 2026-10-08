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

- H-Staff is a client-only interactive prototype at the index route, using a shared app controller and reusable UI primitives; native-style screens share booking context without server infrastructure.
- Keep service data, professional fixtures and allowed booking transitions in the browser-safe domain module so both roles follow the same state model.
- Use sessionStorage only for this explicitly mocked prototype's recovery, read after hydration; production persistence requires a connected backend.
- Define H-Staff visual roles, geometry and animation centrally in the global design system and use shared Button variants for controls.

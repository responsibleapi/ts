# Publish

## Release loop

1. Make package changes.
2. Run `task build`.
3. Stage and commit release changes before `task publish`.
   `scripts/publish-guard.ts` requires clean git state.
4. Run `task publish`.
5. In downstream consumers, pin the intended version exactly, run `bun install`,
   then run their typecheck from a fresh install when proving package behavior.

## Lessons

- Use Taskfile targets for release commands; do not bypass `task publish`.
- `bun update` respects existing version ranges and can keep an exact old pin.
  After manual `package.json` edits, use `bun install`.
- Existing `node_modules` can mask dependency mistakes. For proof, test after a
  fresh install, not just after changing a lockfile.
- `bun tsc` only proves the consumer's current TypeScript config. With
  `skipLibCheck: true`, missing transitive declaration dependencies may not fail.
- Bun can publish packages, but it does not have an unpublish command. Use npm:
  `npm unpublish @responsibleapi/ts@VERSION`.
- Unpublished npm versions cannot be reused. Unpublishing all versions can remove
  the package and block republish for 24 hours.

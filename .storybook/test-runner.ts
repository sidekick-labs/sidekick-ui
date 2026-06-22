import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'
import { injectAxe, configureAxe, getViolations } from 'axe-playwright'
import type { Result } from 'axe-core'

/**
 * Storybook test-runner config — the a11y gate for @sidekick-labs/ui.
 *
 * For EVERY story the runner does two things:
 *   1. Render-smoke: the default test-runner behaviour mounts the story and
 *      fails if it throws on render. (No hand-written `play()` functions this
 *      round — render-smoke + axe is the whole contract.)
 *   2. Axe accessibility scan (this `postVisit` hook).
 *
 * Policy (EXACT):
 *   - Violations with impact `serious` or `critical`  -> FAIL CI (this hook throws).
 *   - Violations with impact `moderate` or `minor`    -> logged via console.warn,
 *                                                        do NOT fail.
 *
 * Per-story scope-disable:
 *   A story may narrow the scan via `parameters.a11y`, e.g.
 *     parameters: {
 *       a11y: {
 *         // turn one rule off for THIS story only, with a justifying comment
 *         config: { rules: [{ id: 'color-contrast', enabled: false }] },
 *         // or skip the gate entirely for a story that can't be made conformant
 *         disable: true,
 *       },
 *     }
 *   Use this only for a genuine false positive / unavoidable case — never as a
 *   blanket suppression.
 *
 * Theme note: the catalog has a dark/light toolbar (default dark). Axe runs
 * against the default (dark) theme, which is the shipped default — that's fine.
 */

const FAILING_IMPACTS = new Set(['serious', 'critical'])

function formatViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const targets = v.nodes.map((n) => `      - ${n.target.join(' ')}`).join('\n')
      return (
        `  [${v.impact}] ${v.id}: ${v.help}\n` +
        `    ${v.helpUrl}\n` +
        `    affected nodes:\n${targets}`
      )
    })
    .join('\n\n')
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page)
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context)

    // Respect a story's opt-out / scoped rule config.
    const a11yParams = storyContext.parameters?.a11y as
      | {
          disable?: boolean
          element?: string
          config?: Record<string, unknown>
          options?: Record<string, unknown>
        }
      | undefined

    if (a11yParams?.disable) {
      return
    }

    if (a11yParams?.config) {
      await configureAxe(page, a11yParams.config)
    }

    // Scope the scan to the story root (or a story-provided element) so we
    // never flag Storybook's own chrome.
    const element = a11yParams?.element ?? '#storybook-root'

    const violations = (await getViolations(page, element, {
      // axe runs by default with WCAG 2 A/AA-ish tags; story params.options can
      // override (e.g. specific runOnly tags) without us hardcoding a ruleset.
      ...(a11yParams?.options ?? {}),
    })) as Result[]

    if (violations.length === 0) {
      return
    }

    const failing = violations.filter((v) => v.impact && FAILING_IMPACTS.has(v.impact))
    const advisory = violations.filter((v) => !v.impact || !FAILING_IMPACTS.has(v.impact))

    if (advisory.length > 0) {
      // moderate / minor — logged, non-blocking.
      console.warn(
        `\n[a11y] ${context.title} › ${context.name}: ` +
          `${advisory.length} non-blocking (moderate/minor) violation(s):\n` +
          formatViolations(advisory) +
          '\n',
      )
    }

    if (failing.length > 0) {
      // serious / critical — fail the run with a readable report.
      throw new Error(
        `[a11y] ${context.title} › ${context.name}: ` +
          `${failing.length} serious/critical accessibility violation(s) ` +
          `(policy: serious+critical fail CI):\n\n` +
          formatViolations(failing) +
          '\n',
      )
    }
  },
}

export default config

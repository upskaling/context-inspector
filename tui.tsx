import { Plugin } from "@opencode/plugin/tui"

const DEFAULT_ROUTE = "context-usage"
const FULL_ROUTE = "context-usage-full"

const pad = (v: string, w: number) => v + " ".repeat(Math.max(0, w - v.length))
const tok = (n: number) => Math.round(n / 4)

export default Plugin.define({
  id: "context-inspector",
  setup(context) {
    const open = (name: string) =>
      context.ui.router.navigate({ type: "plugin", name })

    const renderTable = (mode: "summary" | "full") => {
      const location = context.location ?? context.data.location.default()
      context.data.location.skill.sync(location)
      const skills = context.data.location.skill.list(location) ?? []

      const items = skills
        .map((s: any) => {
          const name = String(s.id ?? s.name)
          const description = String(s.description ?? "")
          const summary = `${name} ${description}`
          const content = String(s.content ?? "")
          const size = mode === "summary" ? summary.length : (content || summary).length
          return { s, name, size }
        })
        .sort((a: any, b: any) => b.size - a.size)

      const total = items.reduce((a: number, x: any) => a + x.size, 0) || 1
      const maxBar = 40
      const nameWidth = Math.max(8, ...items.map((x: any) => x.name.length))
      const sizeWidth = Math.max(4, ...items.map((x: any) => String(x.size).length), String(total).length)
      const totalTok = tok(total)
      const tokWidth = Math.max(6, String(totalTok).length)

      const title =
        mode === "summary"
          ? "Skills — tokens du titre + description"
          : "Skills — tokens du contenu complet (usage)"
      const other = mode === "summary" ? FULL_ROUTE : DEFAULT_ROUTE
      const otherLabel =
        mode === "summary" ? "→ Voir le contenu complet" : "← Voir titre + description"

      return (
        <box>
          <text fg={context.theme.text.base} onMouseUp={() => context.ui.router.navigate({ type: "home" })}>✕ Close (Esc)</text>
          <text fg={context.theme.text.base} onMouseUp={() => open(other)}>{otherLabel}</text>
          <text fg={context.theme.text.base}>{title}</text>
          <text fg={context.theme.text.base}>{`${pad("Name", nameWidth)} | ${pad("Size", sizeWidth)} | ${pad("Tokens", tokWidth)} | Pct  | Chart`}</text>
          <text fg={context.theme.text.base}>{`${"-".repeat(nameWidth)}-+-${"-".repeat(sizeWidth)}-+-${"-".repeat(tokWidth)}-+------+${"-".repeat(maxBar)}`}</text>
          {items.map((x: any) => {
            const pct = ((x.size / total) * 100).toFixed(1)
            const barLen = Math.round((x.size / total) * maxBar)
            const bar = "█".repeat(barLen) + "░".repeat(Math.max(0, maxBar - barLen))
            return (
              <text fg={context.theme.text.base}>{`${pad(x.name, nameWidth)} | ${pad(String(x.size), sizeWidth)} | ${pad(String(tok(x.size)), tokWidth)} | ${pad(pct + "%", 5)} | ${bar}`}</text>
            )
          })}
          <text fg={context.theme.text.base}>{`${pad("TOTAL", nameWidth)} | ${pad(String(total), sizeWidth)} | ${pad(String(totalTok), tokWidth)} | 100%  | ${"█".repeat(maxBar)}`}</text>
        </box>
      )
    }

    const unregisterSummary = context.ui.router.register({
      name: DEFAULT_ROUTE,
      render: () => renderTable("summary"),
    })

    const unregisterFull = context.ui.router.register({
      name: FULL_ROUTE,
      render: () => renderTable("full"),
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "context-inspector.usage",
          title: "Show context usage (titles + descriptions)",
          palette: true,
          slash: { name: DEFAULT_ROUTE },
          run: () => open(DEFAULT_ROUTE),
        },
        {
          id: "context-inspector.usage.full",
          title: "Show context usage (full skill content)",
          palette: true,
          slash: { name: FULL_ROUTE },
          run: () => open(FULL_ROUTE),
        },
        {
          id: "context-inspector.close",
          title: "Close context panel",
          bind: "escape",
          run: () => context.ui.router.navigate({ type: "home" }),
        },
      ],
    }))

    return () => {
      unregisterSummary()
      unregisterFull()
    }
  },
})

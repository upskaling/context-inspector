import { Plugin } from "@opencode/plugin/tui"

const DEFAULT_ROUTE = "context-usage"
const FULL_ROUTE = "context-usage-full"

const pad = (v: string, w: number) => v + " ".repeat(Math.max(0, w - v.length))
const tok = (n: number) => Math.round(n / 4)

/** Un skill est « chargé » s'il est dans le registre après les transforms
 *  (skill-groups inclus) et qu'il est annoncé au modèle (description, autoinvoke). */
const isLoaded = (skill: any) =>
  !!skill &&
  String(skill.description ?? "").trim().length > 0 &&
  skill.autoinvoke !== false

const toSkillArray = (output: any): any[] => {
  if (Array.isArray(output)) return output
  if (Array.isArray(output?.data)) return output.data
  if (Array.isArray(output?.skills)) return output.skills
  return []
}

export default Plugin.define({
  id: "context-inspector",
  setup(context) {
    const location = () => context.location ?? context.data.location.default()
    const open = (name: string) =>
      context.ui.router.navigate({ type: "plugin", name })

    // On interroge le serveur plutôt que le cache TUI : la liste reflète alors
    // le registre après transforms, donc les skills masqués par skill-groups
    // n'apparaissent plus (y compris si le cache date d'avant le filtrage).
    let loadedSkills: any[] = []

    const refreshSkills = async () => {
      try {
        const response = await context.client.skill.list({ location: location() })
        loadedSkills = toSkillArray(response).filter(isLoaded)
      } catch (error) {
        loadedSkills = []
        context.ui.toast.show({
          message: "Context inspector: impossible de charger la liste des skills",
          variant: "error",
          duration: 5000,
        })
      }
    }

    const openSynced = (name: string) =>
      void refreshSkills().then(() => open(name))

    const renderTable = (mode: "summary" | "full") => {
      const items = loadedSkills
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
          ? "Skills chargés — tokens du titre + description"
          : "Skills chargés — tokens du contenu complet (usage)"
      const other = mode === "summary" ? FULL_ROUTE : DEFAULT_ROUTE
      const otherLabel =
        mode === "summary" ? "→ Voir le contenu complet" : "← Voir titre + description"

      return (
        <box>
          <text fg={context.theme.text.base} onMouseUp={() => context.ui.router.navigate({ type: "home" })}>✕ Close (Esc)</text>
          <text fg={context.theme.text.base} onMouseUp={() => openSynced(other)}>{otherLabel}</text>
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
          run: () => openSynced(DEFAULT_ROUTE),
        },
        {
          id: "context-inspector.usage.full",
          title: "Show context usage (full skill content)",
          palette: true,
          slash: { name: FULL_ROUTE },
          run: () => openSynced(FULL_ROUTE),
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

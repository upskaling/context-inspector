import { Plugin } from "@opencode/plugin"
import { encoding_for_model } from "tiktoken"

export default Plugin.define({
  id: "context-inspector",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "context_budget",
        description: "Report current context budget breakdown",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
          const enc = encoding_for_model("gpt-4o")
          const count = (t: string) => (t ? enc.encode(t).length : 0)
          const plugins = await ctx.plugin.list() as any
          const skills = await ctx.skill.list() as any
          const arrP = Array.isArray(plugins) ? plugins : (plugins?.data ?? [])
          const arrS = Array.isArray(skills) ? skills : (skills?.data ?? [])
          const ctxWindow = 200000
          const entries: { label: string; tokens: number }[] = []
          for (const p of arrP) {
            const t = count(JSON.stringify(p))
            if (t > 0) entries.push({ label: `plugin ${p.id ?? p.name}`, tokens: t })
          }
          for (const s of arrS) {
            const t = count(s.content ?? s.description ?? "")
            if (t > 0) entries.push({ label: `skill ${s.id ?? s.name}`, tokens: t })
          }
          entries.sort((a, b) => b.tokens - a.tokens)
          const total = entries.reduce((a, e) => a + e.tokens, 0)
          const lines = ["Context Budget (tokens):"]
          for (const e of entries) {
            const pct = ((e.tokens / ctxWindow) * 100).toFixed(1)
            const bar = "█".repeat(Math.min(5, Math.round((e.tokens / ctxWindow) * 50)))
            lines.push(`- ${e.label}: ${e.tokens} tk (${pct}%) ${bar}`)
          }
          lines.push(`Total: ${total} tk (${((total / ctxWindow) * 100).toFixed(1)}%)`)
          enc.free()
          return { content: lines.join("\n") }
        },
      })
    })

    await ctx.session.hook("context", (event) => {})

    return () => {}
  },
})

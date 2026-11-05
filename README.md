# context-inspector

Plugin OpenCode qui affiche l'utilisation du contexte (plugins et skills actifs) et propose une commande pour lister/désactiver.

## Emplacement

Stocké dans `.opencode/plugins/context-inspector/` (plugin local chargé automatiquement).

## Usage

- Commande slash: `/context-usage`
- Palette: "Show context usage"

## Désactivation

Pour désactiver un plugin/skill, utilisez les transforms côté serveur (`ctx.plugin` est read-only; désactiver un skill se fait via `ctx.skill.transform` avec `editor.remove(id)` ou en le retirant de la config).

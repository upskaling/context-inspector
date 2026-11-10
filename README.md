# context-inspector

Plugin OpenCode qui affiche l'utilisation du contexte par les skills réellement chargés.

## Emplacement

Stocké dans `.opencode/plugins/context-inspector/` (plugin local chargé automatiquement).

## Usage

- Commande slash: `/context-usage`
- Palette: "Show context usage"

La vue liste uniquement les **skills chargés** : elle interroge le registre du
serveur à chaque ouverture (et non le cache TUI). Elle tient donc compte des
transforms, dont le filtrage par dépôt du plugin `../skill-groups` : un skill
masqué dans le répertoire courant n'apparaît pas. Les skills sans description
ou avec `opencode/autoinvoke: false` sont également exclus, car ils ne sont pas
annoncés au modèle.

Le tool `context_budget` applique la même règle côté serveur.

## Intégration avec skill-groups

Aucune configuration supplémentaire n'est nécessaire. `skill-groups` retire les
skills non autorisés du registre via `ctx.skill.transform`; `context-inspector`
relit ce registre à chaque ouverture, donc les deux plugins restent cohérents,
même après un changement de groupe pour le dépôt courant.

## Désactivation

Pour désactiver un plugin/skill, utilisez les transforms côté serveur (`ctx.plugin` est read-only; désactiver un skill se fait via `ctx.skill.transform` avec `editor.remove(id)` ou en le retirant de la config).

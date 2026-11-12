# Pile de skills et de connecteurs (partie 1 et 2 du Business OS), vérifiée le 12 novembre 2026

Chaque dépôt cité dans le document a été vérifié sur GitHub. Trois références étaient fausses : elles sont corrigées ici.

## Ce qui est déjà en place

| Élément | État |
|---|---|
| Skills anthropics/skills (docx, xlsx, pptx, pdf) | Déjà disponibles dans Claude (skills « anthropic-skills:* »). Rien à cloner. |
| Connecteurs Google Agenda, Gmail, Drive, Sheets | Connectés sur votre compte claude.ai (méthode 1 du document). Ils fonctionnent aussi dans Claude Code. |
| Skills motion / vidéo du site | `.claude/skills/` (voir CLAUDE.md) |
| Plugins « marketing », « productivity », « design » | Installés |

## Plugins officiels recommandés (catalogue Anthropic)

| Plugin | Pourquoi | Commandes utiles |
|---|---|---|
| **Small Business** (Anthropic) | C'est le « Claude for Small Business » du document. Connecteurs Google, HubSpot, QuickBooks, Canva, Docusign. | `/monday-brief`, `/content-strategy`, `/cash-flow-snapshot`, `speed-to-lead`, `lead-triage`, `crm-autopilot` |
| **Claude for Financial Advisors** (Anthropic) | Pré-rencontre, post-rencontre, accueil de prospect, résumés succession / fiscalité, revue de conformité. Les connecteurs de portefeuille (Orion, Black Diamond…) sont américains : seuls Gmail, Agenda et Drive vous serviront. | `pre-meeting`, `post-meeting`, `prospect-intake`, `compliance` |
| **Sales** (Anthropic) | Préparation d'appel, objections, pipeline, relances. | `call-prep`, `handle-objection`, `pipeline-review`, `daily-briefing` |

S'installent depuis claude.ai > Personnaliser > Plugins (ou la carte proposée dans la conversation).

## Dépôts GitHub du document

| Dépôt cité | Réel ? | Recommandation |
|---|---|---|
| `anthropics/skills` | Oui (≈ 194 k étoiles) | Déjà inclus (voir plus haut). |
| `obra/superpowers` | Oui (≈ 317 k étoiles) | Méthode de **développement logiciel** (brainstorm → plan → tests). Utile pour coder, pas pour planifier votre semaine. Facultatif. |
| `wshobson/agents` | Oui (≈ 42 k étoiles) | 100+ agents surtout techniques. Charger tout le paquet alourdit chaque conversation ; installer seulement un plugin précis au besoin. |
| `Funxgao/claude-skills` | **N'existe pas** | La bibliothèque décrite (centaines de skills, 9 domaines) est `alirezarezvani/claude-skills` (≈ 30 k étoiles). |
| `hesreallyhim/awesome-claude-code` | Oui (≈ 58 k étoiles) | Moteur de recherche à mettre en favori, rien à installer. |
| `minhnv0807/ai-business-skills` | Oui (≈ 670 étoiles) | 138 skills marketing, moitié en vietnamien. Faible valeur pour vous. |
| `coreyhaines31/marketingskills` | Oui (≈ 60 k étoiles) | Bon complément contenu / conversion. |
| `mcpmarket/google-calendar-automation` | **N'existe pas** | mcpmarket.com est un annuaire. Inutile : le connecteur Google Agenda officiel est déjà branché. |
| `@cocal/google-calendar-mcp` | Oui (paquet npm de `nspady/google-calendar-mcp`) | Seulement si vous voulez un serveur MCP local à la place du connecteur claude.ai. |
| `anthropics/gmail-cli`, `anthropics/google-drive-cli` | **N'existent pas** | Utiliser les connecteurs Gmail et Drive officiels. |

## Installer les dépôts facultatifs (Claude Code, sur votre ordinateur)

```bash
claude plugin marketplace add coreyhaines31/marketingskills
```

```bash
claude plugin marketplace add obra/superpowers
```

Méthodes 3 et 4 du document (Merge Agent Handler, CData Connect AI) : inutiles pour un cabinet d'une personne déjà
connecté par la méthode 1.

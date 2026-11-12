# Business OS · W Héritage

Mise en œuvre du document « Claude Business OS : Complete Efficiency System for Financial Advisors ».
Dossier privé : exclu du déploiement (`.vercelignore`), il n'apparaît pas sur le site.

| Fichier | Partie du document | Usage |
|---|---|---|
| `MEMORY.md` | Prompt 54 | Contexte permanent. À coller dans les instructions du projet Claude « Business OS - Walid ». Compléter les objectifs 2026. |
| `GARDE-FOUS.md` | Partie 7 | À coller dans les instructions de CHAQUE projet Claude. |
| `PROMPTS.md` | Partie 4 (55 prompts) + rituels | Adaptés à un CSF québécois à commission (aucune référence américaine, aucun chiffre inventé). |
| `TACHES-PLANIFIEES.md` | Prompt 53, partie 5 | Les 15 automatisations : 6 déjà écrites (Apps Script, GitHub Actions), les autres avec un prompt autonome prêt. |
| `semaine-ideale.ics` | Partie 3 B | Semaine idéale de 45 h, récurrente, à importer dans un agenda Google dédié. |
| `efficacite-personnelle.ics` | Prompt 13 | Entraînement, formation continue (UFC), repas, préparation du dimanche. |
| `objections.md` | Prompt 30 | 15 objections québécoises. |
| `modeles/` | Jour 4 du plan | Note CRM, courriel de récapitulatif, ordre du jour de revue, brief de découverte. |
| `SKILLS.md` | Parties 1 et 2 | Pile de skills vérifiée (3 dépôts du document n'existent pas : corrigés). |

Le système de leads (parties 5 A et B : capture, rappels, relances) est déjà branché au site : voir
`../LEAD-PROTECTION.md` et `../tools/apps-script-diagnostic.gs`.

## Importer les agendas

Google Agenda > Paramètres > Importer et exporter > Importer > choisir le fichier `.ics` et un agenda **dédié**
(créer d'abord « Semaine idéale » pour pouvoir tout masquer ou supprimer d'un coup). Début : lundi 16 novembre 2026.
Samedi famille et « aucune notification de 21 h à 7 h » : à régler à la main (bloc d'une journée, mode Concentration du téléphone).

## Plan de 7 jours (partie 6), avec l'état

| Jour | À faire | État |
|---|---|---|
| 1 · Fondation | Créer le projet Claude « Business OS - Walid » (MEMORY.md + GARDE-FOUS.md), vérifier les connecteurs : « Qu'est-ce que j'ai à l'agenda demain ? » | Fichiers prêts ; connecteurs Google déjà branchés |
| 2 · Agenda | Importer `semaine-ideale.ics`, créer l'agenda « Callbacks » (fait automatiquement par `installTriggers()`), tâche « Brief du matin » | Fichiers et prompt prêts |
| 3 · Leads | Feuille Leads, intake, rappels de 9 h et 16 h 30 | **Fait** : Apps Script (installer selon LEAD-PROTECTION.md) |
| 4 · Rencontres | Prompts 16, 17, 18 + modèles | **Fait** : `PROMPTS.md`, `modeles/` |
| 5 · Contenu | Calendrier de 30 jours (P32), 3 publications (P33), tâche du lundi | Prompts prêts |
| 6 · Personnel | Agenda personnel, MEMORY.md, P50, dépenses | Fichiers prêts ; lien du dossier de reçus à fournir |
| 7 · Test | 2 faux leads, 1 découverte, 1 revue : vérifier rappels, notes, contenu | Faux leads : `node tools/test-leads.mjs` et `node tools/test-apps-script.mjs` |

## Projet Claude « Lead Management » : instructions

```
Tu es mon adjoint aux ventes. Tu gères l'onglet « Leads » de la feuille « Leads W Héritage ».
Règles : rappel en 2 h si Hot (numéro vérifié par code), 24 h si Warm. 5 relances par lead. Aucun lead « Nouveau »
plus de 24 h. Les lignes « À vérifier » (jaune) : rappeler mais confirmer nom et courriel au début de l'appel.
L'onglet « Quarantaine » n'est jamais appelé sans mon accord. Messages en français si le courriel finit par .qc.ca
ou si le nom est francophone, sinon en anglais. Tout message est un brouillon pour ma relecture.
```
Ajouter ensuite le contenu de `GARDE-FOUS.md`.

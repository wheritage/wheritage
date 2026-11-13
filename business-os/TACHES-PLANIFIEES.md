# Tâches planifiées (prompt 53 du Business OS)

Les 15 automatisations du document, avec l'outil le plus fiable pour chacune :
- **Apps Script** (Google, gratuit, tourne même ordinateur fermé) pour tout ce qui est mécanique sur la feuille et l'agenda. **Déjà écrit**, voir `tools/apps-script-diagnostic.gs`.
- **Tâche planifiée Claude** (claude.ai, connecteurs Gmail / Agenda / Sheets / Drive) pour ce qui demande de lire, résumer ou rédiger.
- **Zapier / Make** seulement quand un événement extérieur doit déclencher Claude.

| # | Quand (heure de Montréal) | Quoi | Outil | État |
|---|---|---|---|---|
| 1 | Jours ouvrables 7 h 30 | Brief du matin | Claude | Prompt prêt (ci-dessous) |
| 2 | Jours ouvrables 12 h 30 | Préparation des rencontres de l'après-midi | Claude | Prompt prêt |
| 3 | Jours ouvrables 17 h | Fermeture + 3 priorités de demain | Claude | Prompt prêt |
| 4 | Lundi 8 h | Monday brief | Claude (plugin Small Business : `/monday-brief`) | Prompt prêt |
| 5 | Vendredi 15 h | Rapport hebdo des leads | Apps Script `rapportHebdo` | **Écrit** |
| 6 | Dimanche 19 h | Dépenses (reçus Drive → feuille) | Claude | Prompt prêt (lien du dossier à fournir) |
| 7 | 1er du mois 9 h | Renouvellements fournisseurs + liste de domaines jetables | Claude + GitHub Actions | Domaines : **écrit** (`.github/workflows/disposable-domains.yml`) |
| 8 | Jours ouvrables 9 h | Rappels en retard | Apps Script `callbackCheck` | **Écrit** |
| 8b | Jours ouvrables 16 h 30 | Prochaine relance des leads contactés | Apps Script `followUpPlan` | **Écrit** |
| 8c | Toutes les 5 min | Numéro non confirmé → quarantaine | Apps Script `quarantinePending` | **Écrit** |
| 8d | Tous les jours 18 h | Rapport leads + quarantaine | Apps Script `rapportQuotidien` | **Écrit** |
| 9 | Lundi 8 h 30 | 3 publications LinkedIn | Claude | Prompt prêt |
| 10 | 1er du mois | Portrait de trésorerie | Claude (`/cash-flow-snapshot`) | Prompt prêt |
| 11 | 1er jour du trimestre | Revue des commissions (P7) | Claude | Prompt prêt (relevé à fournir) |
| 12 | Tous les jours 8 h | Anniversaires dans 7 jours | Claude | Prompt prêt |
| 13 | Après chaque rencontre | Transcription → note CRM | Zapier (enregistreur → Claude) ou manuel avec P16 | À décider : quel outil enregistre vos rencontres ? |
| 14 | Nouveau lead | Accueil du lead | Site → feuille directement | **Écrit** (plus besoin de Gmail → Zapier) |
| 15 | Dimanche 18 h | Préparation de la semaine (P50) | Claude | Prompt prêt |

## Prompts autonomes des tâches Claude

Chaque prompt est écrit pour démarrer d'une page blanche (une tâche planifiée ne voit pas les conversations précédentes).

**1 · Brief du matin**
> Tu es l'adjoint de Walid Harchaoui, CSF (W Héritage). Lis : mon Google Agenda d'aujourd'hui (agendas principal et « Callbacks »), l'onglet « Leads » de la feuille Google « Leads W Héritage » (statut Nouveau ou À vérifier, et la colonne Heure rappel = aujourd'hui), et les courriels Gmail non lus des dernières 24 h de clients ou prospects (ignore les infolettres). Envoie-moi par Gmail un brief d'une page intitulé « Brief du [date] » : rencontres du jour avec 2 points à préparer chacune ; rappels en ordre de priorité (Hot d'abord, avec téléphone) ; courriels qui demandent une réponse aujourd'hui ; mes 3 priorités. Aucun conseil financier ; initiales pour les clients existants.

**2 · Préparation de l'après-midi**
> Lis mon Google Agenda de 13 h à 18 h aujourd'hui. Pour chaque rencontre avec un client ou un prospect, cherche dans Gmail et dans l'onglet « Leads » de la feuille « Leads W Héritage » le dernier échange. Envoie-moi par Gmail : pour chaque rencontre, le dernier point discuté et 2 questions à poser. Rien à envoyer à qui que ce soit d'autre.

**3 · Fermeture**
> Fais le bilan de ma journée : événements terminés de mon Google Agenda, courriels envoyés aujourd'hui dans Gmail, leads de l'onglet « Leads » dont le statut a changé. Envoie-moi par Gmail : ce qui est fait, ce qui reste, les 3 priorités de demain, et la liste des leads appelés aujourd'hui dont la colonne « Dernier contact » est encore vide.

**4 · Monday brief**
> Lundi 8 h. Avec mon Google Agenda de la semaine, l'onglet « Leads » (nouveaux leads de la semaine passée, pipeline par statut) et Gmail : brief de la semaine en une page (rencontres clés, leads Hot à rappeler, suivis en retard, 3 priorités, une décision à prendre). Envoie-le-moi par Gmail.

**6 · Dépenses** (remplacer les deux liens)
> Regarde le dossier Google Drive [LIEN DOSSIER REÇUS] pour les fichiers ajoutés depuis 7 jours. Pour chaque reçu : fournisseur, montant, date, catégorie (déplacement, logiciel, repas, sous-traitant, équipement, publicité, autre). Ajoute une ligne par reçu à la feuille [LIEN FEUILLE DÉPENSES]. Envoie-moi par Gmail le total par catégorie et la liste des montants de plus de 500 $.

**9 · Publications LinkedIn**
> Tu écris pour Walid Harchaoui, CSF, W Héritage (propriétaires d'entreprise incorporés et professionnels au Québec). Regarde les questions reçues par courriel la semaine dernière (Gmail) et la colonne « Besoin » des nouveaux leads de l'onglet « Leads ». Rédige 3 publications LinkedIn : accroche d'une ligne, histoire en 3 lignes, 3 points, une question ; moins de 180 mots ; « Information générale seulement, pas un conseil personnalisé. » ; aucun produit, aucun rendement promis, aucun chiffre inventé. Enregistre-les comme brouillon Gmail adressé à moi-même, objet « LinkedIn : 3 brouillons ».

**10 · Trésorerie** (plugin Small Business)
> `/cash-flow-snapshot` pour le mois dernier : commissions reçues, dépenses (feuille de dépenses), écart avec le mois précédent. Envoie-le-moi par Gmail.

**11 · Revue des commissions** : prompt P7 de `PROMPTS.md`, avec le relevé du cabinet déposé dans Drive > Commissions.

**12 · Anniversaires**
> Cherche dans mes contacts Google et dans mon Google Agenda les anniversaires de clients qui tombent dans exactement 7 jours. Pour chacun, rédige un mot personnel court (vouvoiement, aucun contenu commercial) en brouillon Gmail et crée un événement « Carte ou appel : [nom] » le jour de l'anniversaire à 10 h. S'il n'y en a aucun, ne fais rien.

**15 · Préparation de la semaine** : prompt P50 de `PROMPTS.md`.

## Créer une tâche planifiée

Dans claude.ai : Personnaliser > Tâches planifiées, ou demandez à Claude dans une conversation : « Crée une tâche planifiée chaque jour ouvrable à 7 h 30 avec ce prompt : … ». Les tâches qui lisent Gmail, l'Agenda ou Sheets ont besoin de ces connecteurs.

## À créer dans claude.ai (Personnaliser > Routines / Tâches planifiées)

Une tâche créée depuis Claude Code ne reçoit pas vos connecteurs Gmail / Agenda / Sheets sur ce compte : elle
tournerait à vide. Créez donc ces 6 tâches dans l'interface claude.ai, en cochant **Gmail, Google Calendar et
Google Sheets** (Gmail seulement pour LinkedIn), « nouvelle session à chaque exécution ». Heures de Montréal,
décalées de quelques minutes pour éviter les files d'attente de l'heure pile.

Les blocs de la semaine idéale sont déjà dans votre agenda principal, marqués « Libre » (Cal.com vous voit
disponible) et décrits par « [Business OS] » : les prompts les ignorent.

| Tâche | Quand | Prompt |
|---|---|---|
| Brief du matin | lun-ven 7 h 17 | 1 ci-dessus, en ajoutant : « Ignore les événements dont la description commence par [Business OS]. Si l'onglet Leads n'existe pas, passe sans erreur. » |
| Préparation de l'après-midi | lun-ven 12 h 13 | 2 ci-dessus (+ même ajout ; n'envoie rien s'il n'y a aucune rencontre) |
| Fermeture | lun-ven 16 h 47 | 3 ci-dessus (+ même ajout) |
| Monday brief | lundi 7 h 43 | 4 ci-dessus (+ même ajout) |
| 3 brouillons LinkedIn | lundi 8 h 21 | 9 ci-dessus |
| Préparation de la semaine | dimanche 17 h 41 | P50 de PROMPTS.md, résultat envoyé par courriel à vous-même |

Les tâches 6 (dépenses), 10 (trésorerie), 11 (commissions) et 12 (anniversaires) attendent : le lien du dossier de
reçus, un logiciel comptable connecté, le relevé de commissions, et des anniversaires dans vos contacts Google.

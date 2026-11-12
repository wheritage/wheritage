# Protection anti-faux leads + vérification par texto

Ce qui est en place sur le site, ce qu'il reste à activer (comptes et clés), et ce que ça coûte.
Sources : « Ultimate Fake Lead Prevention V2 » et « SMS Phone Verification Guide ».

## Ce qui fonctionne dès le déploiement (sans aucune clé)

| Couche | Où | Effet |
|---|---|---|
| Règles NANP | `assets/lead-guard.js` (navigateur, serveur, Apps Script) | Indicatifs canadiens réels seulement (444, 555, 111… refusés), central 0XX/1XX/N11/958/959 refusé, 555-0100 à 0199 (fictifs) refusés, sans-frais refusés |
| Motifs de faux numéros | idem | 7 chiffres identiques, séquences 1234567/7654321, paires et triplets répétés, numéros de test connus, `444444`, trop de zéros |
| Faux courriels | idem | `test@`, `test123@`, `fake@`, `asdf@`, `qwerty@`, `noreply@`, `aaaa@`… même sur gmail.com ; IP comme domaine ; TLD réservés |
| Courriels jetables | navigateur : 150 courants ; serveur : **10 181 domaines** (`api/_lib/disposable-domains.js`, mis à jour le 1er de chaque mois par GitHub Actions) | Refusés avec « utilisez votre adresse permanente » |
| Fautes de frappe | idem | `gmai.com`, `gmial.com`, `hotmail.con`, `yahoo.cm`… → suggestion cliquable ; renvoyé tel quel = accepté avec +30 |
| Domaine sans MX | `api/verify-lead.js` | Refusé (« ce domaine ne peut pas recevoir de courriels ») ; une panne DNS ne bloque personne |
| Nom / message | `lead-guard.js` | Chiffres, @, « John Doe », « test », charabia sans voyelle, clavier (qwerty), 3 lettres répétées ; message « test », lorem ipsum, spam |
| Pot de miel | champ caché `website` sur les 4 formulaires | Faux succès, rien n'est envoyé ni enregistré |
| Temps de remplissage | `LeadGuard.watch()` | Envoi < 3 s après l'ouverture de la page refusé ; focus, frappes et collages mesurés |
| Limites de débit | `api/verify-lead.js` | Par IP : 3 / 10 min, 5 / h, 10 / jour ; même courriel ou téléphone : 2 / h |
| Géo | en-têtes Vercel | IP hors Canada / É.-U. : +20 |
| Pointage 0-100 | partout | 0-29 propre · 30-69 à vérifier · 70+ faux → quarantaine |
| Origine | `api/_lib/core.js` | Seules les pages du site peuvent appeler `/api` (protège le compte Twilio) |
| Feuille Google | `tools/apps-script-diagnostic.gs` | Revérifie chaque lead, onglets Leads / Quarantaine / Blocklist, doublons 30 jours fusionnés, rappels agenda, rapports |

Formulaires couverts : `/diagnostic` (entrepreneur et particulier), formulaire de contact et guide de l'accueil, guides de `/strategie-societe`.

## À activer (dans cet ordre)

### 1. Twilio : vérification du numéro par texto (recommandé)

1. Créer un compte sur twilio.com et le **passer en compte payant** (un compte d'essai n'envoie qu'aux numéros vérifiés).
2. *Verify > Services > Create new* : nom « Walid Leads », longueur du code 6, expiration 10 min. Activer **Fraud Guard**.
3. *Messaging > Settings > Geo permissions* et *Voice > Settings > Geo permissions* : cocher **Canada** (et États-Unis au besoin), rien d'autre. C'est la meilleure protection contre le « SMS pumping ».
4. *Lookup* : la fonction Line Type Intelligence s'active à la première requête. Pour `sim_swap` et `call_forwarding` au Canada, il faut une approbation (demande dans la console) ; sans elle, laissez `TWILIO_LOOKUP_FIELDS` par défaut.
5. Dans Vercel > Settings > Environment Variables : `TWILIO_API_KEY` + `TWILIO_API_SECRET` (ou `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`), `TWILIO_VERIFY_SERVICE_SID`. Redéployer.

Dès que ces 3 clés existent, `/diagnostic` affiche l'étape « Étape 2 sur 2 · Vérification » (consentement LCAP, code à 6 cases, renvoi après 60 s, appel vocal, verrouillage 15 min après 3 erreurs). Rien à changer dans le code.

**Inscription 10DLC** : le guide SMS la donne comme obligatoire. Elle vise les messages envoyés depuis *votre* numéro 10 chiffres vers les États-Unis. Twilio Verify envoie depuis ses propres expéditeurs déjà enregistrés : pas d'inscription à faire pour ce flux. À vérifier seulement si vous envoyez un jour vos propres textos marketing.

### 2. Preuve signée (5 minutes, recommandé)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Mettre la valeur dans Vercel (`LEAD_PROOF_SECRET`) **et** dans Apps Script > Paramètres du projet > Propriétés du script (`LEAD_PROOF_SECRET`). La feuille refuse alors de croire « vérifié » sans preuve du serveur : un robot qui écrit directement dans le script ne peut pas inventer un lead vérifié.

### 3. Apps Script (feuille « Leads W Héritage »)

Suivre l'en-tête de `tools/apps-script-diagnostic.gs` : coller le fichier, coller `assets/lead-guard.js` dans un fichier `LeadGuard.gs`, remplacer la ligne de `doPost`, exécuter `installTriggers()` une fois, redéployer **le même** déploiement. Déclencheurs créés :

| Quand | Fonction | Effet |
|---|---|---|
| Toutes les 5 min | `quarantinePending` | Numéro non confirmé après 5 min → Quarantaine (+ courriel au prospect si `RAPPEL_PROSPECT=1`) |
| 9 h | `callbackCheck` | Lead ouvert sans contact depuis 3 jours (ou jamais rappelé après 24 h) → événement « CALLBACK » à 10 h le prochain jour ouvrable ; retard > 7 jours en rouge |
| 16 h 30 | `followUpPlan` | Lead contacté aujourd'hui → relance dans 3 jours ouvrables |
| 18 h | `rapportQuotidien` | Courriel : leads du jour, quarantaine et raisons, rappels en retard |
| Vendredi 15 h | `rapportHebdo` | Semaine vs semaine précédente, écarts de plus de 10 % signalés |
| 3 h | `anonymiserIp` | Loi 25 : IP effacée après 30 jours |

Un lead vérifié crée tout de suite un événement « CALLBACK: Prénom Nom - VÉRIFIÉ » dans l'agenda « Callbacks » (2 h plus tard pendant les heures ouvrables, sinon 10 h le prochain jour ouvrable), avec le script d'appel.

Ces tâches tournent dans Google, gratuitement et même ordinateur fermé : c'est plus fiable qu'une tâche Claude pour du travail mécanique.

### 4. Facultatif

| Service | Variable(s) | Quand l'ajouter |
|---|---|---|
| Cloudflare Turnstile (gratuit) | `TURNSTILE_SECRET` dans Vercel + `turnstileSiteKey` dans `assets/site.js` | Si des robots passent malgré le pot de miel. Ajouter Cloudflare dans la politique de confidentialité. |
| Upstash Redis / Vercel KV (gratuit) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Limites de débit exactes entre toutes les instances Vercel (sans : par instance) |
| Abstract API (100 / mois gratuits) | `ABSTRACT_EMAIL_KEY` | Vérification SMTP de la boîte (non livrable, catch-all, rôle) |
| IPQualityScore (1 000 / mois gratuits) | `IPQS_KEY` | VPN, proxy, Tor |

## Coûts (Twilio Verify, prix du guide, octobre 2026 : 0,05 $ par vérification réussie + 0,0083 $ par texto ; Lookup 0,008 $)

| Leads / mois | Vérifiés (70 %) | Verify | Lookup | Total / mois |
|---|---|---|---|---|
| 100 | 70 | 4,08 $ | 0,80 $ | **≈ 4,90 $ US** |
| 500 | 350 | 20,41 $ | 4,00 $ | **≈ 24,40 $ US** |

Turnstile, Upstash, Abstract et IPQS restent gratuits à ces volumes. Les prix exacts du Canada sont sur twilio.com/verify/pricing.

## Écarts volontaires par rapport aux documents

- **« 444 n'importe où »** : seuls l'indicatif 444 et `444444` sont bloqués. Bloquer toute suite « 444 » refuserait de vrais numéros (450 444-…).
- **VoIP fixe** : signalée (+15) et code proposé par appel vocal, pas bloquée. Beaucoup de lignes résidentielles au Québec sont de la VoIP fixe. La VoIP non fixe (Google Voice, TextNow) est bloquée.
- **Charabia dans le courriel** : points de risque, pas blocage (des initiales peuvent y ressembler). Le code SMS tranche.
- **Le cas de test 1** du document (`(514) 123-4567`) est invalide au NANP (central 123) : il est refusé.
- **« Walid vous rappelle dans 2 h »** n'est pas affiché : c'est une promesse de délai que le site ne peut pas garantir. L'écran affiche « ✓ Numéro vérifié » et le calendrier de réservation.
- **Firebase** (option 2 du guide SMS) n'est pas utilisé : il crée des comptes utilisateurs Firebase et impose son modèle de message.

## Tester

```bash
node tools/test-leads.mjs
```

```bash
node tools/test-apps-script.mjs
```

```bash
MOCK_TWILIO=1 node tools/dev-server.mjs
```

Le premier rejoue les 20 cas du document (résultats dans `TEST_RESULTS_V2.md`), le deuxième exécute le script de la feuille avec des simulacres Google, le troisième sert le site sur http://localhost:3000 avec un Twilio simulé (code `123456` ; 514 700-0000 = Google Voice, 514 700-0001 = ligne inactive). En production, `/diagnostic?debug` affiche la réponse de Web3Forms sous le résultat.

## Script Loom pour une adjointe (3 minutes)

1. **La feuille** (30 s) : « Les leads arrivent dans l'onglet Leads. La case OTP vérifié veut dire que la personne a entré le code reçu par texto : le numéro est réel et c'est le sien. »
2. **Les statuts** (45 s) : « Nouveau = à rappeler. À vérifier (jaune) = la personne a passé la vérification ou le pointage est moyen : on appelle, mais on vérifie le nom et le courriel au début de l'appel. En attente vérif (gris) = elle est à l'étape du code ; après 5 minutes, la ligne passe seule en Quarantaine. »
3. **La quarantaine** (45 s) : « Ici, les faux probables, avec la raison. On n'appelle pas. Si un vrai client s'y trouve (ça arrive si quelqu'un n'a pas reçu le code), on le remet à la main dans Leads et on retire sa ligne de la Blocklist s'il y est. »
4. **L'agenda Callbacks** (30 s) : « Chaque lead vérifié crée un rappel avec le script d'appel. À 9 h, les leads sans contact depuis 3 jours reçoivent un nouveau rappel ; au-delà de 7 jours, la ligne devient rouge. »
5. **Après chaque appel** (30 s) : « On inscrit la date dans Dernier contact et on change le Statut. Le lendemain, la relance se planifie toute seule (3 jours ouvrables). »

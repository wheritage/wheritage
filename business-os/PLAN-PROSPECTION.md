# Plan de prospection 2026 · W Héritage

But : **20 personnes qualifiées appelées chaque semaine**, **au moins 10 nouveaux clients par mois** (en visant
une majorité de gros clients), **chaque client revu tous les 6 mois**, et des **placements ramenés** pour bâtir le
revenu de renouvellement. L'objectif de revenu lui-même reste dans le projet Claude privé (ce dépôt est public).

Le tableau de bord du vendredi 15 h (courriel de la feuille Leads) mesure tout ce plan : appels / 20, clients / 10,
placements ramenés, revues faites et en retard.

---

## 1. Le calcul à rebours

**10 clients par mois, c'est environ 2,5 par semaine.** Pour y arriver, il faut un entonnoir assez large :

| Étape | Par semaine | Hypothèse de départ |
|---|---|---|
| Personnes qualifiées **jointes** (vraie conversation) | **20** | votre cible |
| Rendez-vous découverte obtenus | 6 | 3 conversations sur 10 |
| Présentations de stratégie | 4 | 2 découvertes sur 3 |
| Nouveaux clients | **2,5** | 6 présentations sur 10 |

> Ces taux sont des **hypothèses de départ, pas des statistiques**. Après 4 semaines, remplacez-les par les vôtres :
> le « Journal appels » compte les conversations, l'onglet Leads compte les découvertes (statut Découverte),
> les présentations (Proposition) et les clients (Gagné). Si un taux est plus bas, c'est l'étape à travailler,
> pas forcément le nombre d'appels.

Deux règles qui découlent du calcul :
1. **20 = conversations, pas des numéros composés.** Il faut composer environ deux fois plus pour joindre 20 personnes.
   Le pipeline ouvert doit donc toujours contenir **au moins 40 noms** à appeler (le rapport du vendredi le signale).
2. **Les gros clients se font surtout par références et centres d'influence**, rarement par la publicité. C'est là que
   va le meilleur de votre temps.

---

## 2. Les 6 moteurs, avec un quota chacun

| # | Moteur | Pourquoi | Quota hebdo | Bloc de votre agenda |
|---|---|---|---|---|
| 1 | **Revues semestrielles des clients** | Les plus chauds : vente de plus, transfert de placements, références | (nb de clients ÷ 26) revues | Mercredi 10 h - 15 h 30 |
| 2 | **Références** | Arrivent avec la confiance déjà bâtie ; souvent des gros clients | 2 noms demandés à chaque revue et chaque fermeture | Partout |
| 3 | **Centres d'influence** (CPA, fiscalistes, notaires, avocats d'affaires, courtiers hypothécaires et immobiliers) | Ils voient les propriétaires incorporés avant tout le monde | 1 rencontre + 1 envoi de valeur | Lundi 15 h 30 |
| 4 | **Leads du site** (diagnostic, guides) | Déjà qualifiés et vérifiés par code | Rappel en 2 h (Hot), 24 h (Warm) | Lundi 10 h + agenda Callbacks |
| 5 | **Réseau et événements** (marché naturel, chambre de commerce locale, groupes d'affaires, associations professionnelles de vos niches) | Sources de nouveaux noms | 5 nouveaux noms ajoutés à la feuille | Jeudi 15 h 30 |
| 6 | **Réactivation** (leads Perdu ou sans réponse depuis plus de 90 jours, anciens clients sans revue) | Gratuit : ils vous connaissent déjà | 5 relances | Mardi 13 h 30 |

Répartition visée des **20 conversations** : 4 à 6 clients (revues), 4 références, 4 leads du site, 3 centres
d'influence ou leurs clients, 3 réactivations / réseau. Ajustez selon ce qui convertit le mieux dans vos chiffres.

---

## 3. Viser les gros clients

**Gros client** (colonne « Taille client ») : propriétaire incorporé avec des surplus dans sa société, ou personne
avec des placements importants à ramener, ou besoin de convention d'actionnaires / planification successorale.
Fixez votre propre seuil en dollars dans le projet Claude privé.

- **Niches** : les liens `/diagnostic?niche=construction` (et sante_pro, transport, commerce, conseil_ti) existent déjà.
  Choisissez-en **deux** pour 90 jours ; tout le contenu et les centres d'influence de la période vont vers elles.
- **Centres d'influence de niche** : le CPA des entrepreneurs en construction vaut plus que dix CPA généralistes.
- **Porte d'entrée** : la revue gratuite du diagnostic (15 min), puis la rencontre découverte. Pour un gros client,
  proposez d'inviter son comptable : c'est le chemin le plus court vers la décision.
- **Le reste n'est pas refusé** : les clients moyens (10 par mois minimum) financent le quotidien et donnent des références.

---

## 4. Les revues semestrielles : votre meilleur moteur

Automatisé dans la feuille : quand un lead passe à **Gagné**, la prochaine revue est fixée à 6 mois ; le 1er de
chaque mois, vous recevez la liste des revues dues (et en retard). Après chaque revue, inscrivez la date dans
« Dernière revue » : la suivante se planifie seule.

Chaque revue a **trois buts**, dans cet ordre :
1. **Ce qui a changé** (famille, revenu, société, santé) → besoin non couvert → **une vente de plus**
2. **Ce qui est ailleurs** : « Avez-vous encore des REER, CELI ou placements dans d'autres institutions ? » →
   **transfert** (inscrire le montant dans « Actifs ramenés ($) »)
3. **Qui d'autre** : demande de références (script plus bas)

Préparation : prompt 17 et `modeles/ordre-du-jour-revue.md`. Après : prompt 16 (note + courriel de récapitulatif).

---

## 5. Scripts (vouvoiement, « stratège, pas vendeur »)

**Lead du diagnostic (rappel en 2 h)**
> « Bonjour [Prénom], Walid Harchaoui de W Héritage. Vous avez fait le diagnostic sur mon site tout à l'heure ;
> votre résultat montre une exposition [niveau] sur [enjeu principal]. Je vous appelle pour en faire la revue,
> ça prend 15 minutes. C'est un bon moment, ou on se garde un moment cette semaine ? »

**Demande de références (fin de revue ou de fermeture)**
> « Je travaille surtout par recommandation, ce qui me permet de prendre le temps qu'il faut avec chacun.
> Qui sont deux personnes autour de vous, entrepreneurs ou professionnels, qui se posent les mêmes questions que vous
> vous posiez avant notre travail ? Je ne les appelle pas sans votre accord : est-ce que vous leur en parlez d'abord,
> ou je mentionne votre nom ? »

**Premier contact avec un centre d'influence**
> « Bonjour [Nom], je suis Walid Harchaoui, conseiller en sécurité financière. Je travaille avec des propriétaires
> incorporés sur ce que leurs surplus deviennent : revenu passif, succession, liquidités au décès. Je ne fais pas
> de fiscalité : je cherche justement des comptables avec qui coordonner. Est-ce que je peux vous inviter à un café
> de 30 minutes pour comprendre comment vous travaillez avec vos clients ? »

**Réactivation (texto ou courriel, 90 jours plus tard)**
> « Bonjour [Prénom], on s'était parlé en [mois] de [enjeu]. Est-ce que c'est toujours d'actualité, ou est-ce que
> je ferme votre dossier de mon côté ? Les deux réponses me vont. »

**Objections** : `objections.md` (15 réponses).

---

## 6. Démarrage en 90 jours

| Période | Actions | Résultat attendu |
|---|---|---|
| **Semaines 1-2** | Lister **100 noms** dans l'onglet Leads (clients actuels, marché naturel, anciens contacts) avec Source et Taille client ; marquer vos clients actuels « Gagné » avec la date de leur dernière revue (les revues se planifient seules) ; lister **15 centres d'influence** de vos deux niches ; installer l'Apps Script | Pipeline ≥ 40 noms ; toutes les revues datées |
| **Semaines 3-6** | 20 conversations / semaine ; toutes les revues en retard faites ; 1 café avec un centre d'influence par semaine ; 3 publications LinkedIn + 1 Reel par semaine sur vos deux niches | Premiers vrais taux de conversion (remplacer les hypothèses de la section 1) |
| **Semaines 7-12** | Doubler ce qui convertit le mieux ; lancer une petite publicité vers `/diagnostic?niche=…` seulement si le site convertit déjà ; webinaire ou dîner-conférence avec un centre d'influence | 10 clients / mois atteints ou l'étape faible identifiée |

---

## 7. Contenu qui alimente la prospection

- **Lundi 8 h 21** : 3 brouillons LinkedIn arrivent dans Gmail (tâche planifiée à créer dans claude.ai).
- **Vendredi 8 h 30** : un Reel par semaine sur une question de vos niches (skills `wh-entrepreneur-reel-scripts`,
  `reel-motion-graphics`), appel à l'action vers le diagnostic.
- **Chaque mois** : un courriel de valeur aux centres d'influence (prompt 41) et une infolettre clients (prompt 34).
- Toujours : « Information générale seulement, pas un conseil personnalisé. »

---

## 8. Conformité de la prospection (à valider avec la conformité du cabinet)

- **Appels** : la Liste nationale de numéros de télécommunication exclus (LNNTE) s'applique aux appels de
  télémarketing aux particuliers. Les relations d'affaires existantes et les appels entre entreprises ont des
  exceptions ; vérifiez lesquelles s'appliquent à vous avant d'appeler une liste froide.
- **Courriels et textos** (LCAP) : consentement exprès ou tacite (relation d'affaires récente, référence) requis
  pour un message commercial ; identification et désabonnement dans chaque envoi.
- **Références** : ne contacter la personne recommandée qu'avec l'accord de celui qui la recommande.
- **Témoignages** : aucun sans l'approbation de la conformité.

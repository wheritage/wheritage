# Résultats des tests anti-faux leads (V2)

Généré par `node tools/test-leads.mjs` le 2026-11-12 21:44 UTC, avec Twilio simulé (`tools/twilio-mock.mjs`).
Les vérifications MX, Abstract, IPQualityScore et Turnstile ne sont pas actives dans ce test (pas de clés, réseau DNS du bac à sable).

**31 / 31 réussis.**

| # | Cas | Attendu | Obtenu | |
|---|---|---|---|---|
| 1 | Lead réel : 438 291-5562 + walid.vrai@gmail.com | PASSE, code SMS envoyé | CLEAN 0/100, code SMS requis · send-otp 200 envoyé (sms) | ✅ |
| 1b | Cas 1 tel quel : (514) 123-4567 | BLOQUÉ : le central 123 commence par 1 (impossible au NANP) | BLOQUÉ (tel_central_0_1) « Ce numéro n'est pas valide : les chiffres 4 à 6 ne peuvent pas commencer par 0 ou 1, ni être 211, 311, 411, 511, 611, 711, 811 ou 911. » | ✅ |
| 2 | 444-123-4567 | BLOQUÉ (indicatif 444 inexistant) | BLOQUÉ (tel_indicatif_444) « L'indicatif régional 444 n'existe pas au Canada. Vérifiez les 3 premiers chiffres. » | ✅ |
| 3 | test@gmail.com | BLOQUÉ (préfixe test) | BLOQUÉ (courriel_prefixe_test) « Entrez votre vraie adresse courriel personnelle : « test@gmail.com » n'est pas acceptée. » | ✅ |
| 4 | 444-444-4444 + test@gmail.com | BLOQUÉ, pointage 100 | BLOQUÉ (courriel_prefixe_test) « Entrez votre vraie adresse courriel personnelle : « test@gmail.com » n'est pas acceptée. » · pointage 100 | ✅ |
| 5 | 514-555-0100 (fictif) | BLOQUÉ (555-0100 à 0199 réservés) | BLOQUÉ (tel_fictif_555) « Les numéros 555-0100 à 555-0199 sont réservés au cinéma et à la publicité. Entrez votre vrai numéro. » | ✅ |
| 6 | 111-111-1111 | BLOQUÉ (répétition) | BLOQUÉ (tel_indicatif_0_1) « L'indicatif régional 111 n'existe pas au Canada. Vérifiez les 3 premiers chiffres. » | ✅ |
| 7 | 123-456-7890 | BLOQUÉ (séquence) | BLOQUÉ (tel_indicatif_0_1) « L'indicatif régional 123 n'existe pas au Canada. Vérifiez les 3 premiers chiffres. » | ✅ |
| 8 | 514-411-1234 (N11) | BLOQUÉ (central N11) | BLOQUÉ (tel_central_n11) « Ce numéro n'est pas valide : les chiffres 4 à 6 ne peuvent pas commencer par 0 ou 1, ni être 211, 311, 411, 511, 611, 711, 811 ou 911. » | ✅ |
| 9 | jean@yopmail.com, jean@tempmail.com, x@0-mailer.dynv6.net | BLOQUÉ (jetable) | courriel_jetable, courriel_jetable, courriel_jetable (le 3e vient de la liste complète de 10 000+ domaines) | ✅ |
| 10 | jean@gmai.com | Suggestion gmail.com | BLOQUÉ (courriel_typo) « Vouliez-vous dire jean@gmail.com ? » · suggestion jean@gmail.com | ✅ |
| 10b | jean@gmai.com renvoyé tel quel (faute assumée) | Accepté avec +30 | SUSPICIOUS 30/100, code SMS requis | ✅ |
| 11 | Numéro Google Voice (VoIP non fixe, Lookup) | +40 et refusé | BLOQUÉ (tel_voip) « Ce numéro est un numéro Internet (VoIP) qui ne reçoit pas les codes. Entrez votre numéro de cellulaire. » · tel_fin_repetee tel_voip_non_fixe | ✅ |
| 12 | Ligne inactive (Lookup) | BLOQUÉ | BLOQUÉ (tel_inactif) « Ce numéro n'est pas en service. Vérifiez-le. » | ✅ |
| 13 | Pot de miel rempli | Faux succès silencieux | SILENT (ok: true, rien n'est enregistré) | ✅ |
| 14 | Envoi 1 s après l'ouverture de la page | BLOQUÉ (< 3 s) | BLOQUÉ (envoi_moins_3s) « Un instant : relisez vos réponses, puis envoyez de nouveau. » | ✅ |
| 15 | 4 envois de la même IP en 5 min | Le 4e est BLOQUÉ | ok → ok → ok → trop_essais | ✅ |
| 16 | Nom « xkzj qwrp » | BLOQUÉ (charabia) | BLOQUÉ (nom_format) « Vérifiez votre nom. » | ✅ |
| 17 | asdf@gmail.com | BLOQUÉ (clavier) | BLOQUÉ (courriel_prefixe_test) « Entrez votre vraie adresse courriel personnelle : « asdf@gmail.com » n'est pas acceptée. » | ✅ |
| 18 | info@company.com | Signalé +20, accepté avec code SMS | CLEAN 20/100, code SMS requis · courriel_role | ✅ |
| 19 | Code SMS erroné 3 fois | Numéro verrouillé 15 min | « Code incorrect, 2 essais restants. » → « Code incorrect, 1 essai restant. » → verrouillé 900 s; bon code ensuite : 429; nouvel envoi : 429 | ✅ |
| 20 | Bon code SMS | Approuvé, preuve signée | approved: true, preuve eyJ2IjoxLCJpZCI6Im… | ✅ |
| 21 | Envoi de code sans consentement LCAP | Refusé (400) | 400 consentement | ✅ |
| 22 | Renvoi du code avant 60 s | Refusé (429), délai indiqué | 429 attendre 60 s | ✅ |
| 23 | Appel d'un autre site (Origin étranger) | Refusé (403) | 403 | ✅ |
| 24 | SMS pumping élevé (Lookup) | BLOQUÉ, aucun code envoyé | BLOQUÉ (rejete) « Ces coordonnées ne peuvent pas être acceptées. Vérifiez votre nom, votre courriel et votre numéro. » | ✅ |
| 25 | VoIP fixe (téléphone résidentiel Internet) | Accepté +15, code par appel vocal | CLEAN 15/100, code SMS requis · canal call | ✅ |
| 26 | Vrai lead : Ève Côté-Nguyen, eve.cote@hotmail.ca, 819 821-2121 | PASSE | CLEAN 0/100, code SMS requis | ✅ |
| 27 | Vrai lead : Li , li.wang@outlook.com, +1 (416) 555-2368 | PASSE | CLEAN 20/100, code SMS requis | ✅ |
| 28 | Vrai lead : Jean-François O'Brien, jf.obrien+site@gmail.com, 1-581-300-4412 | PASSE | CLEAN 0/100, code SMS requis | ✅ |
| 29 | Vrai lead : Paul Testard, paul.testard@sympatico.ca, 450 430-1212 | PASSE | CLEAN 0/100, code SMS requis | ✅ |

## Écarts volontaires par rapport au document

- **Cas 1** : le document attend que `(514) 123-4567` passe, mais le central `123` commence par 1, ce qui est impossible au NANP (le même document demande de bloquer les centraux 0XX/1XX). Le test 1 utilise donc un numéro valide.
- **« 444 n'importe où »** : seuls l'indicatif 444 (inexistant) et la suite `444444` sont bloqués. Bloquer tout numéro contenant « 444 » refuserait de vrais clients (ex. 450 444-2187).
- **VoIP fixe** (`fixedVoip`) : signalée (+15) et code envoyé par appel vocal, pas bloquée. Au Québec, beaucoup de lignes résidentielles (Vidéotron, Bell Fibe) sont de la VoIP fixe. La VoIP non fixe (Google Voice, TextNow) reste bloquée.
- **Charabia dans le courriel** (`xkzjq@`) : points de risque (+30), pas de blocage : des initiales ou des noms rares peuvent ressembler à du charabia. Le code SMS tranche.
- **Faute de domaine** : suggestion cliquable ; si la personne renvoie la même adresse, elle est acceptée avec +30 (le document : « +30 si non corrigé »).

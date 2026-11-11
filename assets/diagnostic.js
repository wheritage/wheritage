/* ==========================================================================
   W HÉRITAGE · Diagnostic (/diagnostic)
   Porte d'entrée de toutes les réservations du site. Quiz en une page :
   profil (entrepreneur ou particulier) → 10 questions → préoccupation → petit oui
   → coordonnées → résultat (3 enjeux, vidéo s'il y en a une, réservation Cal.com).
   TOUT le contenu (questions, points, textes) est dans DIAG ci-dessous : on modifie
   les mots et les points ici, sans toucher à la logique plus bas.
   Liens utiles : ?profil=entrepreneur ou ?profil=particulier saute le choix du profil ;
   ?niche=construction (etc.) mène au parcours entrepreneur avec son titre.
   ========================================================================== */
var DIAG = {
  // Réservation Cal.com (même événement que /strategie-societe tant qu'un événement « revue » n'existe pas)
  calLink: 'wheritage/rencontre-strategique-15min',

  // Clé de stockage de la progression (sessionStorage)
  storeKey: 'wh-diagnostic',

  // Écran d'accueil quand le profil n'est pas encore connu (liens « Réserver » du site)
  accueil: {
    meta: '2 minutes · 10 questions',
    titre: 'Avant de réserver, <em>parlons de votre situation.</em>',
    sousTitre: 'Quelques questions pour que notre rencontre parte de ce qui compte pour vous. À la fin, vous voyez quels enjeux semblent s\'appliquer à vous et vous choisissez votre moment.',
    question: 'Vous êtes :',
    choix: [
      ['entrepreneur', 'Propriétaire d\'entreprise', 'Votre société, ses surplus, sa relève'],
      ['particulier', 'Particulier', 'Vous, votre famille, votre épargne']
    ],
    avis: 'Outil éducatif. Aucun conseil personnalisé n\'est donné ici.'
  },

  // Seuils communs : 0–2 faible, 3–4 moyenne, 5+ élevée
  seuils: { moyenne: 3, elevee: 5 },
  niveaux: { faible: 'Faible', moyenne: 'Moyenne', elevee: 'Élevée' },

  // [DÉCISION] lien du guide L'Empire Blindé (formulaire existant de la page d'accueil)
  guide: { titre: 'L\'Empire Blindé', texte: 'Les angles morts les plus fréquents chez les entrepreneurs incorporés. Guide gratuit.', lien: '/#guide' },

  // [DÉCISION] permettre de voir le résultat sans coordonnées quand la réponse est « Pas pour l'instant » (défaut : oui)
  permettreSansCoordonnees: true,

  contact: {
    titre: 'Où vous envoyer <em>votre diagnostic ?</em>',
    texte: 'Votre résultat s\'affiche juste après.',
    bouton: 'Voir mon diagnostic',
    passer: 'Voir mon résultat sans laisser mes coordonnées',
    sousBouton: 'Vos réponses servent uniquement à préparer votre diagnostic. Elles ne sont ni vendues ni partagées.'
  },
  // [À VALIDER] Loi 25 et LCAP. Changer « version » à chaque changement de texte : elle est stockée avec le lead.
  consentements: {
    diagnostic: { version: 'diag-c1-v1', texte: 'J\'accepte que W Héritage utilise mes réponses et mes coordonnées pour m\'envoyer mon diagnostic et me contacter à ce sujet.' },
    marketing: { version: 'diag-c2-v1', texte: 'J\'accepte de recevoir d\'autres contenus éducatifs par courriel ou texto. Je peux me désabonner en tout temps.' }
  },
  politique: '/confidentialite',

  resultat: {
    titre: 'Votre diagnostic',
    ligne: 'Voici les enjeux qui semblent les plus présents selon vos réponses.',
    reserver: 'Réserver la revue de mon diagnostic · 15 min, sans frais',
    // [À VALIDER] mention exigée : nom du cabinet repris des divulgations du site (conditions#divulgations)
    divulgation: 'À titre éducatif seulement. Walid Harchaoui, conseiller en sécurité financière, rattaché au cabinet Industrielle Alliance, Assurance et services financiers inc. Rémunéré par commission.'
  },

  // Petits textes de l'interface
  ui: {
    count: function (i, n) { return 'Question ' + i + ' de ' + n; },
    countAria: function (i, n) { return 'Question ' + i + ' sur ' + n; },
    derniere: 'Une dernière précision',
    precedente: 'Question précédente',
    modifier: 'Modifier ma réponse',
    guideK: 'Guide gratuit',
    oui: 'Oui', pasMaintenant: 'Pas pour l\'instant',
    champs: { prenom: 'Prénom', nom: 'Nom', courriel: 'Courriel', telephone: 'Téléphone' },
    facultatif: '(facultatif)',
    politiqueTxt: 'Politique de confidentialité',
    err: { prenom: 'Indiquez votre prénom.', courriel: 'Vérifiez votre adresse courriel.',
           tel: 'Entrez un numéro canadien à 10 chiffres, par exemple 514 555-1234.', c1: 'Cochez la première case pour recevoir votre diagnostic.' },
    resultatK: 'Résultat',
    expo: function (niveau) { return 'Exposition ' + niveau.toLowerCase(); },
    voirVideo: 'Voir la vidéo · ', regarder: 'Regarder', bientot: 'Vidéo bientôt',
    calNote: 'Choisissez votre moment. Votre enjeu principal et vos niveaux sont déjà dans la note de réservation.',
    calFallback: 'Le calendrier ne s\'affiche pas ?', calOpen: 'Ouvrir dans un nouvel onglet',
    booked: 'C\'est réservé. <em>À bientôt.</em>', bookedP: 'La confirmation est dans votre boîte courriel.',
    comptable: ' Si vous voulez, invitez votre comptable.',
    profilNom: { entrepreneur: 'entrepreneur', particulier: 'particulier' },
    notes: function (profil, main, niveaux) { return 'Diagnostic ' + profil + ' · enjeu principal : ' + main + ' · niveaux : ' + niveaux; }
  },

  profils: {
    /* ─────────────── PROPRIÉTAIRES D'ENTREPRISE ─────────────── */
    entrepreneur: {
      intro: {
        titre: 'Votre société : <em>quels enjeux vous concernent vraiment ?</em>',
        sousTitre: '10 questions, 2 minutes. Vous voyez quels enjeux semblent s\'appliquer à vous, et une courte vidéo qui les explique.',
        bouton: 'Commencer le diagnostic'
      },
      // Liens par niche : /diagnostic?niche=construction change le titre de l'intro et présélectionne
      // Q3 (secteur), toujours modifiable. Niche inconnue : titre par défaut. [À VALIDER] les titres.
      niches: {
        construction: { titre: 'Entrepreneurs en construction : <em>ce que votre société garde peut vous coûter plus que prévu.</em>', secteur: 'construction' },
        sante_pro: { titre: 'Professionnels incorporés : <em>votre société travaille-t-elle aussi bien que vous ?</em>', secteur: 'sante_pro' },
        transport: { titre: 'Entrepreneurs en transport : <em>votre société a des surplus ? Voici les questions à vous poser.</em>', secteur: 'transport' },
        commerce: { titre: 'Restaurateurs et commerçants incorporés : <em>le diagnostic en 2 minutes.</em>', secteur: 'commerce' },
        conseil_ti: { titre: 'Consultants incorporés : <em>ce que vos surplus deviennent dans votre société.</em>', secteur: 'conseil_ti' }
      },
      // Une VSL par enjeu : lien YouTube, Vimeo ou .mp4. Vide = « Vidéo bientôt ».
      // VSL1 revenu passif (3:03) · VSL2 succession (3:22) · VSL3 liquidités (3:34) · YouTube non répertoriées
      videos: { revenu: 'https://youtu.be/2qOi19tIxYE', succession: 'https://youtu.be/LtrgQD8yYGU', liquidites: 'https://youtu.be/NNfHQBy9MDw' },

      // [À VALIDER] libellés des questions et seuil de 15 000 $ (repère d'adéquation, jamais une promesse d'admissibilité)
      questions: [
        { id: 'incorpore', q: 'Votre entreprise est-elle incorporée (société par actions) ?',
          o: [['oui', 'Oui'], ['non', 'Non'], ['en_cours', 'C\'est en cours']] },
        { id: 'province', q: 'Dans quelle province est votre société ?',
          o: [['qc', 'Québec'], ['on', 'Ontario'], ['autre', 'Ailleurs au Canada']] },
        { id: 'secteur', q: 'Votre secteur ?',
          o: [['construction', 'Construction et métiers'], ['sante_pro', 'Santé et professionnels incorporés'], ['transport', 'Transport et logistique'],
              ['commerce', 'Restauration et commerce'], ['conseil_ti', 'Services-conseils et TI'], ['autre', 'Autre']] },
        { id: 'role', q: 'Votre rôle dans la société ?',
          o: [['seul', 'Seul actionnaire'], ['associes', 'Actionnaire avec des associés'], ['autre', 'Autre']] },
        { id: 'surplus', q: 'Une fois vos besoins payés, combien votre société garde-t-elle environ par année ?',
          o: [['lt15', 'Moins de 15 000 $'], ['15_50', '15 000 $ à 50 000 $'], ['50_150', '50 000 $ à 150 000 $'], ['gt150', 'Plus de 150 000 $'], ['nsp', 'Je ne sais pas']] },
        { id: 'placements', q: 'Environ combien votre société a-t-elle déjà en placements ?',
          o: [['0', 'Rien ou presque'], ['lt250k', 'Moins de 250 000 $'], ['250k_1m', '250 000 $ à 1 M$'], ['gt1m', 'Plus de 1 M$'], ['nsp', 'Je ne sais pas']] },
        { id: 'dependants', q: 'Quelqu\'un dépend-il de vous ou de la valeur de votre entreprise (famille, associés) ?',
          o: [['oui', 'Oui'], ['non', 'Non']] },
        { id: 'projet', q: 'Avez-vous un projet à financer d\'ici 5 à 10 ans (immeuble, investissement, expansion) ?',
          o: [['oui', 'Oui'], ['peut_etre', 'Peut-être'], ['non', 'Non']] },
        { id: 'besoin_5ans', q: 'Aurez-vous besoin de presque tous les surplus de votre société d\'ici 5 ans ?',
          o: [['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] },
        { id: 'assurance_societe', q: 'Votre société détient-elle déjà une assurance vie sur votre tête ?',
          o: [['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] }
      ],
      // Écran après Q10 : sert seulement à départager les égalités
      preoccupation: { q: 'Lequel de ces sujets vous préoccupe le plus ?',
        o: [['revenu', 'Ce que mes placements coûtent en impôt'], ['succession', 'Ce qui arrivera à ma famille ou mes associés'],
            ['liquidites', 'Accéder à mon argent pour un projet'], ['nsp', 'Je ne sais pas encore']] },
      // Sorties polies : réponse qui déclenche → texte. Aucun formulaire. Le bouton propose le parcours particulier.
      exits: {
        incorpore: { si: 'non', raison: 'non_incorpore', titre: 'Merci, <em>c\'est clair.</em>',
          texte: 'Les stratégies présentées ici concernent les sociétés par actions. Si vous vous incorporez un jour, refaites le diagnostic. En attendant, ce guide peut vous être utile.' },
        besoin_5ans: { si: 'oui', raison: 'besoin_court_terme', titre: 'Merci, <em>c\'est clair.</em>',
          texte: 'Ces stratégies demandent que l\'argent puisse rester investi à long terme. Si vos surplus servent d\'ici 5 ans, elles ne sont probablement pas pour vous maintenant. Ce guide peut quand même vous être utile.' }
      },
      versParticulier: 'Faire plutôt le diagnostic pour particuliers',

      // Points par enjeu. [À VALIDER] Un moyen de classer la vidéo la plus pertinente, pas une évaluation fiscale.
      points: {
        revenu: { placements: { '0': 0, lt250k: 1, '250k_1m': 2, gt1m: 4, nsp: 1 }, surplus: { '15_50': 1, '50_150': 2, gt150: 3 } },
        succession: { dependants: { oui: 3 }, role: { associes: 2 }, assurance_societe: { non: 1, nsp: 1 }, placements: { '250k_1m': 1, gt1m: 1 } },
        liquidites: { projet: { oui: 3, peut_etre: 1 }, surplus: { '15_50': 1, '50_150': 2, gt150: 2 }, besoin_5ans: { non: 1 } }
      },
      // Égalité sans préoccupation correspondante : cet ordre
      ordre: ['succession', 'revenu', 'liquidites'],
      // Repère pour le suivi : false = moins de 15 000 $ de surplus ; a_verifier = incorporation en cours
      qualifie: function (a) { return a.surplus === 'lt15' ? false : a.incorpore === 'en_cours' ? 'a_verifier' : true; },

      petitOui: 'Si une structure prévue par la loi pouvait s\'appliquer à votre situation, voudriez-vous la regarder, avec votre comptable ?',

      noms: { revenu: 'Revenu passif', succession: 'Succession', liquidites: 'Liquidités' },
      // [À VALIDER] titres affichés dans le lecteur
      titresVideo: {
        revenu: 'Revenu passif : ce que vos placements peuvent coûter à votre entreprise',
        succession: 'Succession : ce qui pourrait arriver à votre société au décès',
        liquidites: 'Liquidités : accéder à l\'argent de votre société'
      },
      // [À VALIDER] textes du résultat. Règles : pas de « sans impôt » seul, « garanti », « rendement », « éliminer l'impôt », « retrait ».
      textes: {
        revenu: {
          elevee: 'Votre société semble avoir des placements importants. Au fédéral, au-delà d\'un certain revenu de placement, le plafond du taux réduit de votre entreprise peut baisser. Ça vaut la peine de regarder ce que vos placements vous coûtent.',
          moyenne: 'Vos placements pourraient grandir assez pour que les règles sur le revenu passif deviennent un enjeu. Mieux vaut le savoir avant.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        },
        succession: {
          elevee: 'Des personnes dépendent de vous ou de votre entreprise. Au décès, l\'impôt et le manque de liquidités peuvent compliquer les choses pour elles. Ça mérite d\'être planifié.',
          moyenne: 'Une partie de votre situation pourrait poser des enjeux de succession. Une vérification avec votre comptable serait utile.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        },
        liquidites: {
          elevee: 'Vous avez un projet en vue et des surplus qui restent dans votre société. Il existe plus d\'une façon d\'accéder à cet argent, chacune avec ses coûts et ses risques.',
          moyenne: 'Si un projet se précise, il peut être utile de connaître vos options pour accéder à l\'argent de votre société, et leurs risques.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        }
      },
      methode: 'Ce diagnostic classe les sujets selon vos réponses. Ce n\'est pas une analyse financière ni un conseil personnalisé. Seule une analyse complète, validée par votre comptable, peut confirmer si une stratégie s\'applique.',
      // Affiché si la province n'est pas le Québec
      province: { on: 'Les exemples des vidéos utilisent les taux du Québec. Les règles et les taux de votre province diffèrent.',
                  autre: 'Les exemples des vidéos utilisent les taux du Québec. Les règles et les taux de votre province diffèrent.' }
    },

    /* ─────────────── PARTICULIERS ─────────────── */
    // Validé (contenu français). Aucune vidéo pour l'instant : le lecteur est masqué.
    particulier: {
      intro: {
        titre: 'Votre protection et votre épargne : <em>par où commencer ?</em>',
        sousTitre: '10 questions, 2 minutes. Vous voyez quels enjeux semblent s\'appliquer à vous, puis vous choisissez le moment de notre rencontre.',
        bouton: 'Commencer le diagnostic'
      },
      niches: {},
      videos: { protection_revenu: '', famille: '', patrimoine: '' },

      questions: [
        { id: 'age', q: 'Quel âge avez-vous ?',
          o: [['18_29', '18 à 29 ans'], ['30_39', '30 à 39 ans'], ['40_49', '40 à 49 ans'], ['50_59', '50 à 59 ans'], ['60_plus', '60 ans et plus']] },
        { id: 'province', q: 'Dans quelle province habitez-vous ?',
          o: [['qc', 'Québec'], ['on', 'Ontario'], ['autre', 'Ailleurs au Canada']] },
        { id: 'famille', q: 'Votre situation familiale ?',
          o: [['seul', 'Seul, sans enfant'], ['couple', 'En couple, sans enfant'], ['couple_enfants', 'En couple, avec enfants'], ['parent_seul', 'Parent seul']] },
        { id: 'emploi', q: 'Votre situation de travail ?',
          o: [['salarie', 'Salarié'], ['autonome', 'Travailleur autonome'], ['retraite', 'Retraité ou sans emploi']] },
        { id: 'dettes', q: 'Avez-vous une hypothèque ou des dettes importantes ?',
          o: [['hypotheque', 'Oui, une hypothèque'], ['autres', 'Oui, d\'autres dettes'], ['non', 'Non']] },
        { id: 'invalidite', q: 'Si vous ne pouviez plus travailler pendant des mois, recevriez-vous un revenu ?',
          o: [['employeur', 'Oui, par mon employeur'], ['individuelle', 'Oui, par une assurance à mon nom'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] },
        { id: 'assurance_vie', q: 'Avez-vous une assurance vie ?',
          o: [['employeur', 'Seulement par mon employeur'], ['individuelle', 'Oui, à mon nom'], ['aucune', 'Aucune'], ['nsp', 'Je ne sais pas']] },
        { id: 'epargne', q: 'Combien arrivez-vous à mettre de côté par mois, environ ?',
          o: [['rien', 'Rien pour l\'instant'], ['lt250', 'Moins de 250 $'], ['250_1000', '250 $ à 1 000 $'], ['gt1000', 'Plus de 1 000 $']] },
        { id: 'comptes', q: 'Utilisez-vous déjà vos CELI et REER ?',
          o: [['oui', 'Oui, presque au maximum'], ['en_partie', 'En partie'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] },
        { id: 'heritage', q: 'Laisser quelque chose à vos proches est-il important pour vous ?',
          o: [['oui', 'Oui, beaucoup'], ['un_peu', 'Un peu'], ['non', 'Pas vraiment']] }
      ],
      preoccupation: { q: 'Lequel de ces sujets vous préoccupe le plus ?',
        o: [['protection_revenu', 'Mon revenu si je tombe malade ou ai un accident'], ['famille', 'Ma famille si je n\'étais plus là'],
            ['patrimoine', 'Faire fructifier mon épargne et la transmettre'], ['nsp', 'Je ne sais pas encore']] },
      exits: {},

      points: {
        protection_revenu: { emploi: { autonome: 3, salarie: 1 }, invalidite: { non: 2, nsp: 1, employeur: 1 }, dettes: { hypotheque: 1, autres: 1 } },
        famille: { famille: { couple_enfants: 3, parent_seul: 3, couple: 1 }, dettes: { hypotheque: 2, autres: 1 }, assurance_vie: { aucune: 2, employeur: 2, nsp: 1 } },
        patrimoine: { epargne: { '250_1000': 1, gt1000: 3 }, comptes: { oui: 2, en_partie: 1 }, heritage: { oui: 2, un_peu: 1 }, age: { '40_49': 1, '50_59': 1 } }
      },
      // Enjeu ramené à zéro pour certaines réponses (pas de revenu de travail à protéger)
      annule: { protection_revenu: { emploi: ['retraite'] } },
      ordre: ['famille', 'protection_revenu', 'patrimoine'],
      // Repère pour le suivi : false = hors Québec et Ontario (non autorisé) ; a_verifier = 60 ans et plus (assurabilité, coûts)
      qualifie: function (a) { return a.province === 'autre' ? false : a.age === '60_plus' ? 'a_verifier' : true; },

      petitOui: 'Si une solution adaptée à votre situation existait, voudriez-vous la regarder ensemble, sans engagement ?',

      noms: { protection_revenu: 'Protection du revenu', famille: 'Protection de la famille', patrimoine: 'Épargne et transmission' },
      titresVideo: {
        protection_revenu: 'Protection du revenu : si vous ne pouviez plus travailler',
        famille: 'Protection de la famille : ce qui resterait à vos proches',
        patrimoine: 'Épargne et transmission : organiser ce que vous bâtissez'
      },
      textes: {
        protection_revenu: {
          elevee: 'Votre revenu semble porter beaucoup de choses, et votre protection en cas d\'invalidité pourrait être mince ou incertaine. Une maladie ou un accident pourrait mettre votre budget sous pression. Ça vaut la peine de vérifier ce qui vous serait versé, et pendant combien de temps.',
          moyenne: 'Vous avez peut-être une protection en cas d\'invalidité, mais elle pourrait ne pas couvrir tout ce que votre revenu paie. Une vérification de vos couvertures actuelles serait utile.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        },
        famille: {
          elevee: 'Des personnes comptent sur vous et vous avez des engagements à long terme. Si vous n\'étiez plus là, votre couverture actuelle pourrait ne pas suffire. Ça mérite d\'être chiffré.',
          moyenne: 'Une partie de votre situation pourrait laisser vos proches avec des obligations à couvrir. Il peut être utile de comparer votre couverture à vos engagements réels.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        },
        patrimoine: {
          elevee: 'Vous épargnez déjà régulièrement et la transmission compte pour vous. Il existe plusieurs façons d\'organiser cette épargne à long terme et ce que vous laisserez, chacune avec ses coûts et ses limites.',
          moyenne: 'Votre épargne et vos projets de transmission pourraient gagner à être organisés dans un même plan. Mieux vaut y penser tôt.',
          faible: 'Selon vos réponses, cet enjeu semble moins présent pour le moment.'
        }
      },
      methode: 'Ce diagnostic classe les sujets selon vos réponses. Ce n\'est pas une analyse de besoins ni un conseil personnalisé. Seule une analyse complète de votre situation peut confirmer ce qui s\'applique. Toute assurance est soumise à l\'approbation de l\'assureur.',
      province: { on: 'Certaines règles et certains régimes publics diffèrent en Ontario. On en tient compte à la rencontre.',
                  autre: 'Je suis autorisé à exercer au Québec et en Ontario seulement. Selon votre province, je pourrai vous orienter vers la bonne ressource.' }
    }
  }
};

/* ==========================================================================
   VERSION ANGLAISE : mêmes clés que DIAG, seulement les textes.
   Fusionnée par-dessus DIAG quand la page est en anglais (bascule FR/EN, ?lang=en
   ou choix déjà fait sur le site). Les points, seuils et valeurs ne changent pas.
   ========================================================================== */
var DIAG_EN = {
  accueil: {
    titre: 'Before you book, <em>let\'s talk about your situation.</em>',
    sousTitre: 'A few questions so our meeting starts from what matters to you. At the end, you see which issues seem to apply to you and you pick your time.',
    question: 'You are:',
    choix: [['entrepreneur', 'Business owner', 'Your corporation, its surplus, its succession'],
            ['particulier', 'Individual', 'You, your family, your savings']],
    avis: 'Educational tool. No personalized advice is given here.'
  },
  niveaux: { faible: 'Low', moyenne: 'Medium', elevee: 'High' },
  guide: { titre: 'The Armored Empire', texte: 'The most common blind spots of incorporated business owners. Free guide.' },
  contact: {
    titre: 'Where should we send <em>your assessment?</em>',
    texte: 'Your result appears right after.',
    bouton: 'See my assessment',
    passer: 'See my result without leaving my details',
    sousBouton: 'Your answers are only used to prepare your assessment. They are never sold or shared.'
  },
  consentements: {
    diagnostic: { version: 'diag-c1-v1-en', texte: 'I agree that W Héritage may use my answers and contact details to send me my assessment and contact me about it.' },
    marketing: { version: 'diag-c2-v1-en', texte: 'I agree to receive other educational content by email or text. I can unsubscribe at any time.' }
  },
  resultat: {
    titre: 'Your assessment',
    ligne: 'Here are the issues that seem most present based on your answers.',
    reserver: 'Book the review of my assessment · 15 min, free',
    divulgation: 'For educational purposes only. Walid Harchaoui, financial security advisor, attached to the firm Industrielle Alliance, Assurance et services financiers inc. Paid by commission.'
  },
  ui: {
    count: function (i, n) { return 'Question ' + i + ' of ' + n; },
    countAria: function (i, n) { return 'Question ' + i + ' of ' + n; },
    derniere: 'One last detail',
    precedente: 'Previous question',
    modifier: 'Change my answer',
    guideK: 'Free guide',
    oui: 'Yes', pasMaintenant: 'Not right now',
    champs: { prenom: 'First name', nom: 'Last name', courriel: 'Email', telephone: 'Phone' },
    facultatif: '(optional)',
    politiqueTxt: 'Privacy policy',
    err: { prenom: 'Enter your first name.', courriel: 'Check your email address.',
           tel: 'Enter a 10-digit Canadian number, for example 514 555-1234.', c1: 'Check the first box to receive your assessment.' },
    resultatK: 'Result',
    expo: function (niveau) { return niveau + ' exposure'; },
    voirVideo: 'Watch the video · ', regarder: 'Watch (in French)', bientot: 'Video coming soon',
    calNote: 'Pick your time. Your main issue and levels are already in the booking note.',
    calFallback: 'Calendar not showing?', calOpen: 'Open in a new tab',
    booked: 'You\'re booked. <em>Talk soon.</em>', bookedP: 'The confirmation is in your inbox.',
    comptable: ' If you like, invite your accountant.',
    profilNom: { entrepreneur: 'business owner', particulier: 'individual' },
    notes: function (profil, main, niveaux) { return 'Assessment (' + profil + ', in English) · main issue: ' + main + ' · levels: ' + niveaux; }
  },
  profils: {
    entrepreneur: {
      intro: {
        titre: 'Your corporation: <em>which issues really concern you?</em>',
        sousTitre: '10 questions, 2 minutes. You see which issues seem to apply to you, and a short video (in French) that explains them.',
        bouton: 'Start the assessment'
      },
      niches: {
        construction: { titre: 'Construction business owners: <em>what your corporation keeps may cost you more than you think.</em>' },
        sante_pro: { titre: 'Incorporated professionals: <em>is your corporation working as hard as you are?</em>' },
        transport: { titre: 'Transport business owners: <em>your corporation has surplus? Here are the questions to ask.</em>' },
        commerce: { titre: 'Incorporated restaurant and retail owners: <em>the 2-minute assessment.</em>' },
        conseil_ti: { titre: 'Incorporated consultants: <em>what happens to your surplus inside your corporation.</em>' }
      },
      questions: [
        { q: 'Is your business incorporated (a corporation)?', o: [['oui', 'Yes'], ['non', 'No'], ['en_cours', 'In progress']] },
        { q: 'Which province is your corporation in?', o: [['qc', 'Québec'], ['on', 'Ontario'], ['autre', 'Elsewhere in Canada']] },
        { q: 'Your industry?', o: [['construction', 'Construction and trades'], ['sante_pro', 'Health and incorporated professionals'], ['transport', 'Transport and logistics'],
          ['commerce', 'Restaurants and retail'], ['conseil_ti', 'Consulting and IT'], ['autre', 'Other']] },
        { q: 'Your role in the corporation?', o: [['seul', 'Sole shareholder'], ['associes', 'Shareholder with partners'], ['autre', 'Other']] },
        { q: 'Once your needs are paid, roughly how much does your corporation keep each year?',
          o: [['lt15', 'Less than $15,000'], ['15_50', '$15,000 to $50,000'], ['50_150', '$50,000 to $150,000'], ['gt150', 'More than $150,000'], ['nsp', 'I don\'t know']] },
        { q: 'Roughly how much does your corporation already hold in investments?',
          o: [['0', 'Nothing or almost nothing'], ['lt250k', 'Less than $250,000'], ['250k_1m', '$250,000 to $1M'], ['gt1m', 'More than $1M'], ['nsp', 'I don\'t know']] },
        { q: 'Does anyone depend on you or on the value of your business (family, partners)?', o: [['oui', 'Yes'], ['non', 'No']] },
        { q: 'Do you have a project to fund in the next 5 to 10 years (building, investment, expansion)?', o: [['oui', 'Yes'], ['peut_etre', 'Maybe'], ['non', 'No']] },
        { q: 'Will you need almost all of your corporation\'s surplus within 5 years?', o: [['oui', 'Yes'], ['non', 'No'], ['nsp', 'I don\'t know']] },
        { q: 'Does your corporation already own life insurance on you?', o: [['oui', 'Yes'], ['non', 'No'], ['nsp', 'I don\'t know']] }
      ],
      preoccupation: { q: 'Which of these concerns you most?',
        o: [['revenu', 'What my investments cost in tax'], ['succession', 'What will happen to my family or partners'],
            ['liquidites', 'Accessing my money for a project'], ['nsp', 'I don\'t know yet']] },
      exits: {
        incorpore: { titre: 'Thank you, <em>that\'s clear.</em>',
          texte: 'The strategies covered here apply to corporations. If you incorporate one day, take the assessment again. In the meantime, this guide may help.' },
        besoin_5ans: { titre: 'Thank you, <em>that\'s clear.</em>',
          texte: 'These strategies require money that can stay invested for the long term. If your surplus will be used within 5 years, they are probably not for you right now. This guide may still help.' }
      },
      versParticulier: 'Take the individual assessment instead',
      petitOui: 'If a structure provided for by law could apply to your situation, would you like to look at it, with your accountant?',
      noms: { revenu: 'Passive income', succession: 'Estate', liquidites: 'Liquidity' },
      titresVideo: {
        revenu: 'Passive income: what your investments may cost your business',
        succession: 'Estate: what could happen to your corporation at death',
        liquidites: 'Liquidity: accessing your corporation\'s money'
      },
      textes: {
        revenu: {
          elevee: 'Your corporation seems to hold significant investments. Federally, above a certain level of investment income, your business\'s small business limit can go down. It\'s worth looking at what your investments cost you.',
          moyenne: 'Your investments could grow enough for the passive income rules to become an issue. Better to know ahead of time.',
          faible: 'Based on your answers, this issue seems less present for now.'
        },
        succession: {
          elevee: 'People depend on you or your business. At death, tax and a lack of liquidity can make things harder for them. It deserves planning.',
          moyenne: 'Part of your situation could raise estate issues. A check with your accountant would be useful.',
          faible: 'Based on your answers, this issue seems less present for now.'
        },
        liquidites: {
          elevee: 'You have a project in sight and surplus that stays in your corporation. There is more than one way to access that money, each with its own costs and risks.',
          moyenne: 'If a project takes shape, it can be useful to know your options for accessing your corporation\'s money, and their risks.',
          faible: 'Based on your answers, this issue seems less present for now.'
        }
      },
      methode: 'This assessment ranks issues based on your answers. It is not a financial analysis or personalized advice. Only a full analysis, validated by your accountant, can confirm whether a strategy applies.',
      province: { on: 'The video examples use Québec rates. Your province\'s rules and rates differ.',
                  autre: 'The video examples use Québec rates. Your province\'s rules and rates differ.' }
    },
    particulier: {
      intro: {
        titre: 'Your protection and your savings: <em>where to start?</em>',
        sousTitre: '10 questions, 2 minutes. You see which issues seem to apply to you, then you pick the time for our meeting.',
        bouton: 'Start the assessment'
      },
      questions: [
        { q: 'How old are you?', o: [['18_29', '18 to 29'], ['30_39', '30 to 39'], ['40_49', '40 to 49'], ['50_59', '50 to 59'], ['60_plus', '60 and over']] },
        { q: 'Which province do you live in?', o: [['qc', 'Québec'], ['on', 'Ontario'], ['autre', 'Elsewhere in Canada']] },
        { q: 'Your family situation?', o: [['seul', 'Single, no children'], ['couple', 'In a couple, no children'], ['couple_enfants', 'In a couple, with children'], ['parent_seul', 'Single parent']] },
        { q: 'Your work situation?', o: [['salarie', 'Employee'], ['autonome', 'Self-employed'], ['retraite', 'Retired or not working']] },
        { q: 'Do you have a mortgage or significant debts?', o: [['hypotheque', 'Yes, a mortgage'], ['autres', 'Yes, other debts'], ['non', 'No']] },
        { q: 'If you couldn\'t work for months, would you receive an income?',
          o: [['employeur', 'Yes, through my employer'], ['individuelle', 'Yes, through insurance in my name'], ['non', 'No'], ['nsp', 'I don\'t know']] },
        { q: 'Do you have life insurance?', o: [['employeur', 'Only through my employer'], ['individuelle', 'Yes, in my name'], ['aucune', 'None'], ['nsp', 'I don\'t know']] },
        { q: 'Roughly how much can you set aside each month?', o: [['rien', 'Nothing for now'], ['lt250', 'Less than $250'], ['250_1000', '$250 to $1,000'], ['gt1000', 'More than $1,000']] },
        { q: 'Do you already use your TFSA and RRSP?', o: [['oui', 'Yes, close to the maximum'], ['en_partie', 'Partly'], ['non', 'No'], ['nsp', 'I don\'t know']] },
        { q: 'Is leaving something to your loved ones important to you?', o: [['oui', 'Yes, very'], ['un_peu', 'Somewhat'], ['non', 'Not really']] }
      ],
      preoccupation: { q: 'Which of these concerns you most?',
        o: [['protection_revenu', 'My income if I get sick or have an accident'], ['famille', 'My family if I were no longer there'],
            ['patrimoine', 'Growing my savings and passing them on'], ['nsp', 'I don\'t know yet']] },
      petitOui: 'If a solution suited to your situation existed, would you like to look at it together, with no commitment?',
      noms: { protection_revenu: 'Income protection', famille: 'Family protection', patrimoine: 'Savings and estate' },
      titresVideo: {
        protection_revenu: 'Income protection: if you could no longer work',
        famille: 'Family protection: what would be left for your loved ones',
        patrimoine: 'Savings and estate: organizing what you build'
      },
      textes: {
        protection_revenu: {
          elevee: 'Your income seems to carry a lot, and your disability coverage could be thin or uncertain. An illness or accident could put your budget under pressure. It\'s worth checking what you would receive, and for how long.',
          moyenne: 'You may have disability coverage, but it might not cover everything your income pays for. A review of your current coverage would be useful.',
          faible: 'Based on your answers, this issue seems less present for now.'
        },
        famille: {
          elevee: 'People count on you and you have long-term commitments. If you were no longer there, your current coverage might not be enough. It deserves to be quantified.',
          moyenne: 'Part of your situation could leave your loved ones with obligations to cover. It can be useful to compare your coverage with your real commitments.',
          faible: 'Based on your answers, this issue seems less present for now.'
        },
        patrimoine: {
          elevee: 'You already save regularly and passing something on matters to you. There are several ways to organize these long-term savings and what you leave behind, each with its own costs and limits.',
          moyenne: 'Your savings and estate plans could benefit from being organized in a single plan. Better to think about it early.',
          faible: 'Based on your answers, this issue seems less present for now.'
        }
      },
      methode: 'This assessment ranks issues based on your answers. It is not a needs analysis or personalized advice. Only a full analysis of your situation can confirm what applies. All insurance is subject to the insurer\'s approval.',
      province: { on: 'Some rules and public plans differ in Ontario. We take that into account at the meeting.',
                  autre: 'I am licensed to practise in Québec and Ontario only. Depending on your province, I can point you to the right resource.' }
    }
  }
};

(function () {
  'use strict';
  var root = document.getElementById('diag');
  if (!root) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PROFILS = Object.keys(DIAG.profils);
  /* Langue : L = DIAG (français) ou DIAG fusionné avec DIAG_EN. Recalculé quand la langue change. */
  function merge(base, over) {
    if (over === undefined) return base;
    if (Array.isArray(over)) return (base || []).map(function (b, i) { return merge(b, over[i]); });
    if (over && typeof over === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
      var o = {}, k; for (k in base) o[k] = base[k]; for (k in over) o[k] = merge(base[k], over[k]); return o;
    }
    return over;
  }
  var EN_MERGED = merge(DIAG, DIAG_EN);
  function lang() { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr'; }
  var L = lang() === 'en' ? EN_MERGED : DIAG;
  function track(n, p) { if (window.WH && WH.track) WH.track(n, p); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ARROW = '<svg viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4"/></svg>';

  /* ── État, gardé dans sessionStorage pour survivre à un rafraîchissement ── */
  var st = { step: 'intro', profil: null, answers: {}, micro: null, src: {}, steps: {} };
  function save() { try { sessionStorage.setItem(L.storeKey, JSON.stringify(st)); } catch (e) {} }
  function clear() { try { sessionStorage.removeItem(L.storeKey); } catch (e) {} }
  try { var saved = JSON.parse(sessionStorage.getItem(L.storeKey) || 'null'); if (saved && saved.answers) st = saved; } catch (e) {}
  st.steps = st.steps || {}; st.src = st.src || {};
  // Provenance : profil, niche, UTM et fbclid de l'arrivée (on garde la première valeur vue)
  var urlProfil = null;
  (function () {
    var p; try { p = new URLSearchParams(location.search); } catch (e) { return; }
    ['niche', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) {
      var v = p.get(k); if (v && !st.src[k]) st.src[k] = v.slice(0, 200);
    });
    if (st.src.niche) st.src.niche = st.src.niche.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
    var pr = p.get('profil'); if (PROFILS.indexOf(pr) >= 0) urlProfil = pr;
  })();
  // Le profil vient de l'URL (?profil=), sinon d'une niche (publicités entrepreneurs), sinon du choix à l'accueil
  if (!urlProfil && L.profils.entrepreneur.niches[st.src.niche]) urlProfil = 'entrepreneur';
  if (urlProfil && st.step === 'intro') st.profil = urlProfil;
  var forced = !!urlProfil;
  // Le résultat n'est pas restauré (stockage vidé après l'envoi) ; un état « result » orphelin repart de l'intro
  if (st.step === 'result') st.step = 'intro';

  function P() { return L.profils[st.profil] || null; }
  function niche() { var p = P(); return p && p.niches[st.src.niche] || null; }
  function setProfil(pr) {
    st.profil = pr;
    var n = niche();
    if (n && n.secteur && !st.answers.secteur) st.answers.secteur = n.secteur;
  }
  if (st.profil) setProfil(st.profil);

  /* ── Calcul (pour un profil) ── */
  function scores(a, pr) {
    var cfg = L.profils[pr || st.profil], out = {};
    Object.keys(cfg.points).forEach(function (k) {
      var pts = 0, rules = cfg.points[k];
      for (var id in rules) { var v = rules[id][a[id]]; if (v) pts += v; }
      var an = cfg.annule && cfg.annule[k];
      if (an) for (var aid in an) if (an[aid].indexOf(a[aid]) >= 0) pts = 0;
      out[k] = pts;
    });
    return out;
  }
  function level(pts) { return pts >= L.seuils.elevee ? 'elevee' : pts >= L.seuils.moyenne ? 'moyenne' : 'faible'; }
  function mainProblem(sc, pre, pr) {
    var ordre = L.profils[pr || st.profil].ordre;
    var max = Math.max.apply(null, ordre.map(function (p) { return sc[p]; }));
    var tied = ordre.filter(function (p) { return sc[p] === max; });
    if (tied.length === 1) return tied[0];
    if (tied.indexOf(pre) >= 0) return pre;
    return tied[0];
  }
  function ranking(sc, main) {
    return [main].concat(P().ordre.filter(function (p) { return p !== main; }).sort(function (x, y) { return sc[y] - sc[x]; }));
  }
  function qualifie(a, pr) { return L.profils[pr || st.profil].qualifie(a); }
  function result() {
    var sc = scores(st.answers), main = mainProblem(sc, st.answers.preoccupation), niv = {};
    P().ordre.forEach(function (p) { niv[p] = level(sc[p]); });
    return { scores: sc, niveaux: niv, main: main, order: ranking(sc, main) };
  }
  // Exposé pour les tests (aucune donnée personnelle)
  window.WHDiag = { scores: scores, level: level, mainProblem: mainProblem, qualifie: qualifie };

  /* ── Rendu des écrans ── */
  var stage = document.getElementById('diag-stage');
  var bar = document.getElementById('diag-bar'), barFill = bar.querySelector('i'), live = document.getElementById('diag-live');

  function nq() { return P() ? P().questions.length : 10; }
  function progress(i) {
    if (i == null) { bar.hidden = true; return; }
    var total = nq() + 1; // questions + préoccupation
    bar.hidden = false;
    bar.setAttribute('aria-valuemax', String(total));
    barFill.style.width = ((i + 1) / total * 100) + '%';
    bar.setAttribute('aria-valuenow', String(i + 1));
    bar.setAttribute('aria-valuetext', i < nq() ? L.ui.countAria(i + 1, nq()) : L.ui.derniere);
  }

  function optsHtml(id, opts, cur) {
    return '<div class="dg-opts' + (opts.length > 4 ? ' many' : '') + '" role="group" aria-labelledby="dg-h">' + opts.map(function (o) {
      return '<button type="button" class="dg-opt" data-id="' + id + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  function screenHtml(step) {
    var p = P(), m;
    if (step === 'intro') {
      if (!forced || !p) {
        var A = L.accueil;
        return '<p class="eyebrow">' + esc(A.meta) + '</p>' +
          '<h1 id="dg-h" tabindex="-1">' + A.titre + '</h1>' +
          '<p class="dg-lead">' + esc(A.sousTitre) + '</p>' +
          '<p class="dg-count" id="dg-q">' + esc(A.question) + '</p>' +
          '<div class="dg-opts dg-profils" role="group" aria-labelledby="dg-q">' + A.choix.map(function (c) {
            return '<button type="button" class="dg-opt" data-act="profil" data-v="' + c[0] + '" aria-pressed="' + (st.profil === c[0]) + '">' +
              esc(c[1]) + '<small>' + esc(c[2]) + '</small></button>';
          }).join('') + '</div>' +
          '<p class="dg-fine">' + esc(A.avis) + '</p>';
      }
      var n = niche();
      return '<p class="eyebrow">' + esc(L.accueil.meta) + '</p>' +
        '<h1 id="dg-h" tabindex="-1">' + (n ? n.titre : p.intro.titre) + '</h1>' +
        '<p class="dg-lead">' + esc(p.intro.sousTitre) + '</p>' +
        '<button type="button" class="btn btn-gold dg-start" data-act="start">' + esc(p.intro.bouton) + ARROW + '</button>' +
        '<p class="dg-fine">' + esc(L.accueil.avis) + '</p>';
    }
    if ((m = /^q(\d+)$/.exec(step))) {
      var i = +m[1], q = p.questions[i];
      return '<p class="dg-count">' + esc(L.ui.count(i + 1, nq())) + '</p>' +
        '<h2 id="dg-h" tabindex="-1">' + esc(q.q) + '</h2>' + optsHtml(q.id, q.o, st.answers[q.id]) + backHtml();
    }
    if (step === 'pre') {
      return '<p class="dg-count">' + esc(L.ui.derniere) + '</p><h2 id="dg-h" tabindex="-1">' + esc(p.preoccupation.q) + '</h2>' +
        optsHtml('preoccupation', p.preoccupation.o, st.answers.preoccupation) + backHtml();
    }
    if (step.indexOf('exit_') === 0) {
      var ex = p.exits[step.slice(5)];
      return '<h2 id="dg-h" tabindex="-1">' + ex.titre + '</h2><p class="dg-lead">' + esc(ex.texte) + '</p>' +
        '<a class="dg-guide" href="' + esc(L.guide.lien) + '"><small>' + esc(L.ui.guideK) + '</small><strong>' + esc(L.guide.titre) + '</strong><span>' + esc(L.guide.texte) + '</span></a>' +
        (p.versParticulier ? '<button type="button" class="btn btn-line dg-switch" data-act="switch">' + esc(p.versParticulier) + ARROW + '</button>' : '') +
        '<button type="button" class="dg-back" data-act="back">' + esc(L.ui.modifier) + '</button>';
    }
    if (step === 'micro') {
      return '<h2 id="dg-h" tabindex="-1">' + esc(p.petitOui) + '</h2>' +
        '<div class="dg-opts" role="group" aria-labelledby="dg-h">' +
        '<button type="button" class="dg-opt" data-act="micro" data-v="oui" aria-pressed="' + (st.micro === true) + '">' + esc(L.ui.oui) + '</button>' +
        '<button type="button" class="dg-opt" data-act="micro" data-v="non" aria-pressed="' + (st.micro === false) + '">' + esc(L.ui.pasMaintenant) + '</button></div>' + backHtml();
    }
    if (step === 'contact') return contactHtml();
    return '';
  }
  function backHtml() { return '<button type="button" class="dg-back" data-act="back">' + esc(L.ui.precedente) + '</button>'; }

  function contactHtml() {
    var c = L.contact, k = L.consentements, v = st.contact || {};
    var skip = L.permettreSansCoordonnees && st.micro === false;
    return '<h2 id="dg-h" tabindex="-1">' + c.titre + '</h2><p class="dg-lead">' + esc(c.texte) + '</p>' +
      '<form class="dg-form" id="dg-form" novalidate>' +
        '<div class="dg-fields">' +
          field('prenom', L.ui.champs.prenom, 'text', 'given-name', true, v.prenom) +
          field('nom', L.ui.champs.nom, 'text', 'family-name', false, v.nom) +
          field('courriel', L.ui.champs.courriel, 'email', 'email', true, v.courriel) +
          field('telephone', L.ui.champs.telephone, 'tel', 'tel', true, v.telephone) +
        '</div>' +
        '<label class="dg-check"><input type="checkbox" name="c1" required><span>' + esc(k.diagnostic.texte) + ' <a href="' + esc(L.politique) + '" target="_blank" rel="noopener">' + esc(L.ui.politiqueTxt) + '</a></span></label>' +
        '<label class="dg-check"><input type="checkbox" name="c2"><span>' + esc(k.marketing.texte) + '</span></label>' +
        '<p class="dg-err" id="dg-err" role="alert"></p>' +
        '<button type="submit" class="btn btn-gold">' + esc(c.bouton) + ARROW + '</button>' +
        '<p class="dg-fine">' + esc(c.sousBouton) + '</p>' +
      '</form>' +
      (skip ? '<button type="button" class="dg-skip" data-act="skip">' + esc(c.passer) + '</button>' : '') +
      backHtml();
  }
  function field(name, label, type, ac, req, val) {
    return '<label class="dg-field"><span>' + label + (req ? '' : ' <i>' + esc(L.ui.facultatif) + '</i>') + '</span>' +
      '<input type="' + type + '" name="' + name + '" autocomplete="' + ac + '"' + (req ? ' required aria-required="true"' : '') +
      (type === 'tel' ? ' inputmode="tel" placeholder="514 555-1234"' : '') + ' value="' + esc(val || '') + '"></label>';
  }

  function stepIndex(step) {
    var m = /^q(\d+)$/.exec(step);
    if (m) return +m[1];
    if (step === 'pre') return nq();
    return null;
  }

  var animating = null;
  function go(step, opts) {
    opts = opts || {};
    st.step = step;
    if (step !== 'result') save(); // après l'envoi, plus rien n'est gardé
    var html = step === 'result' ? resultHtml() : screenHtml(step);
    root.setAttribute('data-step', step.replace(/\d+$/, ''));
    root.setAttribute('data-profil', st.profil || '');
    progress(stepIndex(step));
    var swap = function () {
      stage.innerHTML = html;
      if (step === 'result') bindResult();
      stage.classList.remove('out');
      var h = document.getElementById('dg-h');
      if (h && !opts.noFocus) h.focus({ preventScroll: true });
      var top = root.getBoundingClientRect().top;
      if (top < 0) { if (window.WH && WH.lenis) WH.lenis.scrollTo(root, { offset: -90, immediate: reduce }); else root.scrollIntoView(); }
      if (stepIndex(step) != null) live.textContent = bar.getAttribute('aria-valuetext');
    };
    clearTimeout(animating);
    if (reduce || opts.instant) swap();
    else { stage.classList.add('out'); animating = setTimeout(swap, 180); }
  }

  /* ── Navigation ── */
  function start(pr) {
    if (pr !== st.profil) { st.answers = { province: st.answers.province }; st.steps = {}; st.micro = null; }
    setProfil(pr);
    st.started = st.started || {};
    if (!st.started[pr]) { st.started[pr] = 1; track('diagnostic_start', { profil: pr }); }
    go('q0');
  }
  function next(fromStep) {
    var p = P(), i = stepIndex(fromStep);
    if (i != null && i < nq()) {
      var q = p.questions[i], ex = p.exits[q.id];
      if (ex && st.answers[q.id] === ex.si) { track('diagnostic_exit', { reason: ex.raison, profil: st.profil }); return go('exit_' + q.id); }
      return go(i + 1 < nq() ? 'q' + (i + 1) : 'pre');
    }
    if (fromStep === 'pre') return go('micro');
    if (fromStep === 'micro') return go('contact');
  }
  function prev() {
    var s = st.step, m;
    if (s.indexOf('exit_') === 0) { var id = s.slice(5); return go('q' + P().questions.map(function (q) { return q.id; }).indexOf(id)); }
    if ((m = /^q(\d+)$/.exec(s))) return go(+m[1] > 0 ? 'q' + (+m[1] - 1) : 'intro');
    if (s === 'pre') return go('q' + (nq() - 1));
    if (s === 'micro') return go('pre');
    if (s === 'contact') { keepContact(); return go('micro'); }
  }

  stage.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') return start(st.profil);
    if (act === 'profil') { markPressed(b); var pr = b.getAttribute('data-v'); return later(function () { start(pr); }); }
    if (act === 'switch') { forced = true; return start('particulier'); }
    if (act === 'back') return prev();
    if (act === 'skip') { st.contact = null; return showResult(false); }
    if (act === 'micro') {
      st.micro = b.getAttribute('data-v') === 'oui';
      markPressed(b);
      track('micro_oui', { answer: st.micro ? 'oui' : 'non', profil: st.profil });
      return later(function () { next('micro'); });
    }
    if (b.classList.contains('dg-opt')) {
      var id = b.getAttribute('data-id'), from = st.step;
      st.answers[id] = b.getAttribute('data-v');
      markPressed(b); save();
      var i = stepIndex(from);
      if (i != null && !st.steps[i]) { st.steps[i] = 1; track('diagnostic_step', { step: i + 1, profil: st.profil }); }
      later(function () { if (st.step === from) next(from); });
    }
  });
  function markPressed(b) { b.parentNode.querySelectorAll('.dg-opt').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }
  // Petit délai : on voit la sélection en or avant de passer à la suite
  function later(fn) { setTimeout(fn, reduce ? 0 : 260); }

  /* ── Coordonnées ── */
  function keepContact() {
    var f = document.getElementById('dg-form'); if (!f) return;
    st.contact = { prenom: f.prenom.value.trim(), nom: f.nom.value.trim(), courriel: f.courriel.value.trim(), telephone: f.telephone.value.trim() };
    save();
  }
  function phoneCa(v) {
    var d = v.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (d.length !== 10 || /^[01]/.test(d) || /^.{3}[01]/.test(d)) return null;
    return d.slice(0, 3) + ' ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  stage.addEventListener('submit', function (e) {
    if (e.target.id !== 'dg-form') return;
    e.preventDefault();
    var f = e.target, err = document.getElementById('dg-err'), bad = null, msg = '';
    [].forEach.call(f.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
    var tel = phoneCa(f.telephone.value);
    if (!f.prenom.value.trim()) { bad = f.prenom; msg = L.ui.err.prenom; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.courriel.value.trim())) { bad = f.courriel; msg = L.ui.err.courriel; }
    else if (!tel) { bad = f.telephone; msg = L.ui.err.tel; }
    else if (!f.c1.checked) { bad = f.c1; msg = L.ui.err.c1; }
    if (bad) { err.textContent = msg; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
    f.telephone.value = tel;
    keepContact();
    var now = new Date().toISOString(), k = L.consentements;
    st.consent = {
      diagnostic: { date: now, version: k.diagnostic.version, texte: k.diagnostic.texte },
      marketing: f.c2.checked ? { date: now, version: k.marketing.version, texte: k.marketing.texte } : null
    };
    showResult(true);
  });

  function showResult(withContact) {
    var r = result();
    st.result = r;
    if (withContact) {
      var payload = buildPayload(r);
      sendLead(payload);
      var bon = payload.qualifie === true && st.profil === 'entrepreneur';
      track(bon ? 'diagnostic_lead' : 'diagnostic_lead_autre', { enjeu_principal: r.main, qualifie: String(payload.qualifie), profil: st.profil });
    }
    var keep = { contact: withContact ? st.contact : null, prenom: withContact && st.contact ? st.contact.prenom : '' };
    clear(); // progression effacée après l'envoi ; le résultat reste à l'écran
    st = { step: 'result', started: st.started, profil: st.profil, answers: st.answers, micro: st.micro, src: st.src, steps: st.steps, contact: keep.contact, prenom: keep.prenom, result: r };
    go('result');
  }

  /* ── Envoi du lead : UNE fonction à re-pointer vers le futur CRM ──
     Apps Script (feuille « Leads W Héritage »). text/plain évite la requête préalable CORS.
     Une seule nouvelle tentative ; le résultat ne l'attend jamais.
     Les réponses envoyées sont celles du profil choisi seulement (source « diagnostic » ou « diagnostic_particulier »). */
  function buildPayload(r) {
    var a = st.answers, c = st.contact || {}, s = st.src || {}, p = P();
    var out = {
      source: st.profil === 'particulier' ? 'diagnostic_particulier' : 'diagnostic', profil: st.profil, date: new Date().toISOString(),
      prenom: c.prenom || '', nom: c.nom || '', courriel: c.courriel || '', telephone: c.telephone || '', langue: lang()
    };
    p.questions.forEach(function (q) { out[q.id] = a[q.id] || ''; });
    out.preoccupation = a.preoccupation || '';
    out.niveaux = r.niveaux; out.enjeu_principal = r.main; out.qualifie = qualifie(a); out.micro_oui = st.micro === true;
    out.consentement_diagnostic = st.consent && st.consent.diagnostic; out.consentement_marketing = st.consent ? st.consent.marketing : null;
    ['niche', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) { out[k] = s[k] || ''; });
    return out;
  }
  function sendLead(payload) {
    var cfg = (window.WH && WH.config) || {};
    // 1. Feuille Google (archive complète, une ligne par lead)
    if (cfg.leadsUrl) {
      var url = cfg.leadsUrl + (cfg.leadsToken ? '?k=' + encodeURIComponent(cfg.leadsToken) : '');
      var body = JSON.stringify(payload);
      var attempt = function () {
        return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body });
      };
      attempt().catch(function () { setTimeout(function () { attempt().catch(function () {}); }, 2000); });
    }
    // 2. Courriel d'avis immédiat (Web3Forms), toujours en français, réponses en toutes lettres
    if (window.WH && WH.emailLead) {
      var m = leadEmail(payload);
      WH.emailLead(m.subject, m.fields, { replyto: payload.courriel, fromName: 'W Héritage diagnostic' }).then(function (res) {
        emailStatus = res;
        // /diagnostic?debug : la réponse de Web3Forms s'affiche sous le résultat (pour tester l'envoi)
        var el = document.getElementById('dg-debug');
        if (el) el.textContent = 'Courriel Web3Forms : ' + (res.ok ? 'envoyé ✓' : 'refusé · ' + res.message);
      });
    }
  }

  /* Courriel d'avis : clés simples (comme le formulaire de contact), et tout le détail lisible dans « message » :
     verdict, niveaux, puis chaque question avec la réponse choisie (libellés français). */
  function leadEmail(d) {
    var F = DIAG, pf = F.profils[d.profil], QUAL = { 'true': 'Oui', 'false': 'Non', a_verifier: 'À vérifier' };
    var lab = function (o, v) { for (var i = 0; i < o.length; i++) if (o[i][0] === v) return o[i][1]; return v || ''; };
    var niv = function (k) { return F.niveaux[d.niveaux[k]] || ''; };
    var nom = (d.prenom + ' ' + (d.nom || '')).trim();
    var profil = d.profil === 'particulier' ? 'Particulier' : 'Propriétaire d\'entreprise';
    var qual = QUAL[String(d.qualifie)];
    var principal = pf.noms[d.enjeu_principal] + ' (exposition ' + niv(d.enjeu_principal).toLowerCase() + ')';
    var provenance = [d.niche && 'niche ' + d.niche, d.utm_source && 'source ' + d.utm_source, d.utm_medium && 'support ' + d.utm_medium,
      d.utm_campaign && 'campagne ' + d.utm_campaign, d.utm_content && 'contenu ' + d.utm_content, d.fbclid && 'pub Meta'].filter(Boolean).join(' · ') || 'Directe ou site';
    var L = [];
    L.push('PROFIL : ' + profil);
    L.push('QUALIFIÉ : ' + qual);
    L.push('ENJEU PRINCIPAL : ' + principal);
    L.push('Niveaux : ' + pf.ordre.map(function (k) { return pf.noms[k] + ' ' + niv(k).toLowerCase(); }).join(' · '));
    L.push('Ouvert à regarder une solution : ' + (d.micro_oui ? 'Oui' : 'Pas pour l\'instant'));
    L.push('');
    L.push('RÉPONSES');
    pf.questions.forEach(function (q, i) { L.push('Q' + (i + 1) + ' · ' + q.q); L.push('   → ' + lab(q.o, d[q.id])); });
    L.push(pf.preoccupation.q); L.push('   → ' + lab(pf.preoccupation.o, d.preoccupation));
    L.push('');
    L.push('Consentement diagnostic : ' + (d.consentement_diagnostic ? d.consentement_diagnostic.date + ' (' + d.consentement_diagnostic.version + ')' : ''));
    L.push('Consentement autres contenus : ' + (d.consentement_marketing ? d.consentement_marketing.date + ' (' + d.consentement_marketing.version + ')' : 'Non'));
    L.push('Langue du quiz : ' + (d.langue === 'en' ? 'Anglais' : 'Français'));
    L.push('Provenance : ' + provenance);
    var f = {
      nom: nom, courriel: d.courriel, telephone: d.telephone, profil: profil, qualifie: qual, enjeu_principal: principal,
      message: L.join('\n'),
      recu_le: new Date(d.date).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })
    };
    var subject = 'NOUVEAU DIAGNOSTIC · ' + profil + ' · ' + nom + ' · ' + pf.noms[d.enjeu_principal] + ' ' + niv(d.enjeu_principal).toLowerCase() +
      ' · qualifié : ' + qual.toLowerCase();
    return { subject: subject, fields: f };
  }
  var emailStatus = null, DEBUG = /[?&]debug\b/.test(location.search);
  window.WHDiag.sendLead = sendLead;
  window.WHDiag.leadEmail = leadEmail;

  /* ── Résultat ── */
  function hasVideos() { var v = P().videos; return Object.keys(v).some(function (k) { return !!v[k]; }) || st.profil === 'entrepreneur'; }
  function resultHtml() {
    var r = st.result, R = L.resultat, a = st.answers, p = P(), U = L.ui;
    var cards = r.order.map(function (k, i) {
      return '<article class="dg-card' + (i === 0 ? ' main' : '') + '">' +
        '<small><span>' + esc(p.noms[k]) + '</span><b class="lv-' + r.niveaux[k] + '">' + esc(U.expo(L.niveaux[r.niveaux[k]])) + '</b></small>' +
        '<p>' + esc(p.textes[k][r.niveaux[k]]) + '</p></article>';
    }).join('');
    // Entrepreneurs : le lecteur reste (« Vidéo bientôt » tant qu'un lien manque). Particuliers : seulement s'il y a une vidéo.
    var player = hasVideos() ? '<div class="vsl-wrap"><div class="vsl" id="vsl"><div class="vs-bg"></div><div class="vs-ui">' +
        '<div class="play"><svg viewBox="0 0 16 16"><path d="M3 1.5v13L14 8z"/></svg></div>' +
        '<div class="vs-t" id="vsl-t"></div><div class="vs-s" id="vsl-s"></div></div></div>' +
        '<div class="dg-vlinks"></div></div>' : '';
    var prov = p.province[a.province];
    // Le calendrier Cal.com s'affiche directement à la fin du résultat (plus de fenêtre surgissante)
    return '<p class="eyebrow">' + esc(U.resultatK) + '</p>' +
      '<h2 id="dg-h" tabindex="-1">' + esc(R.titre) + (st.prenom ? ', <em>' + esc(st.prenom) + '</em>' : '') + '</h2>' +
      '<p class="dg-lead">' + esc(R.ligne) + '</p>' +
      '<div class="dg-cards">' + cards + '</div>' + player +
      '<section class="dg-book" id="dg-book-sec" aria-labelledby="dg-book-h"' + (st.booked ? ' hidden' : '') + '>' +
        '<h3 id="dg-book-h">' + esc(R.reserver) + '</h3>' +
        '<p class="dg-fine">' + esc(U.calNote) + '</p>' +
        '<div class="dg-cal" id="dg-cal" data-lenis-prevent></div>' +
        '<p class="dg-fine">' + esc(U.calFallback) + ' <a href="#" id="dg-cal-link" target="_blank" rel="noopener" data-no-track>' + esc(U.calOpen) + '</a></p>' +
      '</section>' +
      '<div class="dg-booked" id="dg-booked" role="status"' + (st.booked ? '' : ' hidden') + '><h3>' + U.booked + '</h3><p>' + esc(U.bookedP) +
        (st.profil === 'entrepreneur' ? esc(U.comptable) : '') + '</p></div>' +
      (DEBUG ? '<p class="dg-fine" id="dg-debug" role="status">' + (emailStatus ? 'Courriel Web3Forms : ' + (emailStatus.ok ? 'envoyé ✓' : 'refusé · ' + emailStatus.message) : 'Courriel Web3Forms : envoi en cours…') + '</p>' : '') +
      '<div class="dg-notes">' +
        '<p>' + esc(p.methode) + '</p>' +
        (prov ? '<p>' + esc(prov) + '</p>' : '') +
        '<p>' + esc(R.divulgation) + '</p></div>';
  }

  function bindResult() {
    var r = st.result, p = P(), U = L.ui, vsl = document.getElementById('vsl');
    var dbg = document.getElementById('dg-debug');
    if (dbg && emailStatus) dbg.textContent = 'Courriel Web3Forms : ' + (emailStatus.ok ? 'envoyé ✓' : 'refusé · ' + emailStatus.message);
    if (vsl) {
      // La vidéo s'affiche directement (balayage) ; elle démarre seule seulement après un clic sur un lien « Voir la vidéo »
      var load = function (k, autoplay) {
        vsl.setAttribute('data-enjeu', k);
        var url = p.videos[k] || '';
        vsl.setAttribute('data-video', url);
        vsl.classList.toggle('empty', !url);
        document.getElementById('vsl-t').textContent = p.titresVideo[k];
        document.getElementById('vsl-s').textContent = url ? U.regarder : U.bientot;
        if (url && WH.mountVideo) WH.mountVideo(vsl, url, { autoplay: !!autoplay, enjeu: k, title: p.titresVideo[k] });
        else { var old = vsl.querySelector('.vsl-media'); if (old) old.remove(); vsl.classList.remove('has-video'); }
        document.querySelectorAll('.dg-vlink').forEach(function (b) { b.hidden = b.getAttribute('data-vsl') === k; });
      };
      // Liens vers les autres vidéos : on montre toujours les deux qui ne jouent pas
      var links = document.querySelector('.dg-vlinks');
      links.innerHTML = r.order.map(function (k) { return '<button type="button" class="dg-vlink" data-vsl="' + k + '">' + esc(U.voirVideo + p.noms[k]) + '</button>'; }).join('');
      load(r.main);
      links.addEventListener('click', function (e) {
        var b = e.target.closest('[data-vsl]'); if (!b) return;
        load(b.getAttribute('data-vsl'), true);
        if (window.WH && WH.lenis) WH.lenis.scrollTo(vsl, { offset: -120, duration: reduce ? 0 : 1 });
        else vsl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      });
    }
    if (st.booked) return;

    // Réservation : nom, courriel et une note (profil, enjeu principal, niveaux) préremplis si on les a
    var c = st.contact || {};
    var notes = U.notes(U.profilNom[st.profil], p.noms[r.main],
      p.ordre.map(function (k) { return p.noms[k] + ' ' + L.niveaux[r.niveaux[k]].toLowerCase(); }).join(', '));
    var prefill = { notes: notes };
    if (c.prenom) prefill.name = (c.prenom + ' ' + (c.nom || '')).trim();
    if (c.courriel) prefill.email = c.courriel;
    var q = Object.keys(prefill).map(function (k) { return k + '=' + encodeURIComponent(prefill[k]); }).join('&');
    var link = document.getElementById('dg-cal-link');
    link.href = 'https://cal.com/' + L.calLink + '?' + q;
    link.addEventListener('click', function () { bookingSeen(r); });

    onBookedNow = function () {
      if (st.booked) return; st.booked = true;
      track('diagnostic_booked', { enjeu_principal: r.main, profil: st.profil });
      document.getElementById('dg-booked').hidden = false;
      document.getElementById('dg-book-sec').hidden = true;
    };
    // « Clic réservation » : le calendrier apparaît à l'écran (ou le lien de secours est cliqué), une fois
    var box = document.getElementById('dg-cal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { bookingSeen(r); io.disconnect(); } }); }, { threshold: 0.35 });
      io.observe(box);
    }
    if (!initCal()) return;
    Cal.ns.diag('inline', { elementOrSelector: '#dg-cal', calLink: L.calLink, layout: 'month_view',
      config: Object.assign({ theme: 'dark', layout: 'month_view' }, prefill) });
  }
  var bookingSent = false;
  function bookingSeen(r) { if (bookingSent) return; bookingSent = true; track('diagnostic_booking', { enjeu_principal: r.main, profil: st.profil }); }

  var calReady = false, onBookedNow = null;
  function initCal() {
    if (calReady) return true;
    try {
      (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      Cal('init', 'diag', { origin: 'https://app.cal.com' });
      Cal.ns.diag('ui', { theme: 'dark', cssVarsPerTheme: { dark: { 'cal-brand': '#C9A84C' } }, layout: 'month_view' });
      var done = function () { if (onBookedNow) onBookedNow(); };
      Cal.ns.diag('on', { action: 'bookingSuccessful', callback: done });
      Cal.ns.diag('on', { action: 'bookingSuccessfulV2', callback: done });
      calReady = true;
    } catch (e) { return false; }
    return true;
  }

  /* ── Langue : la bascule FR/EN de l'en-tête réaffiche l'écran courant, réponses gardées ── */
  document.addEventListener('wh:lang', function () {
    var next = lang() === 'en' ? EN_MERGED : DIAG;
    if (next === L) return;
    if (st.step === 'contact') keepContact();
    L = next;
    go(st.step, { instant: true, noFocus: true });
  });

  /* ── Démarrage ── */
  track('diagnostic_view', forced ? { profil: st.profil } : {});
  go(st.step || 'intro', { instant: true, noFocus: true });
})();

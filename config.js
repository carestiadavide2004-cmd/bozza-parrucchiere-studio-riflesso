/* =====================================================================
   STUDIO RIFLESSO — CONFIGURAZIONE DEL SITO
   ---------------------------------------------------------------------
   Per adattare il sito a un nuovo salone si cambia SOLO questo file.
   I valori segnati con  // SEGNAPOSTO  vanno sostituiti con i dati veri.
   Istruzioni per la modalità Donna / Uomo / Misto: in fondo al file.
   ===================================================================== */

window.SITE = {

  /* ---------- MODALITÀ DEL SALONE ---------- */
  genere: "misto",            // "misto" | "donna" | "uomo"
  genereIniziale: "donna",    // solo per "misto": cosa vede chi arriva la prima volta

  /* ---------- DATI DEL SALONE ---------- */
  salone: {
    nome: "Studio Riflesso",
    slogan: "Il tuo stile, nella luce giusta.",
    indirizzo: {
      via: "Via Esempio 1",                       // SEGNAPOSTO
      cap: "65121",
      citta: "Pescara",
      provincia: "PE"
    },
    telefono: "+39 000 000 0000",                 // SEGNAPOSTO: numero da chiamare
    whatsapp: "390000000000",                     // SEGNAPOSTO: solo cifre, con 39 davanti
    email: "info@studioriflesso.example",         // SEGNAPOSTO
    social: {
      instagram: "https://www.instagram.com/",    // SEGNAPOSTO: link al profilo
      facebook: "https://www.facebook.com/",      // SEGNAPOSTO
      tiktok: "https://www.tiktok.com/"           // SEGNAPOSTO
    },
    partitaIva: "00000000000",                    // SEGNAPOSTO
    fasciaPrezzo: "€€",
    url: "https://carestiadavide2004-cmd.github.io/bozza-parrucchiere-studio-riflesso/"
  },

  /* ---------- SEO (titolo e descrizione per Google) ---------- */
  seo: {
    titolo: {
      misto: "Parrucchiere Pescara | Studio Riflesso, donna e uomo",
      donna: "Parrucchiere donna a Pescara | Studio Riflesso",
      uomo: "Barbiere e parrucchiere uomo a Pescara | Studio Riflesso"
    },
    descrizione: {
      misto: "Studio Riflesso, parrucchiere a Pescara: taglio, colore, balayage, acconciature sposa e barberia uomo con panno caldo. Prenota online o su WhatsApp.",
      donna: "Studio Riflesso, parrucchiere donna a Pescara: taglio, colore, balayage, extension e acconciature sposa. Prenota online o su WhatsApp.",
      uomo: "Studio Riflesso, barbiere a Pescara: taglio uomo, sfumature, barba e rasatura con panno caldo. Prenota online o su WhatsApp."
    }
  },

  /* ---------- ORARI ----------
     0 = domenica, 1 = lunedì ... 6 = sabato.
     []  = chiuso.   Con pausa pranzo: [["09:00","13:00"], ["15:00","19:00"]]  */
  orari: {
    1: [],
    2: [["09:00", "19:00"]],
    3: [["09:00", "19:00"]],
    4: [["09:00", "19:00"]],
    5: [["09:00", "19:00"]],
    6: [["09:00", "19:00"]],
    0: []
  },

  /* ---------- PRENOTAZIONE ----------
     web3formsKey: chiave gratuita da https://web3forms.com (collegata all'email del salone).
     Non è una password: è fatta per stare nel sito. Se resta vuota il modulo funziona
     in "modalità demo" (non invia nulla e lo dice chiaramente).  */
  prenotazione: {
    web3formsKey: "",            // SEGNAPOSTO: incolla qui la chiave Web3Forms del salone
    intervalloMinuti: 30,        // fasce orarie ogni 30 minuti
    giorniPrenotabili: 60,       // fino a quanti giorni in avanti si può prenotare
    anticipoMinimoMinuti: 60     // per oggi: non prima di un'ora da adesso
  },

  /* ---------- AGENDO (prenotazioni online) ----------
     Con attivo: true il modulo di prenotazione legge servizi, operatori e
     orari liberi da Agendo e ci salva le prenotazioni. Se in Agendo è accesa
     la conferma automatica (Impostazioni → Sito web) sono confermate subito,
     altrimenti arrivano "in attesa" e il salone le conferma dal suo pannello.
     Il sito legge da solo l'impostazione e cambia i testi. Il listino e le descrizioni del sito restano quelli
     scritti qui in config.js.
     Con attivo: false il modulo torna come prima: richiesta via Web3Forms
     (se c'è la chiave) e pulsante WhatsApp.
     Se Agendo non risponde, il modulo passa da solo a WhatsApp.
     Qui sotto c'è la configurazione web pubblica di Firebase: non è segreta
     e non contiene password.  */
  agendo: {
    attivo: true,
    idSalone: "studio-riflesso",
    firebase: {
      apiKey: "AIzaSyCby7n0tVroB-t5s4NDCI-EyORJXj6LaxU",
      authDomain: "app-prenotazioni-dbe8b.firebaseapp.com",
      projectId: "app-prenotazioni-dbe8b",
      storageBucket: "app-prenotazioni-dbe8b.firebasestorage.app",
      messagingSenderId: "545925371307",
      appId: "1:545925371307:web:8dd60ff727b644ba4c2eee"
    }
  },

  /* ---------- NUMERI (contatori in "Chi siamo") ----------
     valore "operatori" = conta da solo gli operatori qui sotto.  */
  numeri: [
    { valore: 14, testo: "anni di esperienza" },              // SEGNAPOSTO
    { valore: 6800, suffisso: "+", testo: "clienti dal 2012" }, // SEGNAPOSTO
    { valore: "operatori", testo: "operatori in salone" }
  ],

  /* ---------- FOTO E VIDEO ----------
     Le foto hanno due misure: nome-sm.webp (telefono) e nome.webp (computer).
     Qui si scrive il nome SENZA "-sm" e senza ".webp".  */
  media: {
    donna: {
      heroVideo: "assets/video/hero-donna.mp4",
      heroVideoMobile: "assets/video/hero-donna-mobile.mp4",
      heroFoto: "assets/img/hero-donna.webp",
      heroFotoMobile: "assets/img/hero-donna-mobile.webp",
      chiSiamo: "assets/img/chisiamo-donna",           // + -mobile.webp per il telefono
      chiSiamoAlt: "Una parrucchiera al lavoro con una cliente nel salone",
      servizi: "assets/img/servizi-donna",
      serviziAlt: "Applicazione del colore con il pennello"
    },
    uomo: {
      heroVideo: "assets/video/hero-uomo.mp4",
      heroVideoMobile: "assets/video/hero-uomo-mobile.mp4",
      heroFoto: "assets/img/hero-uomo.webp",
      heroFotoMobile: "assets/img/hero-uomo-mobile.webp",
      chiSiamo: "assets/img/chisiamo-uomo",
      chiSiamoAlt: "Le poltrone della barberia illuminate da luci calde",
      servizi: "assets/img/servizi-uomo",
      serviziAlt: "Rifinitura della barba con forbici e pettine"
    },
    prenota: "assets/img/dettaglio-forbici",
    prenotaAlt: "Forbici da parrucchiere appoggiate su un piano di legno"
  },

  /* ---------- TESTI ----------
     "comune" vale per tutti; "donna" e "uomo" sostituiscono i testi comuni.  */
  testi: {
    comune: {
      teamTitolo: "Le mani dietro ogni riflesso.",
      teamTesto: "Un piccolo team, ognuno con la sua specialità. Puoi scegliere con chi prenotare oppure lasciare a noi la scelta.",
      prenotaTitolo: "Prenota in un minuto.",
      prenotaTesto: "Scegli servizio, operatore e orario. Ti richiamiamo noi per confermare l'appuntamento.",
      prenotaTestoConfermata: "Scegli servizio, operatore e orario: l'appuntamento è confermato subito, senza attese.",   // con la conferma automatica di Agendo
      faqTitolo: "Domande frequenti.",
      faqTesto: "Non trovi la risposta? Scrivici su WhatsApp: rispondiamo in giornata.",
      contattiTitolo: "Vieni a trovarci."
    },
    donna: {
      heroTitolo: "Capelli che catturano la luce.",
      heroTesto: "Colore, tagli e acconciature da sposa nel centro di Pescara. Prima ti ascoltiamo, poi ti mostriamo il risultato allo specchio.",
      chiSiamoTitolo: "Un salone nato per guardarti davvero.",
      chiSiamoTesto: [
        "Studio Riflesso apre nel 2012 a pochi passi dal centro di Pescara con un'idea semplice: prima di prendere in mano le forbici, capire chi abbiamo davanti.",
        "Lavoriamo solo su appuntamento, senza fretta e senza clienti sovrapposte. Ogni colore parte da una prova, ogni taglio da una conversazione."
      ],
      citazione: "Prima delle forbici, ascoltiamo.",
      citazioneFirma: "Giulia Marinelli, fondatrice",
      punti: [
        { titolo: "Prodotti professionali", testo: "Colori anche senza ammoniaca e trattamenti di linee professionali: gli stessi che ti consigliamo per casa." },
        { titolo: "Consulenza su misura", testo: "Prima di ogni servizio guardiamo insieme viso, colore e abitudini. Conosci il prezzo prima di iniziare." },
        { titolo: "Igiene scrupolosa", testo: "Forbici e spazzole sterilizzate dopo ogni cliente, mantelline pulite e asciugamani lavati ad alta temperatura." }
      ],
      serviziTitolo: "Dal primo taglio al giorno del sì.",
      serviziTesto: "Prezzi di partenza: il totale dipende da lunghezza e quantità dei capelli. Te lo diciamo sempre prima di iniziare.",
      galleriaTitolo: "Lavori recenti, nella loro luce migliore.",
      recensioniTitolo: "Lo specchio non mente. Le nostre clienti nemmeno."
    },
    uomo: {
      heroTitolo: "Linee nette, carattere deciso.",
      heroTesto: "Tagli, sfumature e barba con panno caldo nel centro di Pescara. Prenoti in un minuto ed entri all'orario giusto.",
      chiSiamoTitolo: "Una poltrona, il tempo giusto, nessuna fretta.",
      chiSiamoTesto: [
        "Studio Riflesso apre nel 2012 a pochi passi dal centro di Pescara. Qui il taglio si decide parlando: come porti i capelli ogni giorno, quanto tempo hai la mattina, che stile vuoi tenere.",
        "Lavoriamo solo su appuntamento: entri all'orario fissato ed esci con un taglio facile da gestire fino alla volta dopo."
      ],
      citazione: "Prima il taglio si pensa. Poi si fa.",
      citazioneFirma: "Marco Di Pietro, barber",
      punti: [
        { titolo: "Prodotti professionali", testo: "Cere, oli e balsami da barba di linee professionali: ti spieghiamo quali usare a casa e come." },
        { titolo: "Consulenza su misura", testo: "Guardiamo forma del viso, attaccatura e crescita della barba. Il taglio deve funzionare anche senza di noi." },
        { titolo: "Igiene scrupolosa", testo: "Lame monouso per ogni rasatura, strumenti sterilizzati e panni caldi lavati ad alta temperatura." }
      ],
      serviziTitolo: "Taglio, barba e il rito del panno caldo.",
      serviziTesto: "Prezzi di partenza per ogni servizio. Per richieste particolari ti diciamo il prezzo prima di iniziare.",
      galleriaTitolo: "Linee nette, dettagli che si vedono.",
      recensioniTitolo: "Chi si siede da noi, torna."
    }
  },

  /* ---------- SERVIZI E PREZZI ----------
     prezzo = "da €" (numero).  durata = minuti.
     inEvidenza: true = mostrato subito; gli altri sono in "Vedi tutto il listino".  */
  servizi: {
    donna: [
      { categoria: "Piega", inEvidenza: true, descrizione: "Liscia, mossa o voluminosa, sempre con protezione dal calore.", voci: [
        { nome: "Piega capelli corti", prezzo: 18, durata: 30 },
        { nome: "Piega capelli lunghi", prezzo: 22, durata: 45 },
        { nome: "Onde con ferro", prezzo: 28, durata: 60 }
      ] },
      { categoria: "Taglio e piega", inEvidenza: true, descrizione: "Un taglio pensato su viso e abitudini, poi la piega.", voci: [
        { nome: "Taglio e piega", prezzo: 38, durata: 60 },
        { nome: "Ritocco frangia", prezzo: 10, durata: 15 }
      ] },
      { categoria: "Colore", inEvidenza: true, descrizione: "Colori professionali, anche senza ammoniaca, con prova di tonalità.", voci: [
        { nome: "Colore radici", prezzo: 35, durata: 90 },
        { nome: "Colore completo", prezzo: 45, durata: 90 },
        { nome: "Gloss tonalizzante", prezzo: 25, durata: 30 }
      ] },
      { categoria: "Schiariture e balayage", inEvidenza: true, descrizione: "Luce disegnata a mano libera, con sfumature naturali.", voci: [
        { nome: "Balayage", prezzo: 90, durata: 180 },
        { nome: "Colpi di sole", prezzo: 70, durata: 150 },
        { nome: "Airtouch", prezzo: 130, durata: 210 }
      ] },
      { categoria: "Trattamenti ristrutturanti", inEvidenza: false, descrizione: "Per capelli stressati da decolorazioni, piastra e sole.", voci: [
        { nome: "Trattamento ristrutturante", prezzo: 20, durata: 30 },
        { nome: "Ricostruzione alla cheratina", prezzo: 80, durata: 120 }
      ] },
      { categoria: "Cerimonie e spose", inEvidenza: false, descrizione: "Raccolti e acconciature per il tuo giorno. Per la sposa la prova è inclusa.", voci: [
        { nome: "Acconciatura cerimonia", prezzo: 45, durata: 60 },
        { nome: "Raccolto", prezzo: 40, durata: 60 },
        { nome: "Sposa: prova e giorno del sì", prezzo: 180, durata: 120 }
      ] },
      { categoria: "Extension", inEvidenza: false, descrizione: "Ciocche in capello vero, applicate a cheratina o a nastro.", voci: [
        { nome: "Applicazione extension", prezzo: 250, durata: 180 },
        { nome: "Manutenzione extension", prezzo: 60, durata: 90 }
      ] }
    ],
    uomo: [
      { categoria: "Taglio", inEvidenza: true, descrizione: "Forbice o macchinetta, con rifinitura a rasoio sul collo.", voci: [
        { nome: "Taglio uomo", prezzo: 18, durata: 30 },
        { nome: "Taglio bambino (fino a 12 anni)", prezzo: 13, durata: 30 }
      ] },
      { categoria: "Taglio e barba", inEvidenza: true, descrizione: "Il servizio completo, chiuso con il panno caldo.", voci: [
        { nome: "Taglio e barba", prezzo: 28, durata: 60 }
      ] },
      { categoria: "Sfumatura", inEvidenza: true, descrizione: "Dalla sfumatura classica alla skin fade, sfumata a mano.", voci: [
        { nome: "Sfumatura classica", prezzo: 20, durata: 30 },
        { nome: "Skin fade", prezzo: 22, durata: 45 }
      ] },
      { categoria: "Rasatura con panno caldo", inEvidenza: true, descrizione: "Il rito tradizionale: panni caldi, rasoio a mano libera, balsamo.", voci: [
        { nome: "Rasatura tradizionale", prezzo: 22, durata: 30 },
        { nome: "Rituale panno caldo completo", prezzo: 30, durata: 45 }
      ] },
      { categoria: "Regolazione barba", inEvidenza: false, descrizione: "Forma, contorni netti e olio da barba.", voci: [
        { nome: "Regolazione barba", prezzo: 12, durata: 30 },
        { nome: "Barba con contorni a rasoio", prezzo: 15, durata: 30 }
      ] },
      { categoria: "Trattamenti cute", inEvidenza: false, descrizione: "Per cute grassa, forfora o diradamento, con controllo iniziale.", voci: [
        { nome: "Trattamento anticaduta", prezzo: 20, durata: 30 },
        { nome: "Scrub e detox cute", prezzo: 18, durata: 30 }
      ] }
    ]
  },

  /* ---------- OPERATORI ----------
     genere: "donna" | "uomo" | "entrambi"  (decide in quale modalità compaiono)  */
  operatori: [
    { nome: "Giulia Marinelli", ruolo: "Direttrice artistica e colorist", specialita: "Balayage, schiariture e colore", genere: "donna",
      foto: "assets/img/team-giulia", alt: "Giulia, parrucchiera, con le forbici in mano" },                 // SEGNAPOSTO
    { nome: "Sara D'Angelo", ruolo: "Hair stylist", specialita: "Tagli corti, pieghe e raccolti", genere: "entrambi",
      foto: "assets/img/team-sara", alt: "Sara, hair stylist, seduta in salone" },                           // SEGNAPOSTO
    { nome: "Marco Di Pietro", ruolo: "Master barber", specialita: "Sfumature, barba e rasatura con panno caldo", genere: "uomo",
      foto: "assets/img/team-marco", alt: "Marco, barbiere, a braccia conserte davanti allo specchio" },     // SEGNAPOSTO
    { nome: "Andrea Ciccone", ruolo: "Stylist", specialita: "Tagli sartoriali e trattamenti cute", genere: "entrambi",
      foto: "assets/img/team-andrea", alt: "Andrea, stylist, con un paio di forbici" }                       // SEGNAPOSTO
  ],

  /* ---------- GALLERIA LAVORI ---------- */
  galleria: {
    donna: [
      { foto: "assets/img/gal-donna-balayage", titolo: "Balayage caramello", servizio: "Schiariture e balayage", alt: "Capelli lunghi con balayage caramello, visti di spalle" },
      { foto: "assets/img/gal-donna-colore", titolo: "Biondo luminoso", servizio: "Colore e gloss", alt: "Donna con capelli biondi illuminati da luce calda" },
      { foto: "assets/img/gal-donna-bob", titolo: "Bob morbido", servizio: "Taglio e piega", alt: "Taglio bob biondo all'altezza del mento" },
      { foto: "assets/img/gal-donna-sposa", titolo: "Raccolto sposa", servizio: "Cerimonie e spose", alt: "Raccolto di ricci con velo da sposa" },
      { foto: "assets/img/gal-donna-movimento", titolo: "Piega in movimento", servizio: "Piega", alt: "Capelli castani mossi dal vento in controluce" },
      { foto: "assets/img/gal-donna-onde", titolo: "Onde rétro", servizio: "Onde con ferro", alt: "Donna con onde ramate e rossetto rosso" }
    ],
    uomo: [
      { foto: "assets/img/gal-uomo-sfumatura", titolo: "Sfumatura alta", servizio: "Sfumatura", alt: "Profilo di uomo con sfumatura alta" },
      { foto: "assets/img/gal-uomo-classico", titolo: "Pompadour classico", servizio: "Taglio", alt: "Uomo di spalle con pompadour pettinato all'indietro" },
      { foto: "assets/img/gal-uomo-barba", titolo: "Barba scolpita", servizio: "Regolazione barba", alt: "Barbiere che rifinisce una barba folta con le forbici" },
      { foto: "assets/img/gal-uomo-rifinitura", titolo: "Skin fade", servizio: "Sfumatura", alt: "Rifinitura della sfumatura con macchinetta dorata" },
      { foto: "assets/img/gal-uomo-pannocaldo", titolo: "Rituale panno caldo", servizio: "Rasatura", alt: "Cliente sdraiato con il panno caldo sul viso" },
      { foto: "assets/img/gal-uomo-macchinetta", titolo: "Nuca pulita", servizio: "Taglio e barba", alt: "Rifinitura della nuca con la macchinetta" }
    ]
  },

  /* ---------- RECENSIONI (di esempio: sostituire con recensioni vere) ---------- */
  recensioni: {
    donna: [
      { testo: "Ho portato una foto e tanti dubbi. Giulia mi ha spiegato cosa sarebbe successo al mio colore, e il balayage è venuto esattamente come lo immaginavo.", autore: "Francesca", servizio: "Balayage" },
      { testo: "Prova e acconciatura per il matrimonio: puntuali, calme, e il raccolto ha retto fino alle due di notte.", autore: "Martina", servizio: "Sposa" },
      { testo: "Finalmente un salone dove, se chiedi di spuntare, spuntano davvero.", autore: "Chiara", servizio: "Taglio e piega" },
      { testo: "Dopo anni di decolorazioni i capelli sono tornati morbidi già dalla prima seduta.", autore: "Elena", servizio: "Ricostruzione" }
    ],
    uomo: [
      { testo: "Sfumatura precisa e zero attesa: prenoto su WhatsApp ed entro all'orario giusto.", autore: "Luca", servizio: "Sfumatura" },
      { testo: "La rasatura con il panno caldo è il piccolo lusso che mi concedo una volta al mese.", autore: "Paolo", servizio: "Rasatura" },
      { testo: "Marco ha dato una forma alla barba che lasciavo crescere da un anno. Adesso la porto con piacere.", autore: "Stefano", servizio: "Barba" },
      { testo: "Un taglio pensato per come porto i capelli davvero, senza gel. Sta bene per tre settimane.", autore: "Matteo", servizio: "Taglio" }
    ]
  },

  /* ---------- DOMANDE FREQUENTI ----------
     genere: "tutti" | "donna" | "uomo".  La risposta può essere diversa per donna e uomo.  */
  faq: [
    { genere: "tutti", domanda: "Con quanto anticipo conviene prenotare?",
      risposta: {
        donna: "Per piega e taglio di solito bastano due o tre giorni. Per colore, balayage ed extension meglio una settimana: il sabato si riempie per primo.",
        uomo: "Per taglio e barba di solito bastano uno o due giorni. Il sabato mattina si riempie prima: prenota con qualche giorno in più."
      } },
    { genere: "tutti", domanda: "Cosa succede se arrivo in ritardo o devo disdire?",
      risposta: "Avvisaci appena puoi, anche su WhatsApp. Oltre i 15 minuti di ritardo potremmo dover accorciare o spostare il servizio. Se disdici almeno 24 ore prima, liberiamo il posto per un'altra persona." },
    { genere: "donna", domanda: "Fate la prova acconciatura per la sposa?",
      risposta: "Sì. La prova si fa tre o quattro settimane prima del matrimonio: porta le foto dell'abito e degli accessori. Il giorno del sì possiamo venire anche a domicilio, su richiesta." },
    { genere: "uomo", domanda: "Preparate lo sposo per il matrimonio?",
      risposta: "Sì. Taglio qualche giorno prima e, la mattina del matrimonio, barba e rifinitura. Su appuntamento anche per testimoni e invitati." },
    { genere: "tutti", domanda: "Come posso pagare?",
      risposta: "Contanti, bancomat, carte di credito e pagamenti contactless da smartphone. Su richiesta prepariamo buoni regalo." },
    { genere: "tutti", domanda: "C'è parcheggio vicino al salone?",
      risposta: "Nelle vie intorno trovi parcheggi a strisce blu e, a pochi minuti a piedi, un parcheggio pubblico. Se vieni in centro in bici, puoi lasciarla davanti all'ingresso." },   // SEGNAPOSTO: verificare
    { genere: "tutti", domanda: "Posso venire senza appuntamento?",
      risposta: "Lavoriamo su appuntamento per non farti aspettare. Se hai fretta scrivici su WhatsApp: se in giornata si libera un posto, ti avvisiamo." }
  ]
};

/* =====================================================================
   COME CAMBIARE MODALITÀ (spiegato semplice)
   ---------------------------------------------------------------------
   In alto, alla riga  genere: "misto",  scrivi una di queste tre parole:

   • "misto"  → salone per donna e uomo. In alto compare il selettore
                Donna | Uomo e il visitatore sceglie cosa vedere.
                Con  genereIniziale  decidi cosa vede la prima volta
                ("donna" oppure "uomo"). Il sito ricorda poi la sua scelta.

   • "donna"  → salone solo donna. Il selettore sparisce e si vedono
                solo servizi, foto, video, operatori e testi da donna.

   • "uomo"   → barberia / salone solo uomo. Il selettore sparisce e si
                vedono solo servizi, foto, video, operatori e testi da uomo.

   Esempio per un salone solo uomo:   genere: "uomo",
   Salva il file e ricarica la pagina. Nient'altro da toccare.
   (Gli operatori con  genere: "entrambi"  compaiono in tutte le modalità.)
   ===================================================================== */

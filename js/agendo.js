/* Studio Riflesso — collegamento ad Agendo (prenotazioni online).
   Si carica solo quando il visitatore arriva alla prenotazione: Firebase
   arriva dal CDN ufficiale gstatic, con la stessa versione usata da Agendo.
   Calcoli di orari e disponibilità copiati da Agendo (src/lib/time.js,
   hours.js, availability.js, booking.js): se cambiano lì, vanno aggiornati qui. */

const FIREBASE_VERSION = '13.0.0';
const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;

/* ---------- Da Agendo: src/lib/time.js ---------- */

const TIME_ZONE = 'Europe/Rome';
const BLOCK_MINUTES = 5;
export const FASCIA_MINUTES = 30;

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

export function romeParts(instant = new Date()) {
  const p = {};
  for (const { type, value } of partsFormatter.formatToParts(instant)) p[type] = value;
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

export function addDays(dateStr, days) {
  const { y, m, d } = parseDate(dateStr);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

const DAY_KEYS_BY_INDEX = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
export function weekdayKey(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  return DAY_KEYS_BY_INDEX[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function romeOffsetMinutes(utcMs) {
  const flooredMs = Math.floor(utcMs / 60000) * 60000;
  const { date, minutes } = romeParts(new Date(flooredMs));
  const { y, m, d } = parseDate(date);
  return (Date.UTC(y, m - 1, d) + minutes * 60000 - flooredMs) / 60000;
}

export function romeToDate(dateStr, minutes) {
  const { y, m, d } = parseDate(dateStr);
  const wallAsUtc = Date.UTC(y, m - 1, d) + minutes * 60000;
  const firstOffset = romeOffsetMinutes(wallAsUtc);
  let ts = wallAsUtc - firstOffset * 60000;
  const secondOffset = romeOffsetMinutes(ts);
  if (secondOffset !== firstOffset) ts = wallAsUtc - secondOffset * 60000;
  return new Date(ts);
}

function blocksForRange(startMinutes, durationMinutes) {
  const first = Math.floor(startMinutes / BLOCK_MINUTES);
  const count = Math.ceil(durationMinutes / BLOCK_MINUTES);
  return Array.from({ length: count }, (_, i) => first + i);
}

function fasceForRange(startMinutes, durationMinutes) {
  const starts = [];
  for (let m = Math.floor(startMinutes / FASCIA_MINUTES) * FASCIA_MINUTES; m < startMinutes + durationMinutes; m += FASCIA_MINUTES) starts.push(m);
  return starts;
}

function startTimesInRange(fromMinutes, toMinutes, interval, durationMinutes = 0) {
  const starts = [];
  for (let m = fromMinutes; m + durationMinutes <= toMinutes; m += interval) starts.push(m);
  return starts;
}

/* ---------- Da Agendo: src/lib/hours.js ---------- */

function sortRanges(ranges = []) {
  return [...ranges].sort((a, b) => timeToMinutes(a.from) - timeToMinutes(b.from));
}

/* ---------- Da Agendo: src/lib/availability.js ---------- */

export const usesBusySlots = (business) => business.website?.enabled === true;

export function openRanges(business, date) {
  if (business.closedDays?.[date] != null) return [];
  return sortRanges(business.hours?.[weekdayKey(date)] ?? []).map((r) => ({ from: timeToMinutes(r.from), to: timeToMinutes(r.to) }));
}

export function timeState(date, start, booking, now = new Date()) {
  const ms = romeToDate(date, start).getTime() - now.getTime();
  if (ms <= 0) return 'past';
  if (daysBetween(romeParts(now).date, date) > booking.maxDaysAhead) return 'far';
  if (ms < booking.minNoticeHours * 3600000) return 'soon';
  return 'ok';
}

export function eligibleStaff(service, staff, staffId = null) {
  return staff.filter((s) => s.active && service.staffIds.includes(s.id) && (!staffId || s.id === staffId));
}

export function appointmentSlots(business, date, service, staffList, busy, now = new Date()) {
  const slots = [];
  const fasce = usesBusySlots(business);
  for (const range of openRanges(business, date)) {
    const from = fasce ? Math.ceil(range.from / FASCIA_MINUTES) * FASCIA_MINUTES : range.from;
    for (const start of startTimesInRange(from, range.to, fasce ? FASCIA_MINUTES : business.booking.slotInterval, service.durationMin)) {
      const state = timeState(date, start, business.booking, now);
      if (state === 'past') continue;
      const blocks = blocksForRange(start, service.durationMin);
      const freeStaffIds = staffList.filter((s) => !blocks.some((b) => busy[s.id]?.has(b))).map((s) => s.id);
      const free = state === 'ok' && freeStaffIds.length > 0;
      slots.push({ start, free, freeStaffIds, reason: free ? null : state === 'ok' ? 'full' : state });
    }
  }
  return slots;
}

/** "Nessuna preferenza": l'operatore libero con meno impegni quel giorno. */
export function orderStaffForBooking(freeStaffIds, busy) {
  return [...freeStaffIds].sort((a, b) => (busy[a]?.size ?? 0) - (busy[b]?.size ?? 0));
}

/* ---------- Errori ---------- */

/** "Qualcuno ha appena preso questo posto". */
export class SlotTakenError extends Error {
  constructor() {
    super('slot-taken');
    this.code = 'slot-taken';
  }
}

/* ---------- Collegamento a Firestore ---------- */

/**
 * Carica Firebase e i dati pubblici del salone. Fallisce (e il sito torna a
 * WhatsApp) se il salone non esiste, non è pubblicato o non ha il sito collegato.
 */
export async function connect({ idSalone, firebase }) {
  const [{ initializeApp, getApps }, fs] = await Promise.all([
    import(CDN + 'firebase-app.js'),
    import(CDN + 'firebase-firestore.js')
  ]);
  const app = getApps().find((a) => a.name === 'agendo') || initializeApp(firebase, 'agendo');
  const db = fs.getFirestore(app);
  const bizRef = fs.doc(db, 'businesses', idSalone);

  const bizSnap = await fs.getDoc(bizRef);
  if (!bizSnap.exists()) throw new Error('salone-non-trovato');
  const business = { id: idSalone, ...bizSnap.data() };
  if (!(business.published === true && business.active === true && business.mode === 'appuntamenti' && usesBusySlots(business))) {
    throw new Error('prenotazioni-non-attive');
  }

  // Come loadList() di Agendo: in ordine, solo quelli attivi
  const loadList = async (name) => {
    const snap = await fs.getDocs(fs.query(fs.collection(bizRef, name), fs.orderBy('order')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.active);
  };
  const [services, staff] = await Promise.all([loadList('services'), loadList('staff')]);
  Object.assign(business, { services, staff });

  /* Orari occupati tra due date: { "YYYY-MM-DD": { staffId: Set(blocchi da 5 min) } }.
     Come watchBusyBlocks() di Agendo: fasce da 30 minuti del sito (busySlots)
     più i blocchi da 5 minuti della pagina di Agendo (slots). */
  const byDate = (docs) => {
    const out = {};
    const add = (date, staffId, blocks) => {
      const day = (out[date] ??= {});
      blocks.forEach((b) => (day[staffId] ??= new Set()).add(b));
    };
    docs.slots.forEach((s) => add(s.date, s.staffId, s.blocks || []));
    docs.busySlots.forEach((f) => add(f.date, f.staffId, blocksForRange(f.start, f.durationMin)));
    return out;
  };
  const rangeQuery = (name, from, to) =>
    fs.query(fs.collection(bizRef, name), fs.where('date', '>=', from), fs.where('date', '<=', to));

  function watchBusy(from, to, onChange, onError) {
    const parts = { slots: null, busySlots: null };
    const emit = () => { if (parts.slots && parts.busySlots) onChange(byDate(parts)); };
    const stops = ['slots', 'busySlots'].map((name) =>
      fs.onSnapshot(rangeQuery(name, from, to), (snap) => { parts[name] = snap.docs.map((d) => d.data()); emit(); }, onError)
    );
    return () => stops.forEach((stop) => stop());
  }

  /** Rilettura immediata dal server (dopo "orario appena preso"). */
  async function fetchBusy(from, to) {
    const [slots, busySlots] = await Promise.all(['slots', 'busySlots'].map(async (name) =>
      (await fs.getDocsFromServer(rangeQuery(name, from, to))).docs.map((d) => d.data())
    ));
    return byDate({ slots, busySlots });
  }

  const busySlotRef = (staffId, date, start) => fs.doc(bizRef, 'busySlots', `${staffId}_${date}_${start}`);

  /**
   * Prenotazione dal sito, come bookAppointment() di Agendo con le fasce:
   * in UNA transazione la prenotazione e tutte le fasce da 30 minuti che occupa.
   * Nasce "confirmed" se il salone ha la conferma automatica accesa
   * (website.autoConfirm, riletto qui così vale l'impostazione di questo
   * momento), altrimenti "pending": come chiedono le regole (validSiteBooking). staffIds = operatori da provare in ordine (uno solo se
   * il cliente ha una preferenza). I campi sono esattamente quelli che le
   * regole accettano per le prenotazioni dal sito (validSiteBooking).
   */
  async function book({ service, staffIds, date, start, name, phone, notes, noPreference }) {
    const bookingRef = fs.doc(fs.collection(bizRef, 'bookings'));
    const fasceStarts = fasceForRange(start, service.durationMin);
    let chosen = null;
    let status = 'pending';
    await fs.runTransaction(db, async (tx) => {
      let staffId = null;
      for (const id of staffIds) {
        const snaps = await Promise.all(fasceStarts.map((m) => tx.get(busySlotRef(id, date, m))));
        if (snaps.every((s) => !s.exists())) { staffId = id; break; }
      }
      if (!staffId) throw new SlotTakenError();
      const bizNow = await tx.get(bizRef);
      status = bizNow.data()?.website?.autoConfirm === true ? 'confirmed' : 'pending';
      const person = business.staff.find((s) => s.id === staffId);
      const booking = {
        source: 'sito',
        status,
        mode: 'appuntamenti',
        date,
        start,
        end: start + service.durationMin,
        serviceId: service.id,
        serviceName: service.name,
        staffId,
        staffName: person.name,
        noPreference,
        name,
        phone,
        sequence: 0,
        createdAt: fs.serverTimestamp(),
        updatedAt: fs.serverTimestamp()
      };
      if (!business.privacyMode && notes) booking.notes = notes;
      tx.set(bookingRef, booking);
      fasceStarts.forEach((m) => tx.set(busySlotRef(staffId, date, m), { staffId, date, start: m, durationMin: FASCIA_MINUTES, bookingId: bookingRef.id }));
      chosen = person;
    });
    return { id: bookingRef.id, staffId: chosen.id, staffName: chosen.name, status };
  }

  return { business, watchBusy, fetchBusy, book };
}

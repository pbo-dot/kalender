// Udfyld disse to for at dele data mellem lærerne (se README.md).
// Står de tomme, kører appen i prøve-tilstand, hvor data kun gemmes i browseren.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const CLASSES = ['0.A', '0.B'];

// Skemaets rækker. Moduler får et nummer (lesson), pauser vises kun som en grå række.
export const SLOTS = [
  { lesson: 1, time: '08.00–09.00' },
  { pause: 'Frugt og frikvarter' },
  { lesson: 2, time: '10.00–11.00' },
  { pause: 'Frokost og frikvarter' },
  { lesson: 3, time: '12.00–12.45' },
  { lesson: 4, time: '12.45–13.30' },
];

export const SUBJECTS = [
  'Dansk', 'Bogstav', 'Matematik', 'Engelsk', 'Natur/teknologi', 'Idræt', 'Musik',
  'Billedkunst', 'Kristendom', 'Bibliotek', 'Sprogkasse', 'Opsamling', 'Emnedag',
  'Holddeling', 'Understøttende undervisning', 'Tur',
];

export const EVENT_TYPES = {
  lm: { label: 'Lærermøde', short: 'LM' },
  am: { label: 'Afdelingsmøde', short: 'AM' },
  kursus: { label: 'Kursus', short: 'Kursus' },
};

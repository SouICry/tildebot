const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId: "tilde-323223",
  keyFilename: 'k.json',
});
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

require('dotenv').config();
const { Client, Intents, Options } = require('discord.js');
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
  makeCache: Options.cacheWithLimits({
    ...Options.defaultMakeCacheSettings,
    MessageManager: 400,
  })
})


const milliPerWeek = 7 * 24 * 60 * 60 * 1000;
let weekStartTimeMillis, weekStart, prevWeekStartTimeMillis, prevWeekStrings, prevWeekPointStrings, prevWeekFlagStrings,
  weekPointString, weekFlagString;

function getWeekStartTimeMillis() {
  const d = new Date();
  let day = d.getUTCDay();
  if (day == 0) {
    day = 7;
  }
  day--;
  return d.getTime() - ((((day * 24 + d.getUTCHours()) * 60 +
    d.getUTCMinutes()) * 60 + d.getUTCSeconds()) * 1000 + d.getUTCMilliseconds())
}

function updateWeekStart() {
  weekStartTimeMillis = getWeekStartTimeMillis();
  weekStart = new Date(weekStartTimeMillis).toISOString()
  weekPointString = weekStart + ` Points`;
  weekFlagString = weekStart + ` Flag`;
  console.log('Week start: ' + weekStart);

  prevWeekStartTimeMillis = [weekStartTimeMillis - milliPerWeek];
  for (let i = 0; i < 2; i++) {
    prevWeekStartTimeMillis.push(prevWeekStartTimeMillis[i] - milliPerWeek);
  }
  prevWeekStrings = prevWeekStartTimeMillis.map(t => new Date(t).toISOString())
  prevWeekPointStrings = prevWeekStrings.map(t => t + ` Points`);
  prevWeekFlagStrings = prevWeekStrings.map(t => t + ` Flag`);
}

updateWeekStart();
console.log(prevWeekPointStrings);
console.log(prevWeekFlagStrings);

const ids = JSON.parse('["593803427906322433","744024287794561054","448365963528634368","108759575297052672","81980303073083392","188197279822381056","113473785348231168","298673399230758914","204789334023340032","103718711105421312","387115558744883204","207422506989125632","538059759438528517","313220656084811786","89208882697617408","120431037388947456","217509815474192384","660307320055791636","184029195519655936","295449058930327554","254038463463030784","386695975399587841","165207884077072385","174406589854384129","544298974274650117","253405226701160450","198531163919351808","202908317725622272","681958022041567261","147838346360651776","308085536176865280","753447291079229530","447624082469683202","215610046732697601","744284134699958283","187298758348767233","123155829988786176","97051535699091456","150844975947448320","176501648632315904","173543058883739650","390578775546658816","127868141513474048","368795239483310081","321198178902999040","210965205134475265","373320372604633088","185956056546017290","92732477512101888","746518680359272559","265710806912466946","278705120789921794","382785958665519104","190320532707737600","621542965520629790"]'
);




// const prev = prevWeekPointStrings[0];
// const f = async () => {
//   let p = []
//   ids.forEach(async (id) => {
//     p.push(db.collection('points').doc(id).set({
//       gpq: FieldValue.arrayRemove(weekStart)
//     }, { merge: true }));
//     p.push(db.collection('points').doc(id).set({
//       gpq: FieldValue.arrayUnion(prevWeekStrings[0])
//     }, { merge: true }));
//     console.log(id);
//   });
//   await Promise.all(p);
//   console.log('done');
// }
// f();










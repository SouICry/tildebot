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

const f = async () => {
  const snap = await db.collection('points').where('totalPoints', '!=', 0).get();
  const p = [];
  snap.forEach(async (doc, index) => {
    const dat = doc.data();
    if (dat['2021-08-23T00:00:00.000Z Points'] >= 20000) {
      if (dat['2021-08-23T00:00:00.000Z Points'] > 20000) {
        if (dat['2021-08-30T00:00:00.000Z Points']) {
          dat['2021-08-30T00:00:00.000Z Points'] -= 20000;
        } else {
          dat['2021-08-30T00:00:00.000Z Points'] = 0;
        }
        console.log(doc.id);
      }
      if (dat['2021-08-30T00:00:00.000Z Points']) {
        dat['2021-08-30T00:00:00.000Z Points'] += 20000;
      } else {
        dat['2021-08-30T00:00:00.000Z Points'] = 20000;
      }

      p.push(db.collection('points').doc(doc.id).set(dat));
      console.log(doc.id);
    }

  });
  await Promise.all(p);
}
f();



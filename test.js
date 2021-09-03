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

  const dat = await db.collection('points').doc('103718711105421312').get();
  console.log(dat.data().gpq)
}
f();



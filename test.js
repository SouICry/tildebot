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


client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`)

  db.collection('admin').doc('points').onSnapshot(snap => {
    adminPoints = snap.data().ids;
    console.log(adminPoints);
  })

  const flagChannel = await client.channels.fetch(/*'603701097420292105'*/'879935833807925258');
  flagChannel.fetch(true).then(async channel => {

    let all = [];
    let last_id;

    while (true) {
      const options = { limit: 100 };
      if (last_id) {
        options.before = last_id;
      }

      const messages = await channel.messages.fetch(options);
      all.push(...messages);
      last_id = messages.last().id;

      if (messages.size != 100 || all.length >= 1000) {
        break;
      }
    }

    console.log(all.length);

    all = all.filter(arr => {
      let m = arr[1];
      if (m.attachments && m.attachments.size == 1) {
        const attachment = m.attachments.values().next().value;
        if (!attachment.contentType.includes('image') ||
          (m.content.length > 2 && m.mentions.users.size != 1)) {
          return false;
        }
        return true;
      }
      return false;
    })

    console.log(all.length);

    all = all.map((arr, index) => changeFlagPoints(arr[1], index));
    all = all.filter(p => p);
    await Promise.all(all);


  })

})


client.login(process.env.TOKEN);


async function changeFlagPoints(m, index, isRemove = false) {
  let userId = m.author.id;
  let points = 300;

  let weekPointString1, weekFlagString1;
  if (m.createdTimestamp > 1631080800000) {
    return null;
  }

  if (m.createdTimestamp > weekStartTimeMillis) {
    weekPointString1 = weekPointString;
    weekFlagString1 = weekFlagString;
  } else if (m.createdTimestamp > prevWeekStartTimeMillis[0]) {
    weekPointString1 = prevWeekPointStrings[0];
    weekFlagString1 = prevWeekStrings[0]
  } else {
    weekPointString1 = prevWeekPointStrings[1];
    weekFlagString1 = prevWeekStrings[1];
  }


  if (m.content.length > 0) {
    let content = m.content;
    if (m.mentions.users.size == 1) {
      content = m.content.split(' ')[0];
    }

    if (content.length > 2) {
      return null;
    }

    const rank = parseInt(content, 10);
    if (isNaN(rank)) { return null; }
    if (rank < 1) {
      points = 300;
    } else if (rank == 1) {
      points = 3000;
    } else if (rank == 2) {
      points = 1500;
    } else if (rank == 3) {
      points = 1200;
    } else if (rank == 4) {
      points = 1050;
    } else if (rank == 5) {
      points = 900;
    } else if (rank >= 6) {
      points = 600;
    }

    if (isRemove) {
      points = -points;
    }

    if (m.mentions.users.size == 1) {
      userId = m.mentions.users.firstKey();
    }
    const pointsDoc = db.collection('points').doc(userId);

    console.log(index);
    return pointsDoc.set({
      [weekPointString1]: FieldValue.increment(points),
      totalPoints: FieldValue.increment(points),
      [weekFlagString1]: FieldValue.increment(points),
    }, { merge: true })
  }
  return null;
}




// const f = async () => {
//   s = JSON.parse(a);
//   let p = []
//   s.forEach(async (id) => {
//     p.push(db.collection('points').doc(id).update({
//       totalPoints: 0
//     }));
//     console.log(id);
//   });
//   await Promise.all(p);
// }
// f();


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

function getWeekStartTimeMillis() {
  const d = new Date();
  let day = d.getUTCDay();
  if (day == 0) {
    day = 7;
  }

  // set to thursday from monday
  if (day <= 3) {
    day += 7; // 4,5,6,7,8,9,10 for thurs thru wed
  }
  day -= 3; // 1-7 for thurs thru wed

  day--;
  return d.getTime() - ((((day * 24 + d.getUTCHours()) * 60 +
    d.getUTCMinutes()) * 60 + d.getUTCSeconds()) * 1000 + d.getUTCMilliseconds())
}


function getOldMondayWeekStartTimeMillis() {
  const d = new Date();
  let day = d.getUTCDay();
  if (day == 0) {
    day = 7;
  }

  // // set to thursday from monday
  // if (day <= 3) {
  //   day += 7; // 4,5,6,7,8,9,10 for thurs thru wed
  // }
  // day -= 3; // 1-7 for thurs thru wed

  day--;
  return d.getTime() - ((((day * 24 + d.getUTCHours()) * 60 +
    d.getUTCMinutes()) * 60 + d.getUTCSeconds()) * 1000 + d.getUTCMilliseconds())
}


let weekStartTimeMillis, oldWeekStartTimeMillis, weekStart, prevWeekStarts, prevWeekStartTimeMillis, prevWeekStrings, prevOldWeekStrings,
  prevWeekPointStrings, prevOldWeekPointStrings,
  prevOldWeekStartTimeMillis, weekPointString;

function updateWeekStart() {
  weekStartTimeMillis = getWeekStartTimeMillis();
  oldWeekStartTimeMillis = getOldMondayWeekStartTimeMillis();
  weekStart = new Date(weekStartTimeMillis).toISOString()
  weekPointString = weekStart + ` Points`;
  console.log('Week start: ' + weekStart);

  prevWeekStartTimeMillis = [weekStartTimeMillis - milliPerWeek];
  prevOldWeekStartTimeMillis = [oldWeekStartTimeMillis - milliPerWeek];
  prevWeekStarts = [new Date(weekStartTimeMillis - milliPerWeek).toISOString()]
  for (let i = 0; i < 3; i++) { // 3 plus the 1 up top
    prevWeekStartTimeMillis.push(prevWeekStartTimeMillis[i] - milliPerWeek);
    prevOldWeekStartTimeMillis.push(prevOldWeekStartTimeMillis[i] - milliPerWeek);
    prevWeekStarts.push(new Date(prevWeekStartTimeMillis[i] - milliPerWeek).toISOString());
  }
  prevWeekStrings = prevWeekStartTimeMillis.map(t => new Date(t).toISOString())
  prevOldWeekStrings = prevOldWeekStartTimeMillis.map(t => new Date(t).toISOString())
  prevWeekPointStrings = prevWeekStrings.map(t => t + ` Points`);
  prevOldWeekPointStrings = prevOldWeekStrings.map(t => t + ` Points`);

  console.log(weekStart);
  console.log(prevWeekStrings);
}



updateWeekStart();
setTimeout(() => {
  updateWeekStart();
  setInterval(() => {
    updateWeekStart();
  }, milliPerWeek)
}, weekStartTimeMillis + milliPerWeek - Date.now() + 1000);




// todo: print out imp access, week diff for imp access




let adminPoints = {};

const ranks = new Set([1000, 800, 650, 550, 450, 400, 350, 300, 250, 200, 100, 0]);


async function changeFlagPoints(m, isRemove = false) {
  console.log('changeFlagPoints')
  console.log(isRemove);
  const week = weekStart;
  let userId = m.author.id;
  let points = 300;
  if (m.content.length > 0) {
    console.log('a')
    let content = m.content;
    if (m.mentions.users.size == 1) {
      content = m.content.split(' ')[0];
    }

    let rank = parseInt(content, 10);
    if (isNaN(rank)) { rank = 0; }
    if (!ranks.has(rank)) {
      return;
    }
    points = rank * 10;

    if (m.mentions.users.size == 1) {
      userId = m.mentions.users.firstKey();
    }

    console.log('b')
    const [flagDat, changePoints] = await new Promise(async (resolve) => {
      const doc = db.collection('points').doc(userId);
      const curr = await doc.get();
      let changePoints = 0;
      console.log('c')
      if (curr.exists) {
        const flag = curr.data().flag;
        console.log(flag);
        if (flag) {
          if (flag[week]) {
            // Same or higher, process
            if (points >= flag[week]) {
              if (isRemove && points === flag[week]) {
                changePoints = -points - 2500;
                delete flag[week];
              } else {
                changePoints = points - flag[week];
                flag[week] = points;
              }
            }
            // Otherwise dont need to change anything
          } else {
            // First post of week
            flag[week] = points;
            changePoints = points + 2500;
          }
          resolve([flag, changePoints]);
          return;
        }
      }
      // First ever flag post
      resolve([{
        [week]: points
      }, points + 2500])
    });

    console.log('d')
    await db.collection('points').doc(userId).set({
      [weekPointString]: FieldValue.increment(changePoints),
      totalPoints: FieldValue.increment(changePoints),
      flag: flagDat
    }, { merge: true });

    console.log('e')
    if (!isRemove) {
      m.react('✅');
    }
    console.log('f')
  }
}


async function changeGpqPoints(m, isRemove = false) {
  const week = weekStart;
  let userId = m.author.id;
  let points = 10000;

  if (m.mentions.users.size == 1) {
    userId = m.mentions.users.firstKey();
  }

  const [gpqDat, doNothing] = await new Promise(async (resolve) => {
    const doc = db.collection('points').doc(userId);
    const curr = await doc.get();
    let doNothing = false;
    if (curr.exists) {
      const newGpq = curr.data().newGpq;
      if (newGpq) {
        if (newGpq[week]) {
          if (isRemove) {
            delete newGpq[week];
          } else {
            doNothing = true
          }
        } else {
          if (isRemove) {
            doNothing = true;
          } else {
            // First post of week
            newGpq[week] = points;
          }
        }
        resolve([newGpq, doNothing]);
        return;
      }
    }
    // First ever flag post
    resolve([{
      [week]: points
    }, false])
  });

  if (!doNothing) {
    if (isRemove) {
      points = -points;
    }

    await db.collection('points').doc(userId).set({
      [weekPointString]: FieldValue.increment(points),
      totalPoints: FieldValue.increment(points),
      newGpq: gpqDat
    }, { merge: true });
  }
  if (!isRemove && !doNothing) {
    m.react('✅');
  }
}

function checkData(data) {
  let total = data.totalPoints;
  let thisWeek = data[weekPointString] ?? 0;
  let prev4Week = 0;
  let prev4WeekCount = 0;
  let prevOld4WeekCount = 0;
  prevWeekPointStrings.forEach(s => {
    if (data[s]) {
      prev4Week += data[s];
      prev4WeekCount++;
    }
  });
  prevOldWeekPointStrings.forEach(s => {
    if (data[s]) {
      prev4Week += data[s];
      prevOld4WeekCount++;
    }
  });
  prev4WeekCount = Math.max(prev4WeekCount, prevOld4WeekCount);

  let imp = (prev4Week + thisWeek) > 40000 ||
    (total > 135000 && (prev4Week + thisWeek) / prev4WeekCount >= 15000);

  return {
    total,
    thisWeek,
    prev4Week,
    imp: imp ? '✅' : '❎',
  }
}


client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`)

  db.collection('admin').doc('points').onSnapshot(snap => {
    adminPoints = snap.data().ids;
    console.log(adminPoints);
  })

  const flagChannel = await client.channels.fetch(/*'603701097420292105'*//*'879935833807925258'*/'1187462377256517712'); // flag
  flagChannel.fetch(true); 1187462377256517712
  const flagCollector = flagChannel.createMessageCollector();
  flagCollector.on('collect', async m => {
    console.log('Flag channel collect')
    if (m.attachments.size == 1) {
      const attachment = m.attachments.values().next().value;
      if (!attachment.contentType.includes('image')) {
        return;
      }
      changeFlagPoints(m);
    }
  });
  const gpqChannel = await client.channels.fetch(/*'611690843278934017'*//*'911789923684741141'*/'1187462140416753664'); // gpq
  gpqChannel.fetch(true);
  const gpqCollector = gpqChannel.createMessageCollector();
  gpqCollector.on('collect', async m => {
    if (m.attachments.size == 1) {
      const attachment = m.attachments.values().next().value;
      if (!attachment.contentType.includes('image')) {
        return;
      }
      changeGpqPoints(m);
    }
  });
})

client.on('messageDelete', async m => {
  console.log('del');
  if (m.channel.id == /*'603701097420292105'*//*'879935833807925258'*/'1187462377256517712') {
    if (m.attachments.size == 1) {
      const reaction = m.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        changeFlagPoints(m, true);
      }
    }
  }

  if (m.channel.id == /*'611690843278934017'*//*'911789923684741141'*/'1187462140416753664') {
    if (m.attachments.size == 1) {
      const reaction = m.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        changeGpqPoints(m, true);
      }
    }
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.channel.id == /*'603701097420292105'*//*'879935833807925258'*/'1187462377256517712') {
    if (oldMessage.attachments.size == 1) {
      const reaction = oldMessage.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        if (Date.now() - oldMessage.createdTimestamp < 604800000) {
          changeFlagPoints(oldMessage, true);
          await newMessage.reactions.removeAll();
          if (newMessage.attachments.size == 1) {
            changeFlagPoints(newMessage);
          }
        }
      }
    }
  }
  if (oldMessage.channel.id == /*'611690843278934017'*//*'911789923684741141'*/'1187462140416753664') {
    if (oldMessage.attachments.size == 1) {
      const reaction = oldMessage.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        if (Date.now() - oldMessage.createdTimestamp < 604800000) {
          changeGpqPoints(oldMessage, true);
          await newMessage.reactions.removeAll();
          if (newMessage.attachments.size == 1) {
            changeGpqPoints(newMessage);
          }
        }
      }
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commandName === 'ping') {
    await interaction.reply('Pong.');
  } else if (commandName === 'tilde') {
    if (interaction.options.getSubcommandGroup() == 'points') {
      if (interaction.options.getSubcommand() == 'check') {
        const userDoc = await db.collection('points').doc(interaction.options.get('user').user.id).get();
        if (!userDoc.exists) {
          await interaction.reply('No points recorded for this user.');
        } else {
          const data = userDoc.data();
          ({
            total, thisWeek, prev4Week, imp
          } = checkData(data));

          await interaction.reply({
            content: `
<@${userDoc.id}>:
Total: ${total}
This week: ${thisWeek}
Last 4 weeks: ${prev4Week}
Imp Point Req (not time): ${imp}
          `,
            allowedMentions: { "users": [] }
          });
        }
      } else if (interaction.options.getSubcommand() == 'leaderboard') {
        let order, desc;
        const choice = interaction.options.get('which').value;
        if (choice == 'total') {
          order = 'totalPoints'
          desc = 'Total';
        }
        const snap = await db.collection('points').orderBy(order, 'desc').limit(10).get();
        const res = [];
        snap.forEach(doc => {
          res.push(`${res.length + 1}) <@${doc.id}>: ${doc.data()[order]}`)
        });
        await interaction.reply({
          content: `${desc}\n` + res.join('\n'),
          allowedMentions: { "users": [] }
        });
      } else if (interaction.options.getSubcommand() == 'add') {
        if (!adminPoints[interaction.user.id]) {
          await interaction.reply('You need permission to add points.');
        } else {
          const userId = interaction.options.get('user').user.id;
          const userDoc = db.collection('points').doc(userId);
          const points = interaction.options.get('amount').value;
          await userDoc.set({
            // [weekPointString]: FieldValue.increment(points),
            totalPoints: FieldValue.increment(points),
          }, { merge: true });
          await interaction.reply(points + ` points added for <@!${userId}>.`);
        }
      } else if (interaction.options.getSubcommand() == 'use') {
        const userId = interaction.options.get('user').user.id;
        const user = db.collection('points').doc(userId);
        const userDoc = await user.get();
        if (!userDoc.exists) {
          await interaction.reply('No points recorded for this user.');
        } else {
          const data = userDoc.data();
          const points = Math.abs(interaction.options.get('amount').value);
          if (data.totalPoints < points) {
            await interaction.reply('Not enough points.');
          } else {
            await user.set({
              totalPoints: FieldValue.increment(-points),
            }, { merge: true });
            await interaction.reply(points + ` points redeemed from <@!${userId}>`);
          }
        }
      }
    } else if (interaction.options.getSubcommandGroup() == 'gpq') {
      if (interaction.options.getSubcommand() == 'record') {
        if (!adminPoints[interaction.user.id]) {
          await interaction.reply('You need permission to add points for gpq attendees.');
        } else {
          let week = null;
          let weekPointStr = null;
          const date = new Date(interaction.options.get('date').value);
          if (isNaN(date)) {
            await interaction.reply(`Invalid date`);
          } else {
            // const date = Date.now() - 1000 * 86400 * 5;
            if (date > weekStartTimeMillis && date - weekStartTimeMillis < milliPerWeek) {
              week = weekStart;
              weekPointStr = weekPointString;
            } else if (date > prevWeekStartTimeMillis[0] && date - prevWeekStartTimeMillis[0] < milliPerWeek) {
              week = prevWeekStarts[0]
              weekPointStr = prevWeekPointStrings[0];
            } else if (date > prevWeekStartTimeMillis[1] && date - prevWeekStartTimeMillis[1] < milliPerWeek) {
              week = prevWeekStarts[1]
              weekPointStr = prevWeekPointStrings[0];
            } else if (date > prevWeekStartTimeMillis[2] && date - prevWeekStartTimeMillis[2] < milliPerWeek) {
              week = prevWeekStarts[2]
              weekPointStr = prevWeekPointStrings[0];
            }

            if (week) {
              const attendees = [...interaction.options.get('attendees').value.matchAll(/<@!([0-9]+)>/g)].map(a => a[1]);
              await recordGPQ(attendees, interaction, week, weekPointStr);
            } else {
              await interaction.reply({
                content: `Invalid date (must be in past 3 weeks) `,
                allowedMentions: { "users": [] }
              })
            }
          }
        }
      }
    }
  }
});

async function recordGPQ(users, interaction, week = weekStart, weekPointStr = weekPointString) {
  let checkedUsers = [];
  await interaction.reply({
    content: `Adding... `,
    allowedMentions: { "users": [] }
  })
  try {
    await new Promise((resolve, reject) => {
      users.forEach(async (userId, index) => {
        const doc = db.collection('points').doc(userId);
        const curr = await doc.get();
        if (curr.exists) {
          const gpq = curr.data().gpq;

          if (!gpq || gpq.length == 0 || !gpq.includes(week)) {
            checkedUsers.push(userId)
          }
        } else {
          checkedUsers.push(userId)
        }
        if (index === users.length - 1) {
          resolve();
        }
      })
    });
    await db.runTransaction(async t => {
      checkedUsers.forEach(userId => {
        const doc = db.collection('points').doc(userId);
        t.set(doc, {
          [weekPointStr]: FieldValue.increment(20000),
          totalPoints: FieldValue.increment(20000),
          gpq: FieldValue.arrayUnion(week)
        }, { merge: true });
      })
    })
  } catch (error) {
    console.log(error);
    await interaction.editReply({
      content: `Something went wrong, GPQ not recorded.`,
      allowedMentions: { "users": [] }
    })
  }
  await interaction.editReply({
    content: `GPQ attendance recorded for week starting on ${week} for <@!${users.join('> <@!')}>.`,
    allowedMentions: { "users": [] }
  })
}





client.login(process.env.TOKEN);

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId: "tilde-323223",
  keyFilename: 'k.json',
});
const admin = require('firebase-admin');

require('dotenv').config();
const Discord = require("discord.js")
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] })


let adminPoints = {};


async function changeFlagPoints(m, isRemove = false) {
  const userId = m.author.id;
  let points = 300;
  if (m.content.length > 0) {
    const rank = parseInt(m.content, 10);
    if (isNaN(rank)) { return; }
    if (rank < 1) {
      points = 300;
      m.react('0️⃣');
    } else if (rank == 1) {
      points = 3000;
      m.react('1️⃣');
    } else if (rank == 2) {
      points = 1500;
      m.react('2️⃣');
    } else if (rank == 3) {
      points = 1200;
      m.react('3️⃣');
    } else if (rank == 4) {
      points = 1050;
      m.react('4️⃣');
    } else if (rank == 5) {
      points = 900;
      m.react('5️⃣');
    } else if (rank >= 6) {
      points = 600;
      m.react('6️⃣');
    }

    if (isRemove) {
      points = -points;
    }

    const pointsDoc = db.collection('points').doc(userId);
    await pointsDoc.set({
      monthlyPoints: admin.firestore.FieldValue.increment(points),
      totalPoints: admin.firestore.FieldValue.increment(points),
    }, { merge: true });
    if (!isRemove) {
      m.react('✅');
    }
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`)

  db.collection('admin').doc('points').onSnapshot(snap => {
    adminPoints = snap.data().ids;
    console.log(adminPoints);
  })

  const flagChannel = await client.channels.fetch(/*'603701097420292105'*/'776954122464526386');
  const flagCollector = flagChannel.createMessageCollector();
  flagCollector.on('collect', async m => {
    if (m.attachments.size == 1) {
      const attachment = m.attachments.values().next().value;
      if (!attachment.contentType.includes('image') || m.content.length > 2) {
        return;
      }
      changeFlagPoints(m);
    }
  });
})

client.on('messageDelete', async m => {
  if (m.channel.id == '776954122464526386') {
    if (m.attachments.size == 1) {
      const reaction = m.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        changeFlagPoints(m, true);
      }
    }
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.channel.id == '776954122464526386') {
    if (oldMessage.attachments.size == 1 && newMessage.attachments.size == 1) {
      const reaction = oldMessage.reactions.resolve('✅');
      if (reaction != null && reaction.users.resolve('877028314357825546') != null) {
        changeFlagPoints(oldMessage, true);
        changeFlagPoints(newMessage);
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
          await interaction.reply(`
          Total: ${data.totalPoints}\nThis month: ${data.monthlyPoints}\nLast month: ${data.lastMonthPoints}
          `);
        }
      } else if (interaction.options.getSubcommand() == 'add') {
        if (!adminPoints[interaction.user.id]) {
          await interaction.reply('You need permission to add points.');
        } else {
          const userId = interaction.options.get('user').user.id;
          const userDoc = db.collection('points').doc(userId);
          const points = interaction.options.get('amount').value;
          await userDoc.set({
            monthlyPoints: admin.firestore.FieldValue.increment(points),
            totalPoints: admin.firestore.FieldValue.increment(points),
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
              totalPoints: admin.firestore.FieldValue.increment(-points),
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
          const users = [];
          for (let i = 1; i <= 6; i++) {
            const user = interaction.options.get('user' + i);
            if (user) {
              users.push(user.user.id);
            }
          }

          await db.runTransaction(async t => {
            users.forEach(userId => {
              t.set(db.collection('points').doc(userId), {
                monthlyPoints: admin.firestore.FieldValue.increment(20000),
                totalPoints: admin.firestore.FieldValue.increment(20000),
              }, { merge: true })
            })
          })
          await interaction.reply(`GPQ attendance recorded for <@!${users.join('> <@!')}>.`);
        }
      }
    }
  }
  // ...
});
client.login(process.env.TOKEN);
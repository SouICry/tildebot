require('dotenv').config();


const Discord = require("discord.js")

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [{
    name: 'tilde',
    description: 'Tilde bot',
    options: [{
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        name: 'points',
        description: 'Points',
        options: [
            {
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: 'check',
                description: 'Check how many points someone has',
                options: [
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user',
                        required: true,
                        description: 'User to check'
                    }
                ]
            },

            {
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: 'add',
                description: 'Add points to someone (negative to subtract).',
                options: [
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user',
                        required: true,
                        description: 'User to change'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                        name: 'amount',
                        required: true,
                        description: 'Amount to add (negative to subtract)'
                    },
                ]
            },
            {
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: 'use',
                description: 'Redeem points for someone',
                options: [
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user',
                        required: true,
                        description: 'User to redeem'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                        name: 'amount',
                        required: true,
                        description: 'Amount to redeem'
                    },
                ]
            }
        ]
    },
    {
        type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
        name: 'gpq',
        description: 'GPQ',
        options: [
            {
                type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                name: 'record',
                description: 'Record GPQ attendees. Up to 6 at a time.',
                options: [
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user1',
                        required: true,
                        description: 'Attendee'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user2',
                        description: 'Attendee'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user3',
                        description: 'Attendee'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user4',
                        description: 'Attendee'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user5',
                        description: 'Attendee'
                    },
                    {
                        type: Discord.Constants.ApplicationCommandOptionTypes.USER,
                        name: 'user6',
                        description: 'Attendee'
                    },
                ]
            }

        ]
    }]
}];

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands('877028314357825546', '603701097420292101'/*'376166026099818499'*/),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
const { SlashCommandBuilder } = require('discord.js');
const Database = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listservers')
        .setDescription('List all configured IPMI servers'),

    async execute(interaction) {
        try {
            const servers = await Database.listServers(interaction.user.id);
            console.log('Retrieved servers:', servers);

            if (!servers || servers.length === 0) {
                await interaction.reply({
                    content: 'No servers configured. Use /setup to add a server.',
                    flags: ['Ephemeral']
                });
                return;
            }

            const serverList = servers.map(s => `${s.server_name}: ${s.ipmi_ip}`).join('\n');
            await interaction.reply({
                content: `Configured servers:\n\`\`\`\n${serverList}\n\`\`\``,
                flags: ['Ephemeral']
            });
        } catch (error) {
            console.error('List servers error:', error);
            await interaction.reply({
                content: `Error retrieving server list: ${error.message}`,
                flags: ['Ephemeral']
            });
        }
    },
};

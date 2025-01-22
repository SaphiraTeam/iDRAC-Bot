const { SlashCommandBuilder } = require('discord.js');
const Database = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure IPMI settings')
        .addStringOption(option =>
            option.setName('server_name')
                .setDescription('Name for this server')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IPMI IP address')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('IPMI username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('IPMI password')
                .setRequired(true)),

    async execute(interaction) {
        const serverName = interaction.options.getString('server_name');
        const ip = interaction.options.getString('ip');
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');

        try {
            await Database.setConfig(interaction.user.id, serverName, ip, username, password);
            await interaction.reply({ 
                content: `IPMI configuration saved successfully for server "${serverName}"!`, 
                flags: ['Ephemeral'] 
            });
        } catch (error) {
            await interaction.reply({ 
                content: 'Error saving IPMI configuration!', 
                flags: ['Ephemeral'] 
            });
        }
    },
};
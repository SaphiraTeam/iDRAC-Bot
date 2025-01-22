const { SlashCommandBuilder } = require('discord.js');
const Database = require('../database');
const IPMIWrapper = require('../ipmiWrapper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Server management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Get server power status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('power')
                .setDescription('Get power usage information'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fans')
                .setDescription('Get fan speeds'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setfan')
                .setDescription('Set fan speed percentage')
                .addIntegerOption(option =>
                    option.setName('speed')
                        .setDescription('Fan speed percentage (0-100)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('temperature')
                .setDescription('Get temperature readings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sensors')
                .setDescription('Get all sensor readings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('powersupply')
                .setDescription('Get power supply information'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('energy')
                .setDescription('Get energy consumption information')),

    async execute(interaction) {
        const config = await Database.getConfig(interaction.user.id);
        if (!config) {
            await interaction.reply({ content: 'Please set up IPMI configuration first using /setup', ephemeral: true });
            return;
        }

        const ipmi = new IPMIWrapper(config.ipmi_ip, config.username, config.password);

        try {
            await interaction.deferReply({ ephemeral: true });
            let response;

            switch (interaction.options.getSubcommand()) {
                case 'status':
                    response = await ipmi.getPowerStatus();
                    break;
                case 'power':
                    response = await ipmi.getPowerUsage();
                    break;
                case 'fans':
                    response = await ipmi.getFanSpeed();
                    break;
                case 'setfan':
                    const speed = interaction.options.getInteger('speed');
                    if (speed < 0 || speed > 100) {
                        await interaction.editReply('Speed must be between 0 and 100');
                        return;
                    }
                    response = await ipmi.setFanSpeed(speed);
                    response = `Fan speed set to ${speed}%`;
                    break;
                case 'temperature':
                    response = await ipmi.getTemperatures();
                    break;
                case 'sensors':
                    response = await ipmi.getSensors();
                    break;
                case 'powersupply':
                    response = await ipmi.getPowerSupply();
                    break;
                case 'energy':
                    response = await ipmi.getEnergyConsumption();
                    break;
            }

            await interaction.editReply({ content: `\`\`\`\n${response}\n\`\`\`` });
        } catch (error) {
            await interaction.editReply({ content: `Error: ${error.message}` });
        }
    },
};
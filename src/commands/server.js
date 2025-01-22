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
                .setDescription('Get server power status')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('power')
                .setDescription('Get power usage information')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fans')
                .setDescription('Get fan speeds')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setfan')
                .setDescription('Set fan speed percentage')
                .addIntegerOption(option =>
                    option.setName('speed')
                        .setDescription('Fan speed percentage (0-100)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('temperature')
                .setDescription('Get temperature readings')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sensors')
                .setDescription('Get all sensor readings')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('powersupply')
                .setDescription('Get power supply information')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('energy')
                .setDescription('Get energy consumption information')
                .addStringOption(option =>
                    option.setName('server_name')
                        .setDescription('Name of the server to manage')
                        .setRequired(false))),

    async execute(interaction) {
        const serverName = interaction.options.getString('server_name');
        let config;
        
        if (serverName) {
            config = await Database.getConfig(interaction.user.id, serverName);
        } else {
            config = await Database.getDefaultServer(interaction.user.id);
        }
        
        if (!config) {
            await interaction.reply({ 
                content: serverName 
                    ? `Server "${serverName}" not found. Please set up IPMI configuration first using /setup`
                    : 'No servers configured. Please set up IPMI configuration first using /setup', 
                flags: ['Ephemeral'] 
            });
            return;
        }

        const ipmi = new IPMIWrapper(config.ipmi_ip, config.username, config.password);

        try {
            await interaction.deferReply({ flags: ['Ephemeral'] });
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

            await interaction.editReply({ 
                content: `# Server: ${config.server_name} | ${config.ipmi_ip}\n\`\`\`\n${response}\n\`\`\`` 
            });
        } catch (error) {
            await interaction.editReply({ content: `Error: ${error.message}` });
        }
    },
};
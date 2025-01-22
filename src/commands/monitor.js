const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('../database');
const IPMIWrapper = require('../ipmiWrapper');
const { authorizedRoles, authorizedUsers, monitorRefreshRate } = require('../config');

const activeMonitors = new Map();

function isAuthorized(interaction) {
    if (authorizedUsers.includes(interaction.user.id)) return true;
    return interaction.member.roles.cache.some(role => authorizedRoles.includes(role.id));
}

async function updateEmbed(client, channelId, messageId, config, botAvatarURL) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error(`Channel ${channelId} not found`);
            return false;
        }

        const ipmi = new IPMIWrapper(config.ipmi_ip, config.username, config.password);
        const sensorData = await ipmi.getSensors();
        const sensorLines = sensorData.split('\n');

        const powerMatch = sensorLines.find(line => line.includes('Pwr Consumption'))?.match(/(\d+)\s*Watts/);
        const watts = powerMatch ? powerMatch[1] : 'N/A';

        const cpuUsage = sensorLines.find(line => line.includes('CPU Usage'))?.match(/(\d+)\s*percent/)?.[1] || 'N/A';
        const memUsage = sensorLines.find(line => line.includes('MEM Usage'))?.match(/(\d+)\s*percent/)?.[1] || 'N/A';
        const sysUsage = sensorLines.find(line => line.includes('SYS Usage'))?.match(/(\d+)\s*percent/)?.[1] || 'N/A';

        const temps = sensorLines
            .filter(line => line.includes('degrees C'))
            .map(line => {
                const match = line.match(/(.*?)\s*\|\s*(\w+h)\s*\|\s*ok\s*\|\s*([\d.]+)\s*\|\s*(\d+)\s*degrees/);
                if (!match) return null;
                
                const [, name, sensor, location] = match;
                if (name.trim() === 'Temp') {
                    if (sensor === '0Eh') return `CPU1 Temp: ${match[4]}°C`;
                    if (sensor === '0Fh') return `CPU2 Temp: ${match[4]}°C`;
                }
                return `${name.trim()}: ${match[4]}°C`;
            })
            .filter(Boolean);

        const fans = sensorLines
            .filter(line => line.includes('Fan') && line.includes('RPM'))
            .map(line => {
                const match = line.match(/(Fan\d+).*?(\d+)\s*RPM/);
                return match ? `${match[1]}: ${match[2]} RPM` : null;
            })
            .filter(Boolean);

        const embed = new EmbedBuilder()
            .setTitle(`🖥️ ${config.server_name}`)
            .setColor(0x00FF00)
            .addFields(
                { 
                    name: '📡 Connection',
                    value: `\`${config.ipmi_ip}\``,
                    inline: true 
                },
                { 
                    name: '⚡ Power',
                    value: `\`${watts} Watts\``,
                    inline: true 
                },
                { name: '\u200B', value: '\u200B', inline: true },
                { 
                    name: '📊 System Usage',
                    value: [
                        `> 💻 CPU: \`${cpuUsage}%\``,
                        `> 🧠 Memory: \`${memUsage}%\``,
                        `> 🔄 System: \`${sysUsage}%\``,
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: '🌡️ Temperatures',
                    value: temps.map(temp => `> ${temp}`).join('\n') || '> No data',
                    inline: true 
                },
                { 
                    name: '🌪️ Fan Speeds',
                    value: fans.map(fan => `> ${fan}`).join('\n') || '> No data',
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ 
                text: `Last updated • Refresh rate: ${monitorRefreshRate/1000}s`,
                iconURL: botAvatarURL 
            });

        try {
            const message = await channel.messages.fetch(messageId);
            if (!message) {
                console.error('Monitor message not found');
                return false;
            }
            await message.edit({ embeds: [embed] });
            return true;
        } catch (error) {
            console.error('Error editing message:', error);
            return false;
        }
    } catch (error) {
        console.error(`Monitor update error for ${config.server_name}:`, error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('monitor')
        .setDescription('Create a live updating server status monitor')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'Start', value: 'start' },
                    { name: 'Stop', value: 'stop' }
                ))
        .addStringOption(option =>
            option.setName('server_name')
                .setDescription('Name of the server to monitor')
                .setRequired(false)),

    async execute(interaction) {
        if (!isAuthorized(interaction)) {
            await interaction.reply({ 
                content: 'You are not authorized to use this command', 
                flags: ['Ephemeral'] 
            });
            return;
        }

        const action = interaction.options.getString('action');
        const serverName = interaction.options.getString('server_name');

        if (action === 'stop') {
            const monitorKey = `${interaction.channelId}`;
            const monitor = activeMonitors.get(monitorKey);
            if (monitor) {
                clearInterval(monitor.interval);
                activeMonitors.delete(monitorKey);
                await interaction.reply({ 
                    content: 'Monitor stopped', 
                    flags: ['Ephemeral'] 
                });
            } else {
                await interaction.reply({ 
                    content: 'No active monitor in this channel', 
                    flags: ['Ephemeral'] 
                });
            }
            return;
        }

        let config;
        if (serverName) {
            config = await Database.getConfig(interaction.user.id, serverName);
        } else {
            config = await Database.getDefaultServer(interaction.user.id);
        }

        if (!config) {
            await interaction.reply({
                content: 'Server configuration not found',
                flags: ['Ephemeral']
            });
            return;
        }

        const channel = interaction.channel;
        
        // Verify channel access and permissions
        try {
            const permissions = channel.permissionsFor(interaction.client.user);
            if (!permissions.has('SendMessages') || !permissions.has('ViewChannel')) {
                await interaction.reply({
                    content: 'Error: Bot does not have required permissions in this channel. Need: View Channel, Send Messages',
                    flags: ['Ephemeral']
                });
                return;
            }
        } catch (error) {
            console.error('Permission check error:', error);
            await interaction.reply({
                content: 'Error: Could not verify channel permissions',
                flags: ['Ephemeral']
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Server Status: ${config.server_name}`)
            .setColor(0x00FF00)
            .setDescription('Initializing monitor...')
            .setTimestamp();

        let message;
        try {
            message = await channel.send({ embeds: [embed] });
            await interaction.reply({
                content: 'Monitor started!',
                flags: ['Ephemeral']
            });
        } catch (error) {
            console.error('Failed to send monitor message:', error);
            await interaction.reply({
                content: 'Error: Could not create monitor message',
                flags: ['Ephemeral']
            });
            return;
        }

        const botAvatarURL = interaction.client.user.displayAvatarURL();
        const messageId = message.id;

        const interval = setInterval(async () => {
            try {
                const success = await updateEmbed(
                    interaction.client,
                    channel.id,
                    messageId,
                    config,
                    botAvatarURL
                );

                if (!success) {
                    console.error('Failed to update monitor, stopping');
                    clearInterval(interval);
                    activeMonitors.delete(channel.id);
                }
            } catch (error) {
                console.error('Error updating monitor:', error);
                clearInterval(interval);
                activeMonitors.delete(channel.id);
            }
        }, monitorRefreshRate);

        activeMonitors.set(channel.id, {
            messageId,
            interval,
            config,
            channelId: channel.id,
            channel,
            botAvatarURL
        });

        // Do initial update
        await updateEmbed(interaction.client, channel.id, messageId, config, botAvatarURL);
    },
};

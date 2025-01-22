require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    ipmiToolPath: process.env.IPMI_TOOL_PATH || 'ipmitool',
    authorizedRoles: (process.env.AUTHORIZED_ROLES || '').split(',').filter(Boolean),
    authorizedUsers: (process.env.AUTHORIZED_USERS || '').split(',').filter(Boolean),
    monitorRefreshRate: parseInt(process.env.MONITOR_REFRESH_RATE) || 30000
};

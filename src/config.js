require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    ipmiToolPath: process.env.IPMI_TOOL_PATH || 'ipmitool'
};

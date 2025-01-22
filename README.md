# iDRAC Discord Bot

A powerful Discord bot for managing Dell servers remotely through IPMI commands. Monitor and control your Dell servers with easy-to-use Discord slash commands.


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-v16.9.0+-green.svg)](https://nodejs.org)

##  Features

- Real-time server power status monitoring
- Fan speed control and monitoring
- Temperature sensors reading
- Power supply information
- Energy consumption tracking
- Easy-to-use slash commands
- Secure credential storage
- User-specific server configuration (All servers need to be on the same local network as the discord bot, DONT PORTFORWAD IDRAC!!!!)

## 📋 Prerequisites

- Node.js (v16.9.0 or higher)
- IPMItool installed on your system [Download from Dell.com](https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=m63f3)
- A Dell server with iDRAC configured
- A Discord application and bot token
- SQLite3

## 🚀 Quick Start

1. **System Setup**
```bash
# Clone the repository
git clone https://github.com/saphirateam/iDRAC-Bot.git
cd iDRAC-Bot

# Install dependencies
npm install

# Create configuration file
cp .env.example .env
```

2. **Configure Environment**
```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_server_id
IPMI_TOOL_PATH=/path/to/ipmitool
AUTHORIZED_ROLES=role1,role2 
AUTHORIZED_USERS=userid1,userid2 
MONITOR_REFRESH_RATE=30000 

```

3. **Start the Bot**
```bash
node .
```

## 🔧 Advanced Configuration

### Discord Bot Setup
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Enable required intents:
   - Server Members Intent
   - Message Content Intent
4. Generate OAuth2 URL with permissions:
   - Send Messages
   - Use Slash Commands
   - View Channels

###  Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/setup` | Configure IPMI settings | `/setup ip:192.168.1.100 username:admin password:pass` |
| `/monitor start` | Sends and starts the Monitor embed | `/server fans` |
| `/monitor stop` | Stops the monitor embed and makes it not update | `/server fans` |
| `/server status` | Get power status | `/server status` |
| `/server fans` | View fan speeds | `/server fans` |
| `/server setfan` | Set fan speed | `speed: 0-100` |
| `/server sensors` | All sensor data | None |
| `/server energy` | Power consumption | None 

## 🔍 Troubleshooting

1. **IPMI Connection Issues**
   - Verify iDRAC IP is accessible
   - Check credentials are correct
   - Ensure iDRAC is properly configured
   - Verify network firewall settings

2. **Bot Connection Issues**
   - Verify Discord token is correct
   - Check bot has proper permissions
   - Ensure Node.js version is compatible

3. **Command Issues**
   - Check command syntax
   - Verify bot has necessary Discord permissions
   - Check server logs for errors

## 📞 Support & Community

- [Discord Server](https://discord.gg/your-server)
- [GitHub Issues](https://github.com/yourusername/iDRAC-Bot/issues)

## 📦 Dependencies

### Core Dependencies
- discord.js: ^14.0.0
- sqlite3: ^5.0.0
- dotenv: ^16.0.0

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dell 
- Discord.js community
- Contributors and testers

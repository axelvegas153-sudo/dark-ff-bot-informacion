require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
  .setName('ff')
  .setDescription('Busca información de un jugador de Free Fire')
  .addStringOption(opt => opt.setName('uid').setDescription('UID del jugador').setRequired(true))
  .addStringOption(opt => opt.setName('region').setDescription('Región: BR, EU, NA, ASIA').setRequired(false))
  .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Comandos registrados ✅');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'ff') {
    const uid = interaction.options.getString('uid');
    const region = interaction.options.getString('region') || 'BR';
    
    const embed = new EmbedBuilder()
    .setColor(0x00FFFF)
    .setTitle(`🔥 Info Free Fire - UID: ${uid}`)
    .addFields(
        { name: 'UID', value: uid, inline: true },
        { name: 'Región', value: region, inline: true },
        { name: 'Estado', value: 'Conectado ✅' }
      )
    .setFooter({ text: 'Dark FF Bot' })
    .setTimestamp();
      
    await interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
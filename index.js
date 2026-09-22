require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===============================
// COMANDO /ff
// ===============================

const commands = [
  new SlashCommandBuilder()
    .setName('ff')
    .setDescription('Busca información de un jugador de Free Fire')
    .addStringOption(option =>
      option
        .setName('uid')
        .setDescription('UID del jugador')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('region')
        .setDescription('Región del jugador')
        .setRequired(false)
        .addChoices(
          { name: 'BR', value: 'BR' },
          { name: 'US', value: 'US' },
          { name: 'SG', value: 'SG' },
          { name: 'ID', value: 'ID' },
          { name: 'IN', value: 'IND' },
          { name: 'RU', value: 'RU' },
          { name: 'TW', value: 'TW' },
          { name: 'VN', value: 'VN' },
          { name: 'TH', value: 'TH' },
          { name: 'ME', value: 'ME' },
          { name: 'PK', value: 'PK' },
          { name: 'BD', value: 'BD' },
          { name: 'CIS', value: 'CIS' }
        )
    )
    .toJSON()
];

// ===============================
// REGISTRAR COMANDO
// ===============================

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comando /ff...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comando /ff registrado correctamente');
  } catch (error) {
    console.error('❌ Error registrando comando:', error);
  }
})();

// ===============================
// BOT LISTO
// ===============================

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// ===============================
// COMANDO
// ===============================

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== 'ff') return;

  const uid = interaction.options.getString('uid');
  const region =
    interaction.options.getString('region') || 'BR';

  // Comprobar que el UID solamente tenga números
  if (!/^\d+$/.test(uid)) {
    return interaction.reply({
      content: '❌ El UID solamente puede contener números.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {

    // ===============================
    // API FREE FIRE
    // ===============================

    const apiURL =
      `https://free-ff-api-src-5plp.onrender.com/api/v1/account?region=${encodeURIComponent(region)}&uid=${encodeURIComponent(uid)}`;

    console.log(`Consultando: ${apiURL}`);

    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error(`API respondió HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log('Respuesta API:', data);

    // ===============================
    // COMPROBAR ERROR DE API
    // ===============================

    if (data.error) {
      return interaction.editReply({
        content:
          `❌ No se pudo encontrar la cuenta.\n\n` +
          `**Mensaje de la API:** ${data.message || data.error}`
      });
    }

    // ===============================
    // INFORMACIÓN DEL JUGADOR
    // ===============================

    const info = data.basicInfo;

    if (!info) {
      return interaction.editReply({
        content:
          '❌ La API respondió, pero no devolvió información del jugador.'
      });
    }

    const nickname = info.nickname || 'Desconocido';
    const level = info.level ?? 'Desconocido';
    const likes = info.liked ?? 'Desconocidos';
    const rank = info.rank ?? 'Desconocido';
    const csRank = info.csRank ?? 'Desconocido';

    // ===============================
    // EMBED
    // ===============================

    const embed = new EmbedBuilder()
      .setColor(0x00ffff)
      .setTitle('🔥 Información de Free Fire')
      .setDescription(`**${nickname}**`)
      .addFields(
        {
          name: '👤 Nombre',
          value: String(nickname),
          inline: false
        },
        {
          name: '🆔 UID',
          value: String(info.accountId || uid),
          inline: true
        },
        {
          name: '🌎 Región',
          value: String(info.region || region),
          inline: true
        },
        {
          name: '⭐ Nivel',
          value: String(level),
          inline: true
        },
        {
          name: '❤️ Likes',
          value: String(likes),
          inline: true
        },
        {
          name: '🏆 Rango BR',
          value: String(rank),
          inline: true
        },
        {
          name: '🎯 Rango CS',
          value: String(csRank),
          inline: true
        }
      )
      .setFooter({
        text: 'Dark FF Bot'
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed]
    });

  } catch (error) {

    console.error('❌ Error consultando Free Fire:', error);

    await interaction.editReply({
      content:
        '❌ No pude obtener la información de esa cuenta.\n\n' +
        'Puede que la API esté temporalmente fuera de servicio o que la región/UID no sean válidos.'
    });
  }
});

// ===============================
// INICIAR BOT
// ===============================

client.login(TOKEN);

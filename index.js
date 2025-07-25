require("dotenv").config();
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const config = require("./config.json");

// Expressサーバーの設定
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Discord Bot is running! 🤖");
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    botReady: client.readyAt ? true : false,
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (
    message.content === "!create_panel" &&
    message.member.permissions.has(PermissionsBitField.Flags.Administrator)
  ) {
    await message.delete(); // メッセージ削除

    const embed = new EmbedBuilder()
      .setTitle(config.panel.title)
      .setDescription(config.panel.description)
      .setColor(0x00bfff);

    // 複数のActionRowに分割してボタンを配置
    const rows = [];
    const buttonsPerRow = 5; // 1行あたりのボタン数

    for (let i = 0; i < config.panel.roles.length; i += buttonsPerRow) {
      const row = new ActionRowBuilder();
      const rowRoles = config.panel.roles.slice(i, i + buttonsPerRow);

      for (const role of rowRoles) {
        const button = new ButtonBuilder()
          .setCustomId(`role_${role.roleId}`)
          .setLabel(role.label)
          .setStyle(ButtonStyle.Secondary);
        row.addComponents(button);
      }

      rows.push(row);
    }

    await message.channel.send({ embeds: [embed], components: rows });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const roleId = interaction.customId.replace("role_", "");
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.reply({
      content: "⚠️ ロールが見つかりません。",
      ephemeral: true,
    });
  }

  const member = interaction.member;

  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(roleId);
    await interaction.reply({
      content: `❌ ${role.name} ロールを外しました。`,
      ephemeral: true,
    });
  } else {
    await member.roles.add(roleId);
    await interaction.reply({
      content: `✅ ${role.name} ロールを付与しました。`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

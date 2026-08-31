const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");
const http = require("http");

// ======================================================
// BOT SETTINGS
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing!");
}

if (!CLIENT_ID) {
  console.error("❌ CLIENT_ID is missing!");
}

if (!GUILD_ID) {
  console.error("❌ GUILD_ID is missing!");
}

// ======================================================
// DISCORD CLIENT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ======================================================
// COIN STORAGE
// ======================================================

const COINS_FILE = "./coins.json";

let coins = new Map();

// ======================================================
// LOAD COINS
// ======================================================

function loadCoins() {
  try {
    if (fs.existsSync(COINS_FILE)) {
      const data = JSON.parse(
        fs.readFileSync(COINS_FILE, "utf8")
      );

      coins = new Map(
        Object.entries(data).map(([id, value]) => [
          id,
          Number(value)
        ])
      );

      console.log("✅ Coins loaded successfully!");
    } else {
      console.log("No coins.json found. Starting fresh.");
    }
  } catch (error) {
    console.error("❌ Failed to load coins:", error);
  }
}

// ======================================================
// SAVE COINS
// ======================================================

function saveCoins() {
  try {
    const data = Object.fromEntries(coins);

    fs.writeFileSync(
      COINS_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("❌ Failed to save coins:", error);
  }
}

loadCoins();

// ======================================================
// REWARDS
// ======================================================

const rewards = [
  {
    name: "Totem of Undying x1",
    rarity: "Rare",
    chance: 20,
    image:
      "https://minecraft.wiki/images/Totem_of_Undying_JE2_BE2.png"
  },

  {
    name: "Golden Apple x32",
    rarity: "Uncommon",
    chance: 25,
    image:
      "https://minecraft.wiki/images/Golden_Apple_JE2_BE2.png"
  },

  {
    name: "Enchanted Golden Apple x1",
    rarity: "Epic",
    chance: 10,
    image:
      "https://minecraft.wiki/images/Enchanted_Golden_Apple_JE2_BE2.png"
  },

  {
    name: "1 Day Fly",
    rarity: "Legendary",
    chance: 5,
    image:
      "https://minecraft.wiki/images/Feather_JE2_BE2.png"
  },

  {
    name: "$50,000 Money",
    rarity: "Legendary",
    chance: 5,
    image:
      "https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png"
  },

  {
    name: "Netherite Ingot x1",
    rarity: "Rare",
    chance: 15,
    image:
      "https://minecraft.wiki/images/Netherite_Ingot_JE2_BE1.png"
  },

  {
    name: "Nothing - Try Again Your Luck!",
    rarity: "Common",
    chance: 20,
    image:
      "https://minecraft.wiki/images/Barrier_JE2_BE2.png"
  }
];

// ======================================================
// RANDOM REWARD
// ======================================================

function getReward() {
  const random = Math.random() * 100;

  let total = 0;

  for (const reward of rewards) {
    total += reward.chance;

    if (random <= total) {
      return reward;
    }
  }

  return rewards[rewards.length - 1];
}

// ======================================================
// ROLL ANIMATION
// ======================================================

const animationFrames = [
  "🎁 ➡️ ❓ ➡️ ❓",
  "🎁 ➡️ 🟡 ➡️ 🎁",
  "💎 ➡️ 🔥 ➡️ 🍎",
  "🔥 ➡️ 💜 ➡️ 💎",
  "💜 ➡️ 😎 ➡️ 💎",
  "😳 ➡️ 😱 ➡️ 🎁",
  "💎 ➡️ ❤️ ➡️ 💜",
  "❤️ ➡️ 🎁 ➡️ 💎"
];

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

  // ====================================================
  // /c
  // ====================================================

  new SlashCommandBuilder()
    .setName("c")
    .setDescription("Check your Coins"),

  // ====================================================
  // /addcoins
  // ====================================================

  new SlashCommandBuilder()
    .setName("addcoins")
    .setDescription("Add coins to a user (Admin only)")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator.toString()
    )
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to give coins")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of coins")
        .setRequired(true)
        .setMinValue(1)
    ),

  // ====================================================
  // /roll
  // ====================================================

  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll for a random Minecraft reward")
    .addStringOption(option =>
      option
        .setName("minecraft_username")
        .setDescription("Your Minecraft username")
        .setRequired(true)
    ),

  // ====================================================
  // /ip
  // ====================================================

  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Show Haven MC server IP"),

  // ====================================================
  // /ig
  // ====================================================

  new SlashCommandBuilder()
    .setName("ig")
    .setDescription("Open Samosa Bhaiya Instagram")
].map(command => command.toJSON());

// ======================================================
// REGISTER COMMANDS
// ======================================================

const rest = new REST({
  version: "10"
}).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log("✅ Slash commands registered!");
  } catch (error) {
    console.error(
      "❌ Command registration error:",
      error
    );
  }
}

// ======================================================
// BOT READY
// ======================================================

client.once("ready", async () => {
  console.log(
    `Logged in as ${client.user.tag}`
  );

  await registerCommands();
});

// ======================================================
// MESSAGE COINS
// ======================================================

client.on("messageCreate", async message => {

  if (message.author.bot) {
    return;
  }

  const userId = message.author.id;

  const oldCoins = coins.get(userId) || 0;

  const newCoins = oldCoins + 2;

  coins.set(
    userId,
    newCoins
  );

  saveCoins();

  // ----------------------------------------------------
  // MILESTONE
  // ----------------------------------------------------

  const oldMilestone =
    Math.floor(oldCoins / 70);

  const newMilestone =
    Math.floor(newCoins / 70);

  if (newMilestone > oldMilestone) {

    await message.channel.send(
      `🪙 **${message.author} reached ${newMilestone * 70} Coins!**\n` +
      `💰 Current Balance: **${newCoins} Coins**`
    );
  }
});

// ======================================================
// INTERACTION HANDLER
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const userId = interaction.user.id;

    // ==================================================
    // /c
    // ==================================================

    if (interaction.commandName === "c") {

      const balance =
        coins.get(userId) || 0;

      const embed =
        new EmbedBuilder()
          .setTitle("🪙 Your Coins")
          .setDescription(
            `💰 Your current balance is **${balance} Coins**.`
          )
          .setColor(0xFFD700);

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // ==================================================
    // /addcoins
    // ==================================================

    if (
      interaction.commandName === "addcoins"
    ) {

      // ------------------------------------------------
      // ADMIN CHECK
      // ------------------------------------------------

      if (
        !interaction.memberPermissions ||
        !interaction.memberPermissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {

        return interaction.reply({
          content:
            "❌ You don't have permission to use this command.",
          ephemeral: true
        });
      }

      // ------------------------------------------------
      // GET USER
      // ------------------------------------------------

      const user =
        interaction.options.getUser("user");

      // ------------------------------------------------
      // GET AMOUNT
      // ------------------------------------------------

      const amount =
        interaction.options.getInteger("amount");

      if (!user) {
        return interaction.reply({
          content: "❌ User not found.",
          ephemeral: true
        });
      }

      if (!amount || amount < 1) {
        return interaction.reply({
          content:
            "❌ Amount must be at least 1.",
          ephemeral: true
        });
      }

      // ------------------------------------------------
      // ADD COINS
      // ------------------------------------------------

      const oldCoins =
        coins.get(user.id) || 0;

      const newCoins =
        oldCoins + amount;

      coins.set(
        user.id,
        newCoins
      );

      saveCoins();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return interaction.reply({
        content:
          `✅ Added **${amount} Coins** to ${user}!\n` +
          `🪙 New Balance: **${newCoins} Coins**`
      });
    }

    // ==================================================
    // /ip
    // ==================================================

    if (
      interaction.commandName === "ip"
    ) {

      const embed =
        new EmbedBuilder()
          .setTitle("🎮 Haven MC")
          .setDescription(
            "🟢 **Java Edition**\n" +
            "`havenmc.skyraincloud.fun`\n\n" +

            "📱 **Bedrock Edition**\n" +
            "`havenmc.skyraincloud.fun`\n\n" +

            "🔌 **Bedrock Port**\n" +
            "`19144`"
          )
          .setFooter({
            text: "Haven MC • Join & Enjoy!"
          })
          .setColor(0x8B5CF6);

      return interaction.reply({
        embeds: [embed]
      });
    }

    // ==================================================
    // /ig
    // ==================================================

    if (
      interaction.commandName === "ig"
    ) {

      const instagramButton =
        new ButtonBuilder()
          .setLabel("Open Instagram")
          .setEmoji("📸")
          .setStyle(ButtonStyle.Link)
          .setURL(
            "https://www.instagram.com/samosa_bhaiya7"
          );

      const row =
        new ActionRowBuilder()
          .addComponents(
            instagramButton
          );

      const embed =
        new EmbedBuilder()
          .setTitle("📸 Samosa Bhaiya")
          .setDescription(
            "Follow on Instagram! 💗\n\n" +
            "Click the button below to open my Instagram."
          )
          .setColor(0xE1306C);

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // ==================================================
    // /roll
    // ==================================================

    if (
      interaction.commandName === "roll"
    ) {

      // ------------------------------------------------
      // CURRENT BALANCE
      // ------------------------------------------------

      const balance =
        coins.get(userId) || 0;

      // ------------------------------------------------
      // MINECRAFT USERNAME
      // ------------------------------------------------

      const minecraftUsername =
        interaction.options.getString(
          "minecraft_username"
        );

      // ------------------------------------------------
      // CHECK COINS
      // ------------------------------------------------

      if (balance < 100) {

        return interaction.reply({
          content:
            `❌ You need **100 Coins** to roll!\n` +
            `💰 Your balance: **${balance} Coins**`,
          ephemeral: true
        });
      }

      // ------------------------------------------------
      // REMOVE 100 COINS
      // ------------------------------------------------

      const remainingAfterRoll =
        balance - 100;

      coins.set(
        userId,
        remainingAfterRoll
      );

      saveCoins();

      // ------------------------------------------------
      // START EMBED
      // ------------------------------------------------

      const startEmbed =
        new EmbedBuilder()
          .setTitle("🎰 ROLLING...")
          .setDescription(
            `👤 **Discord:** ${interaction.user.username}\n` +
            `⛏️ **Minecraft:** ${minecraftUsername}\n\n` +
            `🎰 **Spinning...**\n` +
            `🎁 ➡️ ❓ ➡️ ❓\n\n` +
            `🪙 **Remaining Coins:** ${remainingAfterRoll}`
          )
          .setColor(0x8B5CF6);

      await interaction.reply({
        embeds: [startEmbed]
      });

      // ------------------------------------------------
      // ANIMATION
      // ------------------------------------------------

      for (
        let i = 0;
        i < animationFrames.length;
        i++
      ) {

        await new Promise(resolve =>
          setTimeout(
            resolve,
            350
          )
        );

        const animationEmbed =
          new EmbedBuilder()
            .setTitle("🎰 ROLLING...")
            .setDescription(
              `👤 **Discord:** ${interaction.user.username}\n` +
              `⛏️ **Minecraft:** ${minecraftUsername}\n\n` +
              `🎰 **Spinning...**\n` +
              `${animationFrames[i]}\n\n` +
              `🪙 **Remaining Coins:** ${remainingAfterRoll}`
            )
            .setColor(0x8B5CF6);

        await interaction.editReply({
          embeds: [animationEmbed]
        });
      }

      // ------------------------------------------------
      // FINAL REWARD
      // ------------------------------------------------

      const reward =
        getReward();

      const finalEmbed =
        new EmbedBuilder()
          .setTitle("🎉 ROLL COMPLETE!")
          .setDescription(
            `👤 **Discord:** ${interaction.user.username}\n` +
            `⛏️ **Minecraft:** ${minecraftUsername}\n\n` +
            `🎁 **Reward:** ${reward.name}\n` +
            `💎 **Rarity:** ${reward.rarity}\n\n` +
            `🪙 **Remaining Coins:** ${remainingAfterRoll}`
          )
          .setThumbnail(
            reward.image
          )
          .setFooter({
            text:
              "The Heroes SMP • Reward must be given manually"
          })
          .setColor(0x8B5CF6);

      await interaction.editReply({
        content:
          `🎰 **${interaction.user.username} rolled!**`,
        embeds: [finalEmbed]
      });
    }
  }
);

// ======================================================
// SAVE ON SHUTDOWN
// ======================================================

process.on(
  "SIGINT",
  () => {

    console.log(
      "Saving coins before shutdown..."
    );

    saveCoins();

    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  () => {

    console.log(
      "Saving coins before shutdown..."
    );

    saveCoins();

    process.exit(0);
  }
);

// ======================================================
// RENDER WEB SERVER
// ======================================================

const PORT =
  process.env.PORT || 3000;

http
  .createServer((req, res) => {

    res.writeHead(
      200,
      {
        "Content-Type":
          "text/plain"
      }
    );

    res.end(
      "Haven MC Bot is online!"
    );
  })
  .listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `🌐 Web server running on port ${PORT}`
      );
    }
  );

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");

// =========================
// BOT SETTINGS
// =========================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// COIN STORAGE
// =========================

const COINS_FILE = "./coins.json";

let coins = new Map();

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

      console.log("Coins loaded successfully!");
    } else {
      console.log("No coins.json found. Starting fresh.");
    }
  } catch (error) {
    console.error("Failed to load coins:", error);
  }
}

function saveCoins() {
  try {
    const data = Object.fromEntries(coins);

    fs.writeFileSync(
      COINS_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("Failed to save coins:", error);
  }
}

loadCoins();

// =========================
// REWARDS
// =========================

const rewards = [
  {
    name: "Totem of Undying ×1",
    rarity: "Rare",
    chance: 20,
    image: "https://minecraft.wiki/images/Totem_of_Undying_JE2_BE2.png"
  },
  {
    name: "Golden Apple ×32",
    rarity: "Uncommon",
    chance: 25,
    image: "https://minecraft.wiki/images/Golden_Apple_JE2_BE2.png"
  },
  {
    name: "Enchanted Golden Apple ×1",
    rarity: "Epic",
    chance: 10,
    image: "https://minecraft.wiki/images/Enchanted_Golden_Apple_JE2_BE2.png"
  },
  {
    name: "1 Day Fly",
    rarity: "Legendary",
    chance: 5,
    image: "https://minecraft.wiki/images/Feather_JE2_BE2.png"
  },
  {
    name: "$50,000 Money",
    rarity: "Legendary",
    chance: 5,
    image: "https://minecraft.wiki/images/Gold_Ingot_JE4_BE2.png"
  },
  {
    name: "Netherite Ingot ×1",
    rarity: "Rare",
    chance: 15,
    image: "https://minecraft.wiki/images/Netherite_Ingot_JE2_BE1.png"
  },
  {
    name: "Nothing — Try Again Your Luck!",
    rarity: "Common",
    chance: 20,
    image: "https://minecraft.wiki/images/Barrier_JE2_BE2.png"
  }
];

// =========================
// RANDOM REWARD
// =========================

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

// =========================
// SLASH COMMANDS
// =========================

const commands = [

  // /c
  new SlashCommandBuilder()
    .setName("c")
    .setDescription("Check your Coins"),

  // /addcoins
  new SlashCommandBuilder()
    .setName("addcoins")
    .setDescription("Add coins to a user (Admin only)")
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

  // /roll
  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll for a random Minecraft reward")
    .addStringOption(option =>
      option
        .setName("minecraft_username")
        .setDescription("Your Minecraft username")
        .setRequired(true)
    )

].map(command => command.toJSON());

// =========================
// REGISTER COMMANDS
// =========================

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

    console.log("Slash commands registered!");

  } catch (error) {
    console.error("Command registration error:", error);
  }
}

// =========================
// BOT READY
// =========================

client.once("ready", async () => {

  console.log(
    `Logged in as ${client.user.tag}`
  );

  await registerCommands();

});

// =========================
// MESSAGE COINS
// =========================

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  const userId = message.author.id;

  const oldCoins =
    coins.get(userId) || 0;

  const newCoins =
    oldCoins + 2;

  coins.set(
    userId,
    newCoins
  );

  saveCoins();

  // Notification every 70 coins

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

// =========================
// COMMAND HANDLER
// =========================

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const userId =
    interaction.user.id;

  // =========================
  // /c
  // =========================

  if (interaction.commandName === "c") {

    const balance =
      coins.get(userId) || 0;

    const embed = new EmbedBuilder()
      .setTitle("🪙 Your Coins")
      .setDescription(
        `You currently have **${balance} Coins**.`
      )
      .setColor(0xFFD700);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  }

  // =========================
  // /addcoins
  // =========================

  if (interaction.commandName === "addcoins") {

    // Admin only

    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has("Administrator")
    ) {

      return interaction.reply({
        content:
          "❌ You don't have permission to use this command!",
        ephemeral: true
      });

    }

    const user =
      interaction.options.getUser("user");

    const amount =
      interaction.options.getInteger("amount");

    const oldCoins =
      coins.get(user.id) || 0;

    const newCoins =
      oldCoins + amount;

    coins.set(
      user.id,
      newCoins
    );

    saveCoins();

    return interaction.reply({
      content:
        `✅ Added **${amount} Coins** to ${user}!\n` +
        `🪙 New Balance: **${newCoins} Coins**`
    });

  }

  // =========================
  // /roll
  // =========================

  if (interaction.commandName === "roll") {

    const balance =
      coins.get(userId) || 0;

    const username =
      interaction.options.getString(
        "minecraft_username"
      );

    // Need 100 coins

    if (balance < 100) {

      return interaction.reply({
        content:
          `❌ You need **100 Coins** to roll!\n` +
          `🪙 Your balance: **${balance} Coins**`,
        ephemeral: true
      });

    }

    // Remove 100 coins

    coins.set(
      userId,
      balance - 100
    );

    saveCoins();

    // Spin

    await interaction.reply(
      `🎰 **SPINNING...**\n\n` +
      `🪵 ➜ 🍎 ➜ 💎 ➜ 🔥 ➜ 🟣 ➜ 💰 ➜ ❓`
    );

    // 2.5 second animation

    await new Promise(
      resolve =>
        setTimeout(resolve, 2500)
    );

    const reward =
      getReward();

    const remaining =
      coins.get(userId);

    // Result

    const embed = new EmbedBuilder()
      .setTitle("🎉 ROLL COMPLETE!")
      .setDescription(
        `👤 **Minecraft:** ${username}\n\n` +
        `🎁 **Reward:** ${reward.name}\n` +
        `✨ **Rarity:** ${reward.rarity}\n\n` +
        `🪙 **Remaining Coins:** ${remaining}`
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

      embeds: [embed]

    });

  }

});

// =========================
// SAVE ON SHUTDOWN
// =========================

process.on("SIGINT", () => {

  saveCoins();

  process.exit(0);

});

process.on("SIGTERM", () => {

  saveCoins();

  process.exit(0);

});

// =========================
// LOGIN
// =========================

client.login(TOKEN);

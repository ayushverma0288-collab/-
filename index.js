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
// PERSISTENT COIN STORAGE
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

  new SlashCommandBuilder()
    .setName("c")
    .setDescription("Check your Coins"),

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

    console.log("

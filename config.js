const dotenv = require('dotenv');
dotenv.config();

const prefix = '!';

const config = {
  prefix,
  unknownCommand: `I am having trouble understanding your command. Run \`${prefix} help\` if you need guidance for my activities.`,
  token: process.env.BOT_TOKEN,
  gameAPIURL: 'https://api.igdb.com/v4',
  gameAPIAuthToken: process.env.GAME_API_AUTHORIZATION_TOKEN,
  gameAPIClientID: process.env.GAME_API_CLIENT_ID,
  movieAPIAuthToken: process.env.MOVIE_READ_ACCESS_TOKEN,
  movieAPIURL: process.env.MOVIE_API_URL,
  developer: process.env.DEVELOPER_DISCORD_ID,
};

module.exports = config;

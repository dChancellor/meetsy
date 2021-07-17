const {
  prefix,
  gameAPIAuthToken,
  gameAPIClientID,
  gameAPIURL,
  developer,
} = require("../config");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const errorHandler = require("../errorHandler");

let numberOfAttempts = 0;

module.exports = {
  name: "game",
  properName: "Game",
  type: "game",
  description:
    "The `game` command mashes up multiple games for a fun creative thought prompt. \n The default values are 2 games with over an 80 rating. \n \n Separate arguments with a comma.",
  args: {
    required: false,
    number: 0,
    list: [
      "number(2-4)",
      "minimum-rating(0-100)",
      "maximum-rating(0-100)",
      "minimum-date(1987-07-02)",
      "maximum-date(1987-07-02)",
    ],
  },
  usage: `For example: \`${prefix} game number=2, minimum-rating=80\``,
  aliases: ["game", "games", "video games"],
  async execute(message, args) {
    let games = [];
    const { filter, numberOfGames, error } = parseArgs(args);
    if (error) return errorHandler(message, error);
    // Loading message
    message.channel.send(
      `*Mashing up ${numberOfGames} games for ${message.author.username}...*`
    );
    // Gets games
    while (games.length < numberOfGames) {
      const { data: game, error } = await getGame(
        filter,
        Math.ceil(Math.random() * 5000)
      );
      if (error) return errorHandler(message, error);
      games.push(game);
    }
    // Gets covers and creates embeds for each game
    for (let i = 0; i < games.length; i++) {
      const { embed, error } = await createEmbed(games[i]);
      if (error) return errorHandler(message, error);
      message.channel.send(embed);
      if (!i % 2) message.channel.send(">>> ***vs***");
    }
  },
};

const createEmbed = async (game) => {
  let { data: cover, error } = await getCover(game.cover);
  if (error) return { error };
  const embed = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`${game.name}`)
    .setURL(`${game.url}`)
    .setImage(`https://${cover}`)
    .setDescription(
      `${game.summary.replace(/(\r\n|\n|\r)/gm, "").slice(0, 1024)}`
    )
    .setTimestamp()
    .setFooter("Courtesy of IGDB");
  return { embed };
};

const getCover = async (coverID) => {
  return fetch(`${gameAPIURL}/covers`, {
    method: "post",
    body: `fields url; \n where id = ${coverID};`,
    headers: {
      Authorization: gameAPIAuthToken,
      "Client-ID": gameAPIClientID,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then(([json]) => {
      if (!json.url)
        throw "There was some problem with the image url. This may be a problem with that specific game - try running again.";
      return {
        data: json.url
          .slice(2, json.url.length)
          .replace("t_thumb", "t_cover_big"),
      };
    })
    .catch((error) => {
      return { error };
    });
};

const getGame = async (filter, randomizer) => {
  let game = await fetch(`${gameAPIURL}/games`, {
    method: "post",
    body: `fields name, cover, summary, url, first_release_date; \n limit 1; \n offset ${randomizer}; \n ${filter};`,
    headers: {
      Authorization: gameAPIAuthToken,
      "Client-ID": gameAPIClientID,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.length > 0 && res[0].status === 400)
        throw "There might be something wrong with your arguments. Check your syntax and try again.";
      // If game is found, return the game
      if (res.length > 0) return { data: res[0] };
      // If game is not found, run this function again but reducing the randomizer by half
      numberOfAttempts += 1;
      if (numberOfAttempts > 20)
        throw `Something went terribly wrong and we are stuck in a loop. Check your parameters or contact ${developer}`;
      return getGame(filter, Math.ceil(randomizer / 2));
    })
    .catch((error) => {
      return { error };
    });
  return game;
};

const parseArgs = (args) => {
  let filter = `where `;
  let numberOfGames = 2;
  let splitArgs = args.length > 0 ? args[0].split(", ") : args;
  try {
    splitArgs.forEach((arg) => {
      // Handles incorrect syntax
      if (!arg.includes("="))
        throw `Your argument should be in the format of "x"="y" \n For example: \`number=3\``;
      //Splits parameter and input
      const [parameter, input] = arg.split("=");
      //Sets number of games requested
      if (parameter === "number") {
        if (2 > input > 4)
          throw "Due to rate limiting, please enter a number between 2 and 4 for the number of games.";
        return (numberOfGames = input);
      }
      //Translates the parameter to the endpoint for the API
      filter += reducer(parameter, input);
      filter += " & ";
    });
  } catch (error) {
    return { error };
  }
  if (!filter.includes("aggregated_rating")) filter += "aggregated_rating > 80";
  filter += " & total_rating_count > 20";
  if (filter.endsWith(" & ")) filter = filter.slice(0, filter.length - 3);
  return { filter, numberOfGames };
};

const reducer = (parameter, input) => {
  switch (parameter) {
    case "minimum-rating":
      if (input < 0) input = 0;
      if (input > 100) input = 100;
      return `total_rating > ${input}`;
    case "maximum-rating":
      if (input < 0) input = 0;
      if (input > 100) input = 100;
      return `total_rating < ${input}`;
    case "minimum-date":
      return `first_release_date > ${Date.parse(input) / 1000}`;
    case "maximum-date":
      return `first_release_date < ${Date.parse(input) / 1000}`;
    default:
  }
};

const {
  prefix,
  movieAPIAuthToken,
  movieAPIURL,
  personAPIURL,
  developer
} = require("../config");
const Discord = require("discord.js");

const fetch = require("node-fetch");

let numberOfAttempts = 0;

module.exports = {
  name: "movie",
  properName: "Movie",
  type: "movie",
  description:
    "The `movie` command mashes up multiple movies for a fun creative thought prompt. \n \n The default values are 2 movies with over a 7 TMDB rating. \n \n Separate arguments with a comma.",
  args: {
    required: false,
    number: 0,
    list: [
      "number(2-4)",
      "minimum-rating(0-10)",
      "maximum-rating(0-10)",
      "year(2020)",
      "minimum-date(1987-07-02)",
      "maximum-date(1987-07-02)",
      "with-person(1461) - this is the TMDB person ID number",
    ],
  },
  usage: `For example: \`${prefix} movie with-person=Keanu Reeves, number=2, minimum-rating=7\``,
  aliases: ["movie", "movies"],
  async execute(message, args) {
    let movies = [];
    const { filter, numberOfMovies, error } = await parseArgs(args);
    if (error) return errorHandler(message, error);
    // Loading message
    message.channel.send(
      `*Mashing up ${numberOfMovies} movies for ${message.author.username}...*`
    );
    // Gets movies
    while (movies.length < numberOfMovies) {
      let { movie, error } = await getMovie(
        filter,
        Math.ceil(Math.random() * 500)
      );
      if (error) return errorHandler(message, error);
      movies.push(movie);
    }
    // Gets covers and creates embeds for each game
    for (let i = 0; i < movies.length; i++) {
      const embed = await createEmbed(movies[i]);
      message.channel.send(embed);
      if (!i % 2) message.channel.send(">>> ***vs***");
    }
  },
};

const createEmbed = async (movie) => {
  return new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`${movie.original_title}`)
    .setURL(`https://www.themoviedb.org/movie/${movie.id}`)
    .setImage(`https://www.themoviedb.org/t/p/w1280/${movie.poster_path}`)
    .setDescription(`${movie.overview.slice(0, 1024)}`)
    .setTimestamp()
    .setFooter("Courtesy of TMDB");
};

const getMovie = async (filter, randomizer) => {
  let url = movieAPIURL.replace("page=1", `page=${randomizer}`);
  url += filter;
  return fetch(url, {
    method: "get",
    headers: {
      Authorization: movieAPIAuthToken,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      numberOfAttempts += 1;
      if (numberOfAttempts > 20)
        throw `Something went terribly wrong and we are stuck in a loop. Check your parameters and contact ${developer}`;
      if (json.total_pages === 0)
        throw "No results found - something went wrong with the Movie API call. Check your parameters";
      if (json.results?.length > 0)
        return {
          movie: json.results[Math.floor(Math.random() * json.results.length)],
        };
      return getMovie(filter, Math.ceil(Math.random() * json.total_pages));
    })
    .catch((error) => {
      return { error };
    });
};

const parseArgs = async (args) => {
  let filter = "";
  let numberOfMovies = 2;
  console.log(args);
  let splitArgs = args.length > 0 ? args[0].split(", ") : args;
  try {
    for (let i = 0; i < splitArgs.length; i++) {
      // Handles incorrect syntax
      if (!splitArgs[i].includes("="))
        throw `Your argument should be in the format of x=y \n For example: \`number=3\``;
      //Splits parameter and input
      const [parameter, input] = splitArgs[i].split("=");
      //Sets number of games requested
      if (parameter === "number") {
        if (2 > input > 4)
          throw "Due to rate limiting, please enter a number between 2 and 4 for the number of movies.";
        return (numberOfMovies = input);
      }
      //Translates the parameter to the endpoint for the API
      let { data, error } = await reducer(parameter, input);
      if (error) throw error;
      filter += data;
    }
  } catch (error) {
    return { error };
  }
  if (!filter.includes("vote_average.gte=")) filter += "&vote_average.gte=7";
  return { filter, numberOfMovies };
};

const reducer = async (parameter, input) => {
  switch (parameter) {
    case "minimum-rating":
      if (input < 0) input = 0;
      if (input > 10) input = 10;
      return { data: `&vote_average.gte=${input}` };
    case "maximum-rating":
      if (input < 0) input = 0;
      if (input > 10) input = 10;
      return { data: `&vote_average.lte=${input}` };
    case "year":
      return { data: `&primary_release_year=${input}` };
    case "minimum-date":
      return { data: `&primary_release_date.gte=${input}` };
    case "maximum-date":
      return { data: `&primary_release_date.lte=${input}` };
    case "with-person":
      input = input.replace(" ", "+");
      const { id, error } = await getPersonID(input);
      if (error)
        return { error: "Something happened while looking up the person" };
      return { data: `&with_people=${id}` };
    default:
      return {
        error: `Something bad happened while parsing ${paremeter}=${input}`,
      };
  }
};

const getPersonID = async (name) => {
  let url = personAPIURL;
  url += `&query=${name}`;
  return fetch(url, {
    method: "get",
    headers: {
      Authorization: movieAPIAuthToken,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.total_pages === 0) {
        throw "No results found - something went wrong with the Person API call. Check your parameters";
      }
      return { id: json.results[0].id };
    })
    .catch((error) => {
      return { error };
    });
};

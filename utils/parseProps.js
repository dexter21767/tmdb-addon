const urlExists = require("url-exists");

function parseCertification(release_dates, language) {
  return release_dates.results.filter(
    (releases) => releases.iso_3166_1 == language.split("-")[1]
  )[0].release_dates[0].certification;
}

function parseCast(credits) {
  return credits.cast.slice(0, 4).map((el) => {
    return el.name;
  });
}

function parseDirector(credits) {
  return credits.crew
    .filter((x) => x.job === "Director")
    .map((el) => {
      return el.name;
    });
}

function parseWriter(credits) {
  return credits.crew
    .filter((x) => x.job === "Writer")
    .map((el) => {
      return el.name;
    });
}

function parseSlug(type, title, imdb_id) {
  return `${type}/${title.toLowerCase().replace(/ /g, "-")}-${imdb_id ? imdb_id.replace("tt", "") : ""
    }`;
}

function parseTrailers(videos) {
  return videos.results
    .filter((el) => el.site === "YouTube")
    .filter((el) => el.type === "Trailer")
    .map((el) => {
      return {
        source: `${el.key}`,
        type: `${el.type}`,
      };
    });
}

function parseTrailerStream(videos) {
  return videos.results
    .filter((el) => el.site === "YouTube")
    .filter((el) => el.type === "Trailer")
    .map((el) => {
      return {
        title: `${el.name}`,
        ytId: `${el.key}`,
      };
    });
}

function parseImdbLink(vote_average, imdb_id) {
  return {
    name: vote_average.toFixed(1),
    category: "imdb",
    url: `https://imdb.com/title/${imdb_id}`,
  };
}

function parseShareLink(title, imdb_id, type) {
  return {
    name: title,
    category: "share",
    url: `https://www.strem.io/s/${parseSlug(type, title, imdb_id)}`,
  };
}

function parseGenreLink(genres, type, language) {
  return genres.map((genre) => {
    return {
      name: genre.name,
      category: "Genres",
      url: `stremio:///discover/${encodeURIComponent(
        process.env.HOST_NAME
      )}%2F${language}%2Fmanifest.json/${type}/tmdb.top?genre=${encodeURIComponent(
        genre.name
      )}`,
    };
  });
}

function parseCreditsLink(credits) {
  const Cast = parseCast(credits).map((actor) => {
    return {
      name: actor,
      category: "Cast",
      url: `stremio:///search?search=${encodeURIComponent(actor)}`,
    };
  });
  const Director = parseDirector(credits).map((director) => {
    return {
      name: director,
      category: "Directors",
      url: `stremio:///search?search=${encodeURIComponent(director)}`,
    };
  });
  const Writer = parseWriter(credits).map((writer) => {
    return {
      name: writer,
      category: "Writers",
      url: `stremio:///search?search=${encodeURIComponent(writer)}`,
    };
  });
  return new Array(...Cast, ...Director, ...Writer);
}

function parseCoutry(production_countries) {
  return production_countries.map((country) => country.name).join(", ");
}

function parseGenres(genres) {
  return genres.map((el) => {
    return el.name;
  });
}

function parseYear(status, first_air_date, last_air_date) {
  if (status === "Ended") {
    return first_air_date && last_air_date
      ? first_air_date.substr(0, 5) + last_air_date.substr(0, 4)
      : "";
  } else {
    return first_air_date ? first_air_date.substr(0, 5) : "";
  }
}

function parseRunTime(runtime) {
  if (runtime === 0 || !runtime) {
    return "";
  }
  
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (runtime > 60) {
    return hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`;
  } else {
    return `${runtime}min`;
  }
}

function parseCreatedBy(created_by) {
  return created_by.map((el) => el.name);
}

function parseConfig(catalogChoices) {
  let config = {}
  try {
    config = JSON.parse(catalogChoices);
  } catch (e) {
    if (catalogChoices) {
      // reverse compatibility for old version of config
      config.language = catalogChoices;
    }
  }
  return config;
}

async function parsePoster(type, id, poster, language, rpdbkey) {
  const tmdbImage = `https://image.tmdb.org/t/p/w500${poster}`
  if (rpdbkey) {
    const rpdbImage = getRpdbPoster(type, id, language, rpdbkey)
    return await checkIfExists(rpdbImage) ? rpdbImage : tmdbImage;
  }
  return tmdbImage;
}

function getRpdbPoster(type, id, language, rpdbkey) {
  const tier = rpdbkey.split("-")[0]
  const lang = language.split("-")[0]
  if (tier === "t1" || lang === "en") {
    return `https://api.ratingposterdb.com/${rpdbkey}/tmdb/poster-default/${type}-${id}.jpg?fallback=true`
  } else {
    return `https://api.ratingposterdb.com/${rpdbkey}/tmdb/poster-default/${type}-${id}.jpg?fallback=true&lang=${lang}`
  }
}

async function checkIfExists(rpdbImage) {
  return new Promise((resolve) => {
    urlExists(rpdbImage, (err, exists) => {
      if (exists) {
        resolve(true)
      } else {
        resolve(false);
      }
    })
  });
}

module.exports = {
  parseCertification,
  parseCast,
  parseDirector,
  parseSlug,
  parseWriter,
  parseTrailers,
  parseTrailerStream,
  parseImdbLink,
  parseShareLink,
  parseGenreLink,
  parseCreditsLink,
  parseCoutry,
  parseGenres,
  parseYear,
  parseRunTime,
  parseCreatedBy,
  parseConfig,
  parsePoster,
  getRpdbPoster,
  checkIfExists
};

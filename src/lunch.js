// TODO: Be even more theatrical about the choice

const fs = require('fs');

const printUsage = () => {
  process.stdout.write('Select the next place you should go for lunch given that you provide a database of restaurants.\n\n');
  process.stdout.write('Usage: ./pick-lunch databaseFile [prevChoicesFile] [--options] [--flags] [--help] [--[customflag]|--no-[customflag]]\n\n');
  process.stdout.write('  --flags   Print all available restaurant flags\n');
  process.stdout.write('  --help    Print this help\n');
  process.stdout.write('  --ignored Print all ignored restaurant options\n');
  process.stdout.write('  --options Print all considered restaurant options\n');
  process.stdout.write('  --quick   You do not like games\n');
  process.stdout.write('\n');
  process.stdout.write('All other arguments starting with double dash "--" will be interpreted as filtering flags for the restaurants. All flags are case InSensItIvE.\n');
  process.stdout.write('\n');
  process.stdout.write('Example: If your database contains restaurants with flag fastfood and you want to go to fastfood today, you can provide --fastfood flag. If you want to avoid fast food today, you can provide --no-fastfood flag.\n');
};

const describeRestaurant = (restaurant) => {
  process.stdout.write(restaurant.name);
  if (restaurant.flags && restaurant.flags.length > 0) {
    const flags = restaurant.flags.map(flag => '#' + flag);
    process.stdout.write(' | ');
    process.stdout.write(flags.join(' '));
  }
  process.stdout.write('\n');
};

const extractArgsFlag = (args, argName) => {
  const argIndex = args.indexOf(argName);

  if (argIndex !== -1) {
    args.splice(argIndex, 1);
    return true;
  }

  return false;
};

const filterRestaurantsByFlags = flags => restaurant => flags.every((flag) => {
  const flagInverse = flag.indexOf('--no-') === 0;
  const flagValue = flag.substr(flagInverse ? 5 : 2).toLowerCase();
  const flagIndex = restaurant.flags.findIndex(restFlag => restFlag.toLowerCase() === flagValue);
  return flagInverse ? flagIndex === -1 : flagIndex !== -1;
});

const filterRestaurantsByLastChoices = prevResults => restaurant =>
  prevResults[prevResults.length - 1].name !== restaurant.name;

const filterUnique = (value, index, self) => self.indexOf(value) === index;

const getRandomItem = items => items[Math.floor(Math.random() * items.length)];

const getShuffleIterations = quick => quick ? 1 : Math.floor((Math.random() * 3000) + 500);

const printRestaurant = (restaurant, loader = null) => {
  const message = loader ?
    `${loader}${restaurant}` :
    `You should go to: ${restaurant} \n`;

  process.stdout.cursorTo(0);
  process.stdout.clearLine();
  process.stdout.write(message);
};

const rememberChoice = (prevResultsFile, prevResults, restaurantName, rememberChoices) => {
  if (!prevResultsFile) {
    return;
  }

  let lastChoices = prevResults.slice();
  lastChoices.push({
    name: restaurantName,
    date: (new Date()).toISOString(),
  });

  if (lastChoices.length > rememberChoices) {
    lastChoices = lastChoices.slice(-1 * rememberChoices);
  }

  fs.writeFileSync(prevResultsFile, JSON.stringify(lastChoices));
};

const shuffle = (items, maxIterations, onFinish) => {
  const maxTimeout = 1000;
  let dotCounter = 0;
  let restaurant = '';
  let loader = 'Thinking about .';

  const getTimeout = (iterations, currentIteration) => {
    const timeoutQuotient = iterations - currentIteration < 10 ?
      1 / (iterations - currentIteration) :
      0.001;
    return parseInt(maxTimeout * (currentIteration / iterations) * timeoutQuotient);
  };

  const shuffleRestaurants = (items, iterations, currentIteration, onFinish) => {
    setTimeout(() => {
      restaurant = getRandomItem(items).name;
      if (currentIteration < iterations) {
        shuffleRestaurants(items, iterations, currentIteration + 1, onFinish);
      } else {
        onFinish();
      }
    }, getTimeout(iterations, currentIteration));
  };

  const incrementDot = () => {
    const loaderIndex = dotCounter % 3;
    if (loaderIndex === 0) {
      loader = 'Thinking about .   ';
    } else if (loaderIndex === 1) {
      loader = 'Thinking about ..  ';
    } else {
      loader = 'Thinking about ... ';
    }

    dotCounter ++;
  };

  const printRestaurantInternal = () => printRestaurant(restaurant, loader);

  const dotTimer = setInterval(incrementDot, 200);
  const foodTimer = setInterval(printRestaurantInternal, 50);
  shuffleRestaurants(items, maxIterations, 0, () => {
    clearInterval(dotTimer);
    clearInterval(foodTimer);
    onFinish(restaurant);
  });
};

const main = () => {
  // Remove interpreter and command name from args
  const args = process.argv.slice(2);

  const printFlags = extractArgsFlag(args, '--flags');
  const printHelp = extractArgsFlag(args, '--help');
  const printIgnored = extractArgsFlag(args, '--ignored');
  const printOptions = extractArgsFlag(args, '--options');
  const shouldHurry = extractArgsFlag(args, '--quick');

  if (printHelp) {
    printUsage();
    process.exit(0);
  }

  const dbFile = args.shift();
  const prevResultsFile = args.shift();
  const flags = args.slice();

  let dbContent;
  let prevResults = [];
  let restaurants;
  let restaurantsPossible = [];
  let restaurantsIgnored = [];
  let rememberChoices = 100;

  if (!dbFile) {
    process.stdout.write('You must pass database path!\n');
    process.stdout.write('----------------------------\n');
    printUsage();
    process.exit(1);
  }

  try {
    dbContent = fs.readFileSync(dbFile);
  } catch(e) {
    console.error(e);
    process.exit(2);
  }

  try {
    restaurants = JSON.parse(dbContent);
    dbContent = null;
  } catch(e) {
    console.error(e);
    process.exit(3);
  }

  if (printFlags) {
    restaurants
      .reduce((aggr, restaurant) => restaurant.flags ? aggr.concat(restaurant.flags) : aggr, [])
      .filter(filterUnique)
      .forEach((flag) => {
        process.stdout.write(flag + '\n');
      });

    process.exit(0);
  }

  if (prevResultsFile) {
    try {
      prevResults = JSON.parse(fs.readFileSync(prevResultsFile));
    } catch(e) {
      console.error(e);
      process.exit(4);
    }
  }

  restaurantsPossible = restaurants
    .filter(filterRestaurantsByLastChoices(prevResults))
    .filter(filterRestaurantsByFlags(flags));

  restaurantsIgnored = restaurants.filter(
    restaurant => restaurantsPossible.indexOf(restaurant) === -1
  );

  if (printOptions) {
    restaurantsPossible.forEach(describeRestaurant);
    process.exit(0);
  }

  if (printIgnored) {
    restaurantsIgnored.forEach(describeRestaurant);
    process.exit(0);
  }

  if (restaurantsPossible.length === 0) {
    process.stdout.write('There is left nothing to choose from!\n')
    process.stdout.write('See --options\n')
    process.exit(6);
  }

  if (restaurantsPossible.length === 1) {
    process.stdout.write('There not much to think about, only one restaurant fits the search!\n')
    printRestaurant(restaurantsPossible[0].name);
    process.exit(0);
  }

  shuffle(restaurantsPossible, getShuffleIterations(shouldHurry), (restaurant) => {
    rememberChoice(prevResultsFile, prevResults, restaurant, rememberChoices);
    printRestaurant(restaurant);
  });
};

// ---

main();

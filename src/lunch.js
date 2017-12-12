// TODO: Select flags on command line and filter restaurants
// TODO: Be even more theatrical about the choice
// TODO: Remember last choices, so you don't eat the same thing two days

const fs = require('fs');

const getRandomItem = items => items[Math.floor(Math.random() * items.length)];

const printRestaurant = (restaurant, loader = null) => {
  const message = loader ?
    `${loader}${restaurant}` :
    `You should go to: ${restaurant} \n`;

  process.stdout.cursorTo(0);
  process.stdout.clearLine();
  process.stdout.write(message);
};

const shuffle = (items, onFinish) => {
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
  shuffleRestaurants(items, 5000, 0, () => {
    clearInterval(dotTimer);
    clearInterval(foodTimer);
    onFinish(restaurant);
  });
};

const dbFile = process.argv[2];
let dbContent;
let restaurants;

if (!dbFile) {
  process.stdout.write('You must pass database path.\n');
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

shuffle(restaurants, (restaurant) => {
  printRestaurant(restaurant);
});

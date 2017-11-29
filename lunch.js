// TODO: Select flags on command line and filter restaurants
// TODO: Read database from file
// TODO: Be even more theatrical about the choice
// TODO: Remember last choices, so you don't eat the same thing two days

const restaurants = [
  {
    name: 'McDonalds',
    flags: ['mall', 'fastFood', 'takeAway'],
  },
  {
    name: 'KFC',
    flags: ['mall', 'fastFood', 'takeAway'],
  },
  {
    name: 'Safir',
    flags: ['mall', 'takeAway'],
  },
  {
    name: 'Burrito Loco',
    flags: ['fastFood', 'takeAway'],
  },
  {
    name: 'Vidličky a nože',
    flags: [],
  },
  {
    name: 'Restaurant Kořenského',
    flags: ['burger']
  },
  {
    name: 'Restaurace U svatého Filipa a Jakuba',
    flags: [],
  },
  {
    name: 'Restaurace Ananta',
    flags: ['vegan'],
  },
  {
    name: 'Loving Hut',
    flags: ['mall', 'vegan'],
  },
  {
    name: 'Restaurace Andělský újezd',
    flags: ['fastFood', 'asia'],
  }
];

const maxTimeout = 1000;
let dotCounter = 0;
let restaurant = '';
let loader = '';

const getRandomItem = items => items[Math.floor(Math.random() * items.length)];

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

const printRestaurant = (withoutLoader) => {
  const message = withoutLoader ?
    `You should go to: ${restaurant} \n`:
    `${loader}${restaurant}`;

  process.stdout.cursorTo(0);
  process.stdout.clearLine();
  process.stdout.write(message);
};

const shuffle = (items, onFinish) => {
  const dotTimer = setInterval(incrementDot, 200);
  const foodTimer = setInterval(printRestaurant, 50);
  shuffleRestaurants(items, 5000, 0, () => {
    clearInterval(dotTimer);
    clearInterval(foodTimer);
    onFinish();
  });
};

shuffle(restaurants, () => {
  printRestaurant(true);
});

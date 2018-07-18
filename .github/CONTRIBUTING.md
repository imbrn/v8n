# Contributing to v8n

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)

## Development Setup

You will need [Node.js](http://nodejs.org) **version 6+**.

After cloning the repo, run:

``` bash
$ npm install # or yarn
```

If you use `npm` please do not commit the npm-lockfile. Keeping a lockfile for `yarn` and `npm` is not great to manage as versions may differ. ``package-lock.json`` is not specifically ignored, so please just do not add it to your commits.

### Important NPM scripts

``` bash
# build scripts in dist
$ npm run build

# lint the code using eslint
$ npm run lint

# run unit tests using jest
$ npm test
```

There are some other scripts available in the `scripts` section of the `package.json` file.

When commiting the unit tests will be run automatically.

## Project Structure

- **`src`**: contains all of v8n's core

  - `src/v8n.js`: v8n in it's entirety

  - `src/v8n.test.js`: all the tests for v8n

- **`dist`**: contains built files for distribution

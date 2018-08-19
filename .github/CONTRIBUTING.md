# Contributing to v8n

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)

## Development Setup

You will need [Node.js](http://nodejs.org) **version 6+**.

After cloning the repo, run:

```bash
$ npm install # or yarn
```

### Important NPM scripts

```bash
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
  - `v8n.js`: module entry file which exports the `v8n` function
  - `v8n.test.js`: all the tests for v8n
- **`dist`**: contains built files for distribution

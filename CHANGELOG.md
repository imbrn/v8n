# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- New logo for the README.
- Refactored tests for better debugging.

### Fixed

- Add SSH keys to CircleCI config.
- Various quirks with the README.
- API docs for `some` and `every`.

## [1.1.2] - 2018-07-26

### Changed

- Refactored length and range based rules.

### Fixed

- Issue with `schema()` not validation at deeper levels properly.

## [1.1.1] - 2018-07-25

### Added

- Git config in CircleCI configuration file.

### Changed

- Moved VuePress to dependencies from devDependencies.

### Fixed

- Make `deploy-docs.sh` properly executable for CircleCI.
- A variety of spelling mistakes in the documentation.

## [1.1.0] - 2018-07-25

### Added

- Ability to receive all validation errors for a value with `testAll()`.
- Ability to create and test asynchronous rules with `testAsync()`.
- Rule `object()` to check whether a value is an object.
- Rule `schema()` to validate the schema of an object.
- Modifier `some` to verify that at least one value in an array passes a rule.
- Modifier `every` to verify that all values in an array pass a rule.
- Contributing guidelines for better collaboration.

### Changed

- Made `ValidationException` inherit from JavaScript's built-in `Error`.
- Now using classes for many things in the codebase.
- Rewrote documentation and moved it from the README to a website using VuePress.
- Refactored a variety of core functionalities (especially how modifiers are applied).
- Made the validation objects immutable.

### Fixed

- Build process now properly transpiles modules from ES6 to ES5. (#44)

[unreleased]: https://github.com/imbrn/v8n/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/imbrn/v8n/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/imbrn/v8n/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/imbrn/v8n/compare/v0.0.1...v1.1.0

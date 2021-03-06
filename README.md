# group-dependencies
[![CircleCI](https://circleci.com/gh/itsthatguy/group-dependencies/tree/master.svg?style=svg)](https://circleci.com/gh/itsthatguy/group-dependencies/tree/master) [![npm version](https://badge.fury.io/js/group-dependencies.svg)](https://badge.fury.io/js/group-dependencies)


With group-dependencies, you can group your dependencies in different batches. For exmaple, you can have a "buildDependencies" or "lintDependencies". This is very useful when you don't need to install all the dependencies for a certain task. Using this you can save a lot of time in CI.

For example, put build dependencies in a separate property, `buildDependencies`, and install only those packages as needed, by adding to `"scripts": { "heroku-postbuild": deps install build" }` to your `package.json`.

## Installation

You need to install this package globally, if you want to use it on a clean directory:
```
npm install @aminya/group-dependencies -g
```

## Usage

First, add a new dependencies group to `package.json`:
```js
{
  ...
  "devDependencies": {
    "intercept-stdout": "^0.1.2",
    "jest": "^20.0.4",
    "strip-color": "^0.1.0"
  },
  // our new group representing testing dependencies
  "testDependencies": [
    "jest"
  ]
  ...
}
```

Now you can install _only_ the dependencies for this new group:

```shell
# This will install jest@^20.0.4:
deps install test
```

### Command
```shell
# Install dependencies in the named group
deps install [GROUP_NAME]
```

## Why

**npm** gives you two groups to specify dependencies (i.e. dev and prod).
In the real world, we have multiple dependency environments (e.g. test, build,
production, development).

### How it works

Any item added to the `[GROUP_NAME]Dependencies` property will be installed with
`deps install [GROUP_NAME]`. If a matching package is found in `devDependencies` or `dependencies`,
that version will be installed.

```js
// Here's the part that matters.
"buildDependencies": [
  "webpack",
  "@babel/preset-env"
]
```

The decision to use this strategy, with an array, was made so that we can
leverage a few things.
1. In your development environment, let `npm` manage installing your dev dependencies.
2. You only need to manage package versions in one location, reducing the overhead.

Behind the scenes, it makes a new package.json, and then uses that for installation. Once the installation is done, it restores the original package.json.

It is also capable of using group-specific lock files, which can speed up the installation process.

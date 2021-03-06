require('colors');
var fs = require('fs');
var path = require('path');
var runCommand = require('./runCommand');
const fileIt = require("file-it");

const warnMsg = ['deps', 'warn'.yellow, 'resolve'.magenta].join(' ');
const infoMsg = ['deps', 'info'.green, 'resolve'.magenta].join(' ');

module.exports = function (script, group) {
  if (script !== 'install') {
    console.log("There's only one command: `deps install [GROUP_NAME]`");
    return 1;
  }

  if (!group || !group.length) {
    console.log("Please specify a group: `deps install [GROUP_NAME]`");
    return 1;
  }

  const APP_ROOT = fs.realpathSync(process.cwd());

  function resolveApp (relativePath) {
    return path.resolve(APP_ROOT, relativePath);
  }

  const appPkgPath = resolveApp('package.json');
  const appPkgPathBackup = resolveApp('package.json.original');
  const appPkgLockPath = resolveApp('package-lock.json');
  const appPkgLockPathBackup = resolveApp('package-lock.json.original');
  const appPkgLockPathGroup =  resolveApp(`package-lock.json.${group}`);

  var pkgJson = require(appPkgPath);

  const groupDependencies = pkgJson[group + 'Dependencies'];
  const dependencies = pkgJson.dependencies;
  const devDependencies = pkgJson.devDependencies;

  if (!groupDependencies) {
    console.log(`No ${group}Dependencies found.`);
    return 0;
  }

  let devDependenciesKeys = []
  let dependenciesKeys = []
  if (devDependencies) { // if the package has devDependencies
    devDependenciesKeys = Object.keys(devDependencies)
  }
  if (dependencies) {// if the package has dependencies
    dependenciesKeys = Object.keys(dependencies)
  }

  let toInstall = [];

  for (const gDep of groupDependencies) {
    // the entry in gDep is a dependency
    if (dependenciesKeys.includes(gDep)) {
      toInstall.push(installFromObject(dependencies, gDep))
    }
    // the entry in gDep is a devDependency
    else if (devDependenciesKeys.includes(gDep)) {
      toInstall.push(installFromObject(devDependencies, gDep))
    }
    // the entry is not found
    else {
      // install the latest
      toInstall.push(installLatest(gDep))
    }
  }

  console.log(`deps ${'cmd'.green} npm install ${toInstall.join(' ')}`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

  preparePkgJSON(pkgJson, appPkgPath, appPkgPathBackup)
  preparePkgLockJSON(appPkgLockPath, appPkgLockPathBackup, appPkgLockPathGroup)
  runCommand(npmCmd, ['install', ...toInstall], group);
  restorePkgJSON(appPkgPath, appPkgPathBackup)
  restorePkgLockJSON(appPkgLockPath, appPkgLockPathBackup, appPkgLockPathGroup)
  return 0;
};

// installs gDep based the given obj
function installFromObject(obj, gDep) {
  const version = obj[gDep];
  const installCommand = `${gDep}@${version}`
  console.log(`${infoMsg} ${installCommand}`);
  return installCommand
}

// installs the latest gDep
function installLatest(gDep) {
  const installCommand = `${gDep}`
  console.log(`${warnMsg} ${installCommand} not found: installing latest`);
  return installCommand
}

// backs up the original package.json and replaces it with a package.json with no dependencies and devDependencies
function preparePkgJSON(pkgJson, appPkgPath, appPkgPathBackup) {
  fs.copyFileSync(appPkgPath, appPkgPathBackup)
  fs.unlinkSync(appPkgPath)
  pkgJson.dependencies = {}
  pkgJson.devDependencies = {}
  fileIt.writeJsonFileSync(appPkgPath, pkgJson)
}

// restore the original package.json
function restorePkgJSON(appPkgPath, appPkgPathBackup) {
  fs.unlinkSync(appPkgPath)
  fs.copyFileSync(appPkgPathBackup, appPkgPath)
  fs.unlinkSync(appPkgPathBackup)
}

// backs up package-lock.json and restores the package-lock.json.group if it exists
function preparePkgLockJSON(appPkgLockPath, appPkgLockPathBackup, appPkgLockPathGroup) {
  fs.copyFileSync(appPkgLockPath, appPkgLockPathBackup)
  fs.unlinkSync(appPkgLockPath)
  if (fs.existsSync(appPkgLockPathGroup)) {
    fs.copyFileSync(appPkgLockPathGroup, appPkgLockPath)
  }
}

// restores the original package-lock.json and also backs up the package-lock.json.group
function restorePkgLockJSON(appPkgLockPath, appPkgLockPathBackup, appPkgLockPathGroup) {
  fs.copyFileSync(appPkgLockPath, appPkgLockPathGroup)
  fs.unlinkSync(appPkgLockPath)
  fs.copyFileSync(appPkgLockPathBackup, appPkgLockPath)
  fs.unlinkSync(appPkgLockPathBackup)
}

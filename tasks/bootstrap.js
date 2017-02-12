const path = require('path');
const utils = require('./utils');
const envs = require('../env.json');

const log = console.log;

const packages = Object.keys(envs).reduce((packages, name) => {
  return packages.concat(envs[name]);
}, []);

packages.forEach(pkg => {
  const dest = path.resolve(__dirname, `../node_modules/${pkg}`);
  log(`Download & extract ${pkg}`);
  utils.downloadPackage(pkg, dest);
});


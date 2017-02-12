const path = require('path');
const shell = require('shelljs');
const utils = require('./utils');
const envs = require('../env.json');
const env = utils.getCLIArgs()['_'][0];
const packages = envs[env];

packages.forEach(pkg => {
  const dest = path.resolve(__dirname, `../node_modules/${pkg}`);
  shell.cd(dest);
  shell.exec('npm link');
  shell.exec(`lerna exec --concurrency 1 -- npm link ${pkg.split('@')[0]}`);
});

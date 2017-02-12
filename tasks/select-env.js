const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const utils = require('./utils');
const envs = require('../env.json');
const env = utils.getCLIArgs()['_'][0];
const packages = envs[env];
const rootDir = path.resolve(__dirname, '..');

packages.forEach(pkg => {
  const dest = path.resolve(rootDir, `node_modules/${pkg}`);

  shell.cd(dest);
  shell.exec('npm link');
  shell.cd(rootDir);
  shell.exec(`./node_modules/.bin/lerna exec --concurrency 1 -- npm link ${pkg.split('@')[0]}`);
});

fs.writeFileSync(path.resolve(__dirname, '../.env'), env, 'utf-8');

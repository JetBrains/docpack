const parseArgs = require('minimist');
const shell = require('shelljs');

exports.downloadPackage = function(pkg, dest) {
  const parts = pkg.split('@');
  const name = parts[0];
  const version = !parts[1]
    ? shell.exec(`npm show ${name} version`, {silent: true}).stdout
    : parts[1];
  const filename = `${name}-${version}.tgz`;
  const destination = dest || `${name}@${version}`;

  shell.mkdir('-p', destination);
  shell.exec(`curl --silent --remote-name "https://registry.npmjs.org/${name}/-/${filename}"`);
  shell.exec(`tar xzf "${filename}" --strip-components 1 -C "${destination}"`);
  shell.rm(filename);
};

exports.getCLIArgs = function () {
  return parseArgs(process.argv.slice(2));
};

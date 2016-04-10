function isBuilt(module) { return module.resource && module.built; }
function getResource(module) { return module.resource; }
function setTrue(acc, key) { acc[key] = true; return acc; }

/**
 * @param {Compilation} compilation
 * @returns {Array<string>}
 */
function findAffectedFiles(compilation) {
  var affectedFiles = compilation.modules
    .filter(isBuilt)
    .map(getResource)
    .reduce(setTrue, {});

  var seen = {};

  function findAffected(module) {
    if (seen[module.resource]) return;
    seen[module.resource] = true;

    if (affectedFiles[module.resource] || !module.dependencies || !module.resource)
      return;

    module.dependencies.forEach(function (dep) {
      if (!dep.module) return;

      findAffected(dep.module);

      if (affectedFiles[dep.module.resource]) {
        affectedFiles[module.resource] = true;
      }
    });
  }

  compilation.modules.forEach(findAffected);

  return Object.keys(affectedFiles);
}

module.exports = findAffectedFiles;
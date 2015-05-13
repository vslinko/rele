import mergeArrays from './mergeArrays';

export function collectArgs(args) {
  return args.args.reduce((acc, arg) => {
    acc[arg.key] = arg.value;
    return acc;
  }, {});
}

export function collectFields(klass) {
  const fields = {};

  function recursive(klass) {
    if (fields[klass.name]) {
      fields[klass.name] = mergeArrays(field[klass.name], klass.block.fields);
    } else {
      fields[klass.name] = klass.block.fields;
    }

    klass.block.includes.forEach(include => recursive(include.class));
  }

  recursive(klass);

  return fields;
}

export function collectInclude(klass) {
  const root = {};

  function recursive(klass) {
    klass.block.includes.forEach(i => {
      root[i.name] = recursive(i.class);
    });
  }

  recursive(klass);

  return root;
}

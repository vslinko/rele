import mergeArrays from './mergeArrays';

export function collectArgs(args) {
  return args.args.reduce((acc, arg) => {
    acc[arg.key] = arg.value;
    return acc;
  }, {});
}

export function collectFields(cls) {
  const fields = {};

  function recursive(cls) {
    if (fields[cls.name]) {
      fields[cls.name] = mergeArrays(field[cls.name], cls.block.fields);
    } else {
      fields[cls.name] = cls.block.fields;
    }

    cls.block.includes.forEach(include => recursive(include.class));
  }

  recursive(cls);

  return fields;
}

export function collectInclude(cls) {
  const root = {};

  function recursive(cls) {
    cls.block.includes.forEach(i => {
      root[i.name] = recursive(i.class);
    });
  }

  recursive(cls);

  return root;
}

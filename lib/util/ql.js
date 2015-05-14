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
      fields[cls.name] = mergeArrays(['id', 'type'], cls.block.fields);
    }

    cls.block.includes.forEach(include => {
      fields[cls.name] = mergeArrays(fields[cls.name], [include.name]);
      recursive(include.class);
    });
  }

  recursive(cls);

  return fields;
}

export function collectInclude(cls) {
  let include = [];

  function recursive(cls, prefix) {
    cls.block.includes.forEach(i => {
      include = mergeArrays(include, [`${prefix}${i.name}`]);
      recursive(i.class, `${prefix}${i.name}.`);
    });
  }

  recursive(cls, '');

  return include;
}

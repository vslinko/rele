export default function print(ast, prefix = '') {
  let query = '';

  switch (ast.type) {
    case 'include':
      query += ast.name;
      if (ast.class.name) {
        query += ': ';
      } else {
        query += ' ';
      }
      query += print(ast.class, prefix);
      break;
    case 'block':
      prefix = prefix + '  ';
      query += '{\n';
      query += prefix;
      query += ast.fields
        .concat(ast.includes.map(i => print(i, prefix)))
        .concat(ast.classes.map(c => print(c, prefix)))
        .join(',\n' + prefix);
      query += '\n';
      prefix = prefix.slice(0, prefix.length - 2);
      query += prefix;
      query += '}';
      break;
    case 'class':
      if (ast.name) {
        query += ast.name;
        query += ' ';
      }
      query += print(ast.block, prefix);
      break;
    case 'call':
      query += ast.name;
      query += print(ast.args, prefix);
      if (ast.class.name) {
        query += ': ';
      } else {
        query += ' ';
      }
      query += print(ast.class, prefix);
      break;
    case 'args':
      query += '(';
      query += ast.args.map(a => print(a, prefix)).join(', ');
      query += ')';
      break;
    case 'arg':
      query += ast.key;
      query += ': ';
      query += JSON.stringify(ast.value);
      break;
    default:
      throw new Error();
  }

  return query;
}

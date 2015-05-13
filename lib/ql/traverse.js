export default function traverse(ast, callback, parent) {
  if (ast) {
    switch (ast.type) {
      case 'arg':
        break;
      case 'class':
        ast.block = traverse(ast.block, callback, ast);
        break;
      case 'args':
        ast.args = ast.args.map(arg => traverse(arg, callback, ast));
        break;
      case 'call':
        ast.args = traverse(ast.args, callback, ast);
        ast.class = traverse(ast.class, callback, ast);
        break;
      case 'include':
        ast.class = traverse(ast.class, callback, ast);
        break;
      case 'block':
        ast.includes = ast.includes.map(include => traverse(include, callback, ast));
        ast.classes = ast.classes.map(klass => traverse(klass, callback, ast));
        ast.calls = ast.calls.map(call => traverse(call, callback, ast));
        break;
      default:
        break;
    }
    ast = callback(ast, parent);
  }
  return ast;
}

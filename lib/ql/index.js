import tokenize from './tokenize';
import parse from './parse';
import optimize from './optimize';
import traverse from './traverse';

export function rawql({raw}, ...args) {
  const tokens = tokenize(raw);
  const ast = parse(tokens, args);

  return ast;
}

export function ql({raw}, ...args) {
  const tokens = tokenize(raw);
  const ast = optimize(parse(tokens, args));

  return function(params) {
    return traverse(ast, function(node) {
      if (node.type === 'param') {
        return params[node.name];
      }

      return node;
    });
  };
}

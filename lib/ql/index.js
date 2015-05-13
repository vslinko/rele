import tokenize from './tokenize';
import parse from './parse';
import optimize from './optimize';

export function rawql({raw}, ...args) {
  const tokens = tokenize(raw);
  const ast = parse(tokens, args);

  return ast;
}

export function ql({raw}, ...args) {
  const tokens = tokenize(raw);
  const ast = optimize(parse(tokens, args));

  return ast;
}

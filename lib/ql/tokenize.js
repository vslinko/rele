function isAlfa(char) {
  if (typeof char !== 'string') return false;

  const code = char.toLowerCase().charCodeAt(0);

  return code >= 97 && code <= 122;
}

function* reader(parts) {
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    for (let j = 0; j < part.length; j++) {
      yield part[j];
    }
    if (i < parts.length - 1) {
      yield BREAK;
    }
  }
}

const BREAK = {};

export default function tokenize(parts) {
  const tokens = [];
  const r = reader(parts);
  let char;

  function readNextChar() {
    let {done, value} = r.next();
    char = done ? null : value;
  }

  function readWord() {
    const token = ['word', char];

    while(true) {
      readNextChar();
      if (!isAlfa(char)) break;
      token[1] += char;
    }

    return token;
  }

  readNextChar();
  while (true) {
    if (char === ' ' || char === '\n') {
      readNextChar();
      continue;
    } else if (isAlfa(char)) {
      tokens.push(readWord());
    } else if (char === BREAK) {
      tokens.push(['BREAK']);
      readNextChar();
    } else if (char === '{' || char === '}' || char === ',' || char === '(' || char === ')' || char === ':') {
      tokens.push([char]);
      readNextChar();
    } else if (!char) {
      break;
    } else {
      throw new Error(`Unknown token "${char}" in query "${parts.join('').trim()}"`);
    }
  }

  return tokens;
}

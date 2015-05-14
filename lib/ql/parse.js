export default function parse(tokens, args) {
  let token;

  function nextToken() {
    token = tokens.shift();
  }

  function checkType(type) {
    return token && token[0] === type;
  }

  function assertType(type) {
    if (!checkType(type)) {
      throw new Error(`Unexpected token "${token && token[0] || 'END'}", expected ${type}`);
    }
  }

  function readWord() {
    assertType('word');
    const word = token[1];
    nextToken();
    return word;
  }

  function readClassName() {
    let name = readWord();

    while (!checkType('{')) {
      if (checkType(':')) {
        name += readChar(':');
      } else {
        name += readWord();
      }
    }

    if (name[0].toUpperCase() !== name[0]) {
      throw new Error(`Class name should start from capital letter "${name}"`);
    }

    return name;
  }

  function readChar(char) {
    assertType(char);
    nextToken();
    return char;
  }

  function readField() {
    const name = readWord();
    return {type: 'field', name};
  }

  function readInclude() {
    const name = readWord();
    const cls = readAnonClass();
    return {type: 'include', name, class: cls};
  }

  function readPropety() {
    if (checkType('BREAK')) {
      const property = args.shift();
      if (property.type !== 'class') {
        throw new Error(`Impossible injection "${property}"`);
      }
      nextToken();
      return property;
    } else if (tokens[0] && tokens[0][0] === ':') {
      return readInclude();
    } else if (tokens[0] && tokens[0][0] === '{') {
      assertType('word');
      if (token[1][0].toUpperCase() === token[1][0]) {
        return readClass();
      } else {
        return readInclude();
      }
    } else if (tokens[0] && tokens[0][0] === '(') {
      return readCall();
    } else {
      return readField();
    }
  }

  function readProperties() {
    const properties = [];

    while (!checkType('}')) {
      properties.push(readPropety());

      if (checkType(',')) {
        readChar(',');
      }
    }

    return properties;
  }

  function readBlock() {
    readChar('{');
    const properties = readProperties();
    readChar('}');

    let fields = [];
    let includes = [];
    let classes = [];
    let calls = [];

    properties.forEach(property => {
      if (property.type === 'field') {
        fields.push(property.name);
      } else if (property.type === 'include') {
        includes.push(property);
      } else if (property.type === 'class') {
        classes.push(property);
      } else if (property.type === 'call') {
        calls.push(property);
      } else {
        throw new Error('You should never see this error');
      }
    });

    return {type: 'block', fields, includes, classes, calls};
  }

  function readArg() {
    const key = readWord();
    readChar(':');
    assertType('BREAK');
    const value = args.shift();
    nextToken();
    return {type: 'arg', key, value};
  }

  function readArgs() {
    const args = [];

    readChar('(');

    while (!checkType(')')) {
      args.push(readArg());
      if (checkType(',')) {
        readChar(',');
      }
    }

    readChar(')');

    return {type: 'args', args};
  }

  function readAnonClass() {
    let name = null;

    if (checkType(':')) {
      readChar(':');
      name = readClassName();
    }

    const block = readBlock();

    return {type: 'class', name, block};
  }

  function readCall() {
    const name = readWord();
    const args = readArgs();
    const cls = readAnonClass();
    return {type: 'call', name, args, class: cls};
  }

  function readClass() {
    const name = readClassName();
    const block = readBlock();
    return {type: 'class', name, block};
  }

  function readExpression() {
    if (tokens[0] && tokens[0][0] === '(') {
      return readCall();
    } else {
      return readClass();
    }
  }

  nextToken();
  return readExpression();
}

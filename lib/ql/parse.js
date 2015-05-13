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
      throw new Error();
    }
  }

  function readWord() {
    assertType('word');
    const word = token[1];
    nextToken();
    return word;
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
    const klass = readAnonClass();
    return {type: 'include', name, class: klass};
  }

  function readPropety() {
    if (checkType('BREAK')) {
      const property = args.shift();
      if (property.type !== 'class') {
        throw new Error();
      }
      nextToken();
      return property;
    } else if (tokens[0] && (tokens[0][0] === '{' || tokens[0][0] === ':')) {
      return readInclude();
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
        throw new Error();
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
      name = readWord();
    }

    const block = readBlock();

    return {type: 'class', name, block};
  }

  function readCall() {
    const name = readWord();
    const args = readArgs();
    const klass = readAnonClass();
    return {type: 'call', name, args, class: klass};
  }

  function readClass() {
    const name = readWord();
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

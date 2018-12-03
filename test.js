const test = require('tape');
const fromAsyncIter = require('.');

test('it supports async generator functions that yield sync values', t => {
  async function* asyncGen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const argPairs = [];
  const source = fromAsyncIter(asyncGen());

  let talkback;
  let sendsCompletionSignal;

  source(0, (t, d) => {
    argPairs.push([t, typeof d]);
    if (t === 0) {
      talkback = d;
    }
    if (t === 0 || t === 1) {
      talkback(1);
    }
    if (t === 2 && d == null) {
      sendsCompletionSignal = true;
    }
  });

  setTimeout(() => {
    t.deepEqual(argPairs, [
      [0, 'function'],
      [1, 'number'],
      [1, 'number'],
      [1, 'number'],
      [2, 'undefined'],
    ]);
    t.true(sendsCompletionSignal);
    t.end();
  });
});

test('it supports async generator functions that yield async values', t => {
  async function* asyncGen() {
    yield Promise.resolve(1);
    yield Promise.reject('oops');
    yield Promise.resolve(2);
    yield Promise.resolve(3);
  }
  const argPairs = [];
  const source = fromAsyncIter(asyncGen());

  let talkback;
  let sendsErrorSignal;

  source(0, (t, d) => {
    argPairs.push([t, typeof d]);
    if (t === 0) {
      talkback = d;
    }
    if (t === 0 || t === 1) {
      talkback(1);
    }
    if (t === 2 && d != null) {
      sendsErrorSignal = true;
    }
  });

  setTimeout(() => {
    t.deepEqual(argPairs, [
      [0, 'function'],
      [1, 'number'],
      [2, 'string'],
    ]);
    t.true(sendsErrorSignal);
    t.end();
  });
});

test('it supports async pulls from the sink', t => {
  async function* asyncGen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const argPairs = [];
  const source = fromAsyncIter(asyncGen());

  let talkback;
  let sendsCompletionSignal;

  source(0, (t, d) => {
    argPairs.push([t, typeof d]);
    if (t === 0) {
      talkback = d;
    }
    if (t === 0 || t === 1) {
      setTimeout(() => talkback(1), 100);
    }
    if (t === 2 && d == null) {
      sendsCompletionSignal = true;
    }
  });

  setTimeout(() => {
    t.deepEqual(argPairs, [
      [0, 'function'],
      [1, 'number'],
      [1, 'number'],
      [1, 'number'],
      [2, 'undefined'],
    ]);
    t.true(sendsCompletionSignal);
    t.end();
  }, 450);
});

test('it supports async iterators', t => {
  let n = 0;
  const asyncIterator = {
    next() {
      while (n < 3) {
        return Promise.resolve({ done: false, value: n++ });
      }
      return Promise.resolve({ done: true, value: undefined });
    }
  };

  const argPairs = [];
  const source = fromAsyncIter(asyncIterator);

  let talkback;
  let sendsCompletionSignal;

  source(0, (t, d) => {
    argPairs.push([t, typeof d]);
    if (t === 0) {
      talkback = d;
    }
    if (t === 0 || t === 1) {
      talkback(1);
    }
    if (t === 2 && d == null) {
      sendsCompletionSignal = true;
    }
  });

  setTimeout(() => {
    t.deepEqual(argPairs, [
      [0, 'function'],
      [1, 'number'],
      [1, 'number'],
      [1, 'number'],
      [2, 'undefined'],
    ]);
    t.true(sendsCompletionSignal);
    t.end();
  });
});

test('it stops sending data after the sink terminates the source', t => {
  async function* asyncGen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }

  const source = fromAsyncIter(asyncGen());

  const argPairs = [];
  let sendsCompletionSignal = false;

  let talkback;
  source(0, (t, d) => {
    argPairs.push([t, typeof d]);

    if (t === 0) {
      talkback = d;
      talkback(1);
    }
    if (t === 1) {
      talkback(2); // terminates the source
      talkback(1); // unsuccessfully tries to pull data again
    }
    if (t === 2) {
      sendsCompletionSignal = true;
    }
  });

  setTimeout(() => {
    t.deepEqual(argPairs, [
      [0, 'function'],
      [1, 'number'],
    ]);
    t.false(sendsCompletionSignal);
    t.end();
  });
});

test('it doesnt cause stack overflow when iterating over a huge number of items', t => {
  async function* asyncGen() {
    let n = 0;
    while (n < 100000) {
      yield n++;
    }
  }

  const source = fromAsyncIter(asyncGen());

  let sendsCompletionSignal = false;

  let talkback;
  source(0, (t, d) => {
    if (t === 0) {
      talkback = d;
    }
    if (t === 0 || t === 1) {
      talkback(1);
    }
    if (t === 2 && d == null) {
      sendsCompletionSignal = true;
    }
  });

  setTimeout(() => {
    t.true(sendsCompletionSignal, 'iterates over 100 thousand items without blowing up the stack');
    t.end();
  });
});

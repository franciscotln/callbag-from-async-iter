# callbag-from-async-iter

👜 Converts an async iterable or iterator into a callbag pullable source

`npm install callbag-from-async-iter`

## Example

### Async range from a generator function

```js
const fromAsyncIter = require('callbag-from-async-iter');
const { forEach, pipe } = require('callbag-basics');

async function * asyncRange() {
  let n = 0;
  while (n < 10000) {
    yield Promise.resolve(n++);
  }
}

pipe(
  fromAsyncIter(asyncRange()),
  forEach((x) => {
    console.log(x); // 0, 1, ..., 9999
  })
);
```

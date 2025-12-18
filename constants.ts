export const BASIC_TIMEOUT = `console.log('Start');

setTimeout(() => {
  console.log('Macrotask');
}, 0);

console.log('End');`;

export const PROMISE_MICROTASK = `console.log('Start');

setTimeout(() => {
  console.log('Timeout');
}, 0);

Promise.resolve().then(() => {
  console.log('Microtask');
});

console.log('End');`;

export const COMPLEX_CHAINING = `console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
  Promise.resolve().then(() => {
    console.log('Microtask in Timeout');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('Microtask 1');
  setTimeout(() => {
    console.log('Timeout 2');
  }, 0);
});

Promise.resolve().then(() => {
    console.log('Microtask 2');
});

console.log('End');`;

export const EXAMPLES = [
    { name: '1. Basic setTimeout', code: BASIC_TIMEOUT },
    { name: '2. Promise vs Timeout', code: PROMISE_MICROTASK },
    { name: '3. Complex Chaining', code: COMPLEX_CHAINING },
];

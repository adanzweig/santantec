// test.js

function greet(name) {
  return `Hello, ${name}!`;
}

function add(a, b) {
  return a + b;
}

async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

function square(number) {
  return number * number;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

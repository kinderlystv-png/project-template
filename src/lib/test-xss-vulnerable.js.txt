/**
 * Тестовый файл с XSS уязвимостями для проверки анализатора
 */

// Критическая уязвимость - innerHTML
function displayUserContent(userInput) {
  document.getElementById('content').innerHTML = userInput;
}

// Уязвимость - outerHTML
function replaceElement(newContent) {
  document.getElementById('target').outerHTML = newContent;
}

// Уязвимость - document.write
function writeContent(data) {
  document.write(data);
}

// Уязвимость - insertAdjacentHTML
function insertContent(position, content) {
  element.insertAdjacentHTML(position, content);
}

// Безопасная версия (должна игнорироваться)
function safeDisplayContent(userInput) {
  document.getElementById('content').textContent = escapeHtml(userInput);
}

// Уязвимость с URL параметрами
function displayUrlParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get('name');
  document.getElementById('greeting').innerHTML = `Hello, ${name}!`;
}

// Динамический контент из запроса
function handleRequest(req) {
  const output = `<div>${req.body.message}</div>`;
  return output;
}

export { displayUserContent, replaceElement, writeContent };

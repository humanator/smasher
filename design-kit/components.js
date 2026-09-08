// ABOUTME: Vanilla JS behavior for design-kit components — drawer/modal open-close,
// ABOUTME: focus trapping, and Escape-to-close. No dependencies, no build step.

function toggleListRow(row) {
  const pressed = row.getAttribute('aria-pressed') === 'true';
  row.setAttribute('aria-pressed', String(!pressed));
  row.classList.toggle('is-active', !pressed);
}

function initListRows(root = document) {
  root.querySelectorAll('.list-row-action[role="button"]').forEach((row) => {
    row.addEventListener('click', () => toggleListRow(row));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        row.click();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initListRows();
});

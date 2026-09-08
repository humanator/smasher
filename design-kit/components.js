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

// Dialog behavior shared by drawer and modal (both are overlay + focusable
// panel + trigger, differing only in visual presentation).
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openDialogs = new Map();

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
}

function trapFocus(event, panel) {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(panel);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openDialog(id, trigger) {
  const panel = document.getElementById(id);
  if (!panel) return;
  const overlay = document.querySelector(
    `[data-drawer-overlay="${id}"], [data-modal-overlay="${id}"]`
  );

  panel.hidden = false;
  if (overlay) overlay.hidden = false;

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      closeDialog(id);
    } else {
      trapFocus(event, panel);
    }
  };
  const onOverlayClick = () => closeDialog(id);

  document.addEventListener('keydown', onKeydown);
  if (overlay) overlay.addEventListener('click', onOverlayClick);

  openDialogs.set(id, { trigger, panel, overlay, onKeydown, onOverlayClick });

  const focusable = getFocusableElements(panel);
  (focusable[0] || panel).focus();
}

function closeDialog(id) {
  const entry = openDialogs.get(id);
  if (!entry) return;
  const { trigger, panel, overlay, onKeydown, onOverlayClick } = entry;

  panel.hidden = true;
  if (overlay) overlay.hidden = true;

  document.removeEventListener('keydown', onKeydown);
  if (overlay) overlay.removeEventListener('click', onOverlayClick);

  openDialogs.delete(id);
  if (trigger) trigger.focus();
}

function initDialogTriggers(root = document) {
  root.querySelectorAll('[data-drawer-trigger], [data-modal-trigger]').forEach((trigger) => {
    const id = trigger.dataset.drawerTrigger || trigger.dataset.modalTrigger;
    trigger.addEventListener('click', () => openDialog(id, trigger));
  });
  root.querySelectorAll('[data-drawer-close], [data-modal-close]').forEach((closeButton) => {
    const id = closeButton.dataset.drawerClose || closeButton.dataset.modalClose;
    closeButton.addEventListener('click', () => closeDialog(id));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initListRows();
  initDialogTriggers();
});

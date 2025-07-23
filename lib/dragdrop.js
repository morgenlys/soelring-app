// dragdrop.js – mit festen Wortpositionen und Platzhaltern

let interactionDisabled = false;

const dropzone = document.getElementById("dropzone");
const wordChoices = document.getElementById("wordChoices");
const checkButton = document.getElementById("checkButton");

// generiert ein Wortfeld (oder Platzhalter) am Index
function createWordSlot(word, index) {
  const container = document.createElement("div");
  container.className = "word-slot";
  container.dataset.index = index;

  if (word !== null) {
    const el = document.createElement("span");
    el.className = "word";
    el.textContent = word;
    el.dataset.index = index;

    el.addEventListener("click", () => {
      if (interactionDisabled || el.dataset.locked === "true") return;

      const inDropzone = false;

      const clone = el.cloneNode(true);
      clone.classList.add("animating");
      const rect = el.getBoundingClientRect();
      clone.style.position = "fixed";
      clone.style.left = rect.left + "px";
      clone.style.top = rect.top + "px";
      clone.style.zIndex = 1000;
      clone.style.transition = "all 0.3s ease";
      document.body.appendChild(clone);

      const targetRect = dropzone.getBoundingClientRect();
      const targetX = targetRect.left + 10 + dropzone.children.length * 80;
      const targetY = targetRect.top + 10;

      requestAnimationFrame(() => {
        clone.style.left = `${targetX}px`;
        clone.style.top = `${targetY}px`;
      });

      setTimeout(() => {
        clone.remove();
        el.remove();

        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        container.appendChild(placeholder);

        const newEl = createWordElement(word, true);
        dropzone.appendChild(newEl);
        enableCheckButton();
      }, 300);
    });

    container.appendChild(el);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    container.appendChild(placeholder);
  }

  return container;
}

function createWordElement(word, isInDropzone) {
  const el = document.createElement("span");
  el.className = "word";
  el.textContent = word;
  el.draggable = isInDropzone;

  if (isInDropzone) {
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", word);
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
    });

    el.addEventListener("dragend", (e) => {
      el.classList.remove("dragging");
      const dropzoneRect = dropzone.getBoundingClientRect();
      if (
        e.clientX < dropzoneRect.left ||
        e.clientX > dropzoneRect.right ||
        e.clientY < dropzoneRect.top ||
        e.clientY > dropzoneRect.bottom
      ) {
        const startRect = el.getBoundingClientRect();
        const clone = el.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.zIndex = 1000;
        clone.style.transition = "all 0.3s ease";
        document.body.appendChild(clone);

        el.remove();

        const endRect = wordChoices.getBoundingClientRect();
        const targetX = endRect.left + 10;
        const targetY = endRect.top + 10;

        requestAnimationFrame(() => {
          clone.style.left = `${targetX}px`;
          clone.style.top = `${targetY}px`;
        });

        setTimeout(() => {
          clone.remove();
          const slots = [...wordChoices.children];
          const slot = slots.find(slot =>
            slot.dataset.index &&
            slot.querySelector(".placeholder")
          );
          if (slot) {
            slot.innerHTML = "";
            slot.appendChild(createWordSlot(word, parseInt(slot.dataset.index)).firstChild);
          }
          if (dropzone.children.length === 0) disableCheckButton();
        }, 300);
      }
    });
  }

  return el;
}

function renderWordChoicesWithPlaceholders(words) {
  wordChoices.innerHTML = "";
  words.forEach((word, index) => {
    const slot = createWordSlot(word, index);
    wordChoices.appendChild(slot);
  });
}

function setupDropzoneReordering() {
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;
    const afterElement = getDragAfterElement(dropzone, e.clientX);
    if (afterElement == null) {
      dropzone.appendChild(dragging);
    } else {
      dropzone.insertBefore(dragging, afterElement);
    }
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
  });
}

function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll(".word:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function enableCheckButton() {
  checkButton.disabled = false;
  checkButton.classList.remove("disabled", "green", "red");
}

function disableCheckButton() {
  checkButton.disabled = true;
  checkButton.classList.add("disabled");
  checkButton.classList.remove("green", "red");
}

// Exportierte Funktionen
window.createWordElement = createWordElement;
window.setupDropzoneReordering = setupDropzoneReordering;
window.enableCheckButton = enableCheckButton;
window.disableCheckButton = disableCheckButton;
window.renderWordChoicesWithPlaceholders = renderWordChoicesWithPlaceholders;
window.interactionDisabled = interactionDisabled;

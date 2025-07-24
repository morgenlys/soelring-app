let interactionDisabled = false;

const dropzone = document.getElementById("dropzone");
const wordChoices = document.getElementById("wordChoices");
const checkButton = document.getElementById("checkButton");

function createPlaceholder(rect) {
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";

  const minWidth = 50;
  const minHeight = 40;
  const width = Math.max(rect.width, minWidth);
  const height = Math.max(rect.height, minHeight);

  placeholder.style.display = "inline-block";
  placeholder.style.width = `${width}px`;
  placeholder.style.height = `${height}px`;
  placeholder.style.border = "2px dashed #ccc";
  placeholder.style.borderRadius = "12px";
  placeholder.style.backgroundColor = "#f8f8f8";
  placeholder.style.verticalAlign = "middle";
  placeholder.style.boxSizing = "border-box";

  return placeholder;
}

function createWordElement(word, isInDropzone, index = null) {
  const el = document.createElement("span");
  el.className = "word";
  el.textContent = word;
  el.draggable = isInDropzone;
  el.dataset.word = word;
  if (index !== null) el.dataset.index = index;

  if (isInDropzone) {
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", word);
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");

      const originIndex = el.dataset.originIndex;
      const rect = el.getBoundingClientRect();
      const slot = wordChoices.querySelector(`.word-slot[data-index="${originIndex}"]`);
      if (slot) {
        slot.innerHTML = "";
        slot.appendChild(createPlaceholder(rect));
      }
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
        const index = el.dataset.originIndex;
        el.remove();

        const slot = wordChoices.querySelector(`.word-slot[data-index="${index}"]`);
        slot.innerHTML = "";
        const newEl = createWordElement(word, false, index);
        slot.appendChild(newEl);
        if (dropzone.children.length === 0) disableCheckButton();
      }
    });
  }

  el.addEventListener("mousedown", (e) => {
    if (interactionDisabled || e.button !== 0 || isInDropzone) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragged = false;

    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const index = el.dataset.index;

    const slot = wordChoices.querySelector(`.word-slot[data-index="${index}"]`);
    slot.innerHTML = "";
    slot.appendChild(createPlaceholder(rect));

    const dragClone = el.cloneNode(true);
    dragClone.style.position = "absolute";
    dragClone.style.left = `${rect.left + window.scrollX}px`;
    dragClone.style.top = `${rect.top + window.scrollY}px`;
    dragClone.style.zIndex = 1000;
    dragClone.style.pointerEvents = "none";
    document.body.appendChild(dragClone);

    function moveAt(pageX, pageY) {
      dragClone.style.left = `${pageX - offsetX + window.scrollX}px`;
      dragClone.style.top = `${pageY - offsetY + window.scrollY}px`;
    }

    function onMouseMove(e) {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (!dragged && (dx > 5 || dy > 5)) dragged = true;
      moveAt(e.pageX, e.pageY);
    }

    function onMouseUp(e) {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      dragClone.remove();

      if (!dragged) {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        });
        el.dispatchEvent(clickEvent);
        return;
      }

      const dropRect = dropzone.getBoundingClientRect();
      const inDropzone =
        e.clientX > dropRect.left &&
        e.clientX < dropRect.right &&
        e.clientY > dropRect.top &&
        e.clientY < dropRect.bottom;

      if (inDropzone && !Array.from(dropzone.children).some(child => child.textContent === word)) {
        const newEl = createWordElement(word, true);
        newEl.dataset.originIndex = index;
        dropzone.appendChild(newEl);
        enableCheckButton();
      } else {
        slot.innerHTML = "";
        const resetEl = createWordElement(word, false, index);
        slot.appendChild(resetEl);
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  el.addEventListener("click", () => {
    if (interactionDisabled || el.dataset.locked === "true") return;

    const source = isInDropzone ? dropzone : wordChoices;
    const target = isInDropzone ? wordChoices : dropzone;

    if (!isInDropzone && Array.from(dropzone.children).some(child => child.textContent === word)) return;

    el.dataset.locked = "true";

    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const startX = rect.left + scrollX;
    const startY = rect.top + scrollY;

    const index = isInDropzone ? el.dataset.originIndex : el.dataset.index;

    if (!isInDropzone) {
      const slot = wordChoices.querySelector(`.word-slot[data-index="${index}"]`);
      if (slot) {
        slot.innerHTML = "";
        slot.appendChild(createPlaceholder(rect));
      }
    }

    const clone = el.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = `${startX}px`;
    clone.style.top = `${startY}px`;
    clone.style.zIndex = 999;
    clone.style.transition = "all 300ms ease";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      const targetRect = target.getBoundingClientRect();
      const targetX = targetRect.left + 10 + target.children.length * (rect.width + 10) + scrollX;
      const targetY = targetRect.top + 10 + scrollY;

      clone.style.left = `${targetX}px`;
      clone.style.top = `${targetY}px`;

      el.remove();

      setTimeout(() => {
        clone.remove();

        if (isInDropzone) {
          const slot = wordChoices.querySelector(`.word-slot[data-index="${index}"]`);
          if (slot) {
            slot.innerHTML = "";
            slot.appendChild(createWordElement(word, false, index));
          }
        } else {
          const newEl = createWordElement(word, true);
          newEl.dataset.originIndex = index;
          dropzone.appendChild(newEl);
        }

        if (dropzone.children.length === 0) {
          disableCheckButton();
        } else {
          enableCheckButton();
        }
      }, 300);
    });
  });

  return el;
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

// Export global
window.createWordElement = createWordElement;
window.setupDropzoneReordering = setupDropzoneReordering;
window.enableCheckButton = enableCheckButton;
window.disableCheckButton = disableCheckButton;
window.interactionDisabled = interactionDisabled;

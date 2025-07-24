let interactionDisabled = false;

const dropzone = document.getElementById("dropzone");
const wordChoices = document.getElementById("wordChoices");
const checkButton = document.getElementById("checkButton");

function createPlaceholder(rect) {
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  const width = Math.max(rect.width, 50);
  const height = Math.max(rect.height, 40);
  placeholder.style.width = `${width}px`;
  placeholder.style.height = `${height}px`;
  placeholder.style.margin = getComputedStyle(rect.elementParent).margin;
  return placeholder;
}

function createWordElement(word, isInDropzone, index = null) {
  const el = document.createElement("span");
  el.className = "word";
  el.textContent = word;
  el.draggable = isInDropzone;
  el.dataset.word = word;
  if (index !== null) el.dataset.index = index;

  // DRAG möglich nur in Dropzone
  if (isInDropzone) {
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend", onDragEnd);
  }

  el.addEventListener("mousedown", onMouseDown);
  el.addEventListener("click", onClick);

  return el;

  function onDragStart(e) {
    e.dataTransfer.setData("text/plain", word);
    el.classList.add("dragging");
    const originIndex = el.dataset.originIndex;
    const rect = el.getBoundingClientRect();
    const slot = wordChoices.querySelector(`.word-slot[data-index="${originIndex}"]`);
    if (slot) {
      slot.innerHTML = "";
      slot.appendChild(createPlaceholder({ width: rect.width, height: rect.height, elementParent: slot }));
    }
  }

  function onDragEnd(e) {
    el.classList.remove("dragging");
    const dr = dropzone.getBoundingClientRect();
    if (e.clientX < dr.left || e.clientX > dr.right || e.clientY < dr.top || e.clientY > dr.bottom) {
      const originIndex = el.dataset.originIndex;
      el.remove();
      const slot = wordChoices.querySelector(`.word-slot[data-index="${originIndex}"]`);
      slot.innerHTML = "";
      slot.appendChild(createWordElement(word, false, originIndex));
      if (!dropzone.children.length) disableCheckButton();
    }
  }

  function onMouseDown(e) {
    if (interactionDisabled || e.button !== 0 || isInDropzone) return;
    const startX = e.clientX, startY = e.clientY;
    let dragged = false;

    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const originSlot = wordChoices.querySelector(`.word-slot[data-index="${el.dataset.index}"]`);
    originSlot.innerHTML = "";
    originSlot.appendChild(createPlaceholder({ width: rect.width, height: rect.height, elementParent: originSlot }));

    const clone = el.cloneNode(true);
    clone.style.pointerEvents = "none";
    clone.style.position = "absolute";
    const scrollX = window.scrollX, scrollY = window.scrollY;
    clone.style.left = `${rect.left + scrollX}px`;
    clone.style.top = `${rect.top + scrollY}px`;
    document.body.appendChild(clone);

    function move(e2) {
      if (!dragged && (Math.abs(e2.clientX - startX) > 5 || Math.abs(e2.clientY - startY) > 5)) {
        dragged = true;
      }
      clone.style.left = `${e2.pageX - offsetX}px`;
      clone.style.top = `${e2.pageY - offsetY}px`;
    }

    function up(e2) {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      clone.remove();
      if (!dragged) {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return;
      }
      const dr = dropzone.getBoundingClientRect();
      if (e2.clientX > dr.left && e2.clientX < dr.right && e2.clientY > dr.top && e2.clientY < dr.bottom) {
        const newEl = createWordElement(word, true, el.dataset.index);
        newEl.dataset.originIndex = el.dataset.index;
        dropzone.appendChild(newEl);
        enableCheckButton();
      } else {
        originSlot.innerHTML = "";
        originSlot.appendChild(createWordElement(word, false, el.dataset.index));
      }
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  function onClick(e) {
    if (interactionDisabled || el.dataset.locked === "true") return;
    el.dataset.locked = "true";

    const source = isInDropzone ? dropzone : wordChoices;
    const target = isInDropzone ? wordChoices : dropzone;
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const startX = rect.left + scrollX, startY = rect.top + scrollY;
    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + 10 + target.children.length * (rect.width + 10) + scrollX;
    const targetY = targetRect.top + 10 + scrollY;

    const clone = el.cloneNode(true);
    clone.style.pointerEvents = "none";
    clone.style.position = "absolute";
    clone.style.left = `${startX}px`;
    clone.style.top = `${startY}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.transition = "all 0.3s ease";
    document.body.appendChild(clone);

    const slot = wordChoices.querySelector(`.word-slot[data-index="${el.dataset.index}"]`);
    if (!isInDropzone && slot) {
      slot.innerHTML = "";
      slot.appendChild(createPlaceholder({ width: rect.width, height: rect.height, elementParent: slot }));
    }

    requestAnimationFrame(() => {
      clone.style.left = `${targetX}px`;
      clone.style.top = `${targetY}px`;
    });

    setTimeout(() => {
      clone.remove();
      el.remove();
      if (isInDropzone) {
        const slot2 = wordChoices.querySelector(`.word-slot[data-index="${el.dataset.originIndex}"]`);
        if (slot2) slot2.appendChild(createWordElement(word, false, el.dataset.originIndex));
      } else {
        const newEl = createWordElement(word, true, el.dataset.index);
        newEl.dataset.originIndex = el.dataset.index;
        dropzone.appendChild(newEl);
      }
      if (dropzone.children.length) enableCheckButton(); else disableCheckButton();
    }, 300);
  }
}

function setupDropzoneReordering() {
  dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;
    const after = getDragAfterElement(dropzone, e.clientX);
    if (after) dropzone.insertBefore(dragging, after);
    else dropzone.appendChild(dragging);
  });
  dropzone.addEventListener("drop", e => e.preventDefault());
}

function getDragAfterElement(container, x) {
  const items = [...container.querySelectorAll(".word:not(.dragging)")];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    return (offset < 0 && offset > closest.offset) ? {offset, element: child} : closest;
  }, {offset: Number.NEGATIVE_INFINITY}).element;
}

function enableCheckButton() {
  checkButton.disabled = false;
  checkButton.classList.remove("disabled","red","green");
}

function disableCheckButton() {
  checkButton.disabled = true;
  checkButton.className = "disabled";
}

window.createWordElement = createWordElement;
window.setupDropzoneReordering = setupDropzoneReordering;
window.enableCheckButton = enableCheckButton;
window.disableCheckButton = disableCheckButton;
window.interactionDisabled = interactionDisabled;

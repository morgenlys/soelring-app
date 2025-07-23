function renderTask(task) {
  switch (task.type) {
    case "drag-platt-to-de":
      renderDragPlattToDe(task);
      break;
    default:
      console.error("Unsupported task type:", task.type);
  }
}

function renderDragPlattToDe(task) {
  const sentenceElement = document.getElementById("platt-sentence");
  const wordChoices = document.getElementById("wordChoices");
  const dropzone = document.getElementById("dropzone");
  const feedback = document.getElementById("feedback");
  const checkButton = document.getElementById("checkButton");
  const bottomBar = document.querySelector(".bottom-bar");

  sentenceElement.innerHTML = "";
  wordChoices.innerHTML = "";
  dropzone.innerHTML = "";
  feedback.textContent = "";
  bottomBar.classList.remove("correct", "incorrect");
  checkButton.textContent = "Überprüfen";
  checkButton.className = "disabled";
  checkButton.disabled = true;
  checkButton.style.minWidth = "110px";

  // Glossierte Satzanzeige
  const words = task.question.split(" ");
  task.gloss.forEach((gloss, i) => {
    const span = document.createElement("span");
    span.className = "platt-word";
    span.textContent = words[i].replace(/[.,!?]/g, "");
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = gloss;
    span.appendChild(tooltip);
    sentenceElement.appendChild(span);
  });

  // Wortauswahl
  const shuffled = [...task.correct].sort(() => Math.random() - 0.5);
  shuffled.forEach(word => {
    const el = document.createElement("span");
    el.className = "word";
    el.textContent = word;
    el.draggable = true;

    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", word);
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
    });

    el.addEventListener("click", () => {
      if ([...dropzone.children].some(child => child.textContent === word)) return;
      el.remove();
      const newEl = el.cloneNode(true);
      newEl.classList.add("word");
      dropzone.appendChild(newEl);
      checkButton.classList.remove("disabled");
      checkButton.disabled = false;
    });

    wordChoices.appendChild(el);
  });

  // Dropzone-Verhalten
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
    const word = e.dataTransfer.getData("text/plain");
    if ([...dropzone.children].some(child => child.textContent === word)) return;

    const newEl = document.createElement("span");
    newEl.className = "word";
    newEl.textContent = word;
    dropzone.appendChild(newEl);

    const original = [...wordChoices.children].find(el => el.textContent === word);
    if (original) original.remove();

    checkButton.classList.remove("disabled");
    checkButton.disabled = false;
  });

  checkButton.onclick = () => {
    const userWords = [...dropzone.children].map(el => el.textContent);
    const correctWords = task.correct;

    if (userWords.join(" ") === correctWords.join(" ")) {
      feedback.textContent = "✅ Richtig!";
      bottomBar.classList.remove("incorrect");
      bottomBar.classList.add("correct");
      checkButton.textContent = "Weiter";
      checkButton.classList.remove("red");
      checkButton.classList.add("green");
      checkButton.onclick = () => {
        currentIndex++;
        if (currentIndex < tasks.length) {
          renderTask(tasks[currentIndex]);
        } else {
          sentenceElement.textContent = "🎉 Lektion abgeschlossen!";
          dropzone.innerHTML = "";
          wordChoices.innerHTML = "";
          feedback.textContent = "";
          checkButton.style.display = "none";
        }
      };
    } else {
      feedback.textContent = `❌ Leider falsch. Richtig wäre: ${correctWords.join(" ")}`;
      bottomBar.classList.remove("correct");
      bottomBar.classList.add("incorrect");
      checkButton.textContent = "Weiter";
      checkButton.classList.remove("green");
      checkButton.classList.add("red");
      checkButton.onclick = () => {
        currentIndex++;
        if (currentIndex < tasks.length) {
          renderTask(tasks[currentIndex]);
        } else {
          sentenceElement.textContent = "🎉 Lektion abgeschlossen!";
          dropzone.innerHTML = "";
          wordChoices.innerHTML = "";
          feedback.textContent = "";
          checkButton.style.display = "none";
        }
      };
    }
  };
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

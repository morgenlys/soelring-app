function renderDragPlattToDe(task) {
  const sentenceElement = document.getElementById("platt-sentence");
  const wordChoices = document.getElementById("wordChoices");
  const dropzone = document.getElementById("dropzone");
  const feedback = document.getElementById("feedback");
  const checkButton = document.getElementById("checkButton");
  const bottomBar = document.querySelector(".bottom-bar");

  interactionDisabled = false;

  sentenceElement.innerHTML = "";
  wordChoices.innerHTML = "";
  dropzone.innerHTML = "";
  feedback.textContent = "";
  bottomBar.classList.remove("correct", "incorrect");
  checkButton.textContent = "Überprüfen";
  checkButton.className = "disabled";
  checkButton.disabled = true;

  // Satz und Gloss anzeigen
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

  // Wortbausteine
  const shuffled = [...task.correct].sort(() => Math.random() - 0.5);
  wordChoices.innerHTML = "";
shuffled.forEach((word, index) => {
  const slot = document.createElement("div");
  slot.className = "word-slot";
  slot.dataset.index = index;

  const wordEl = createWordElement(word, false, index);
  slot.appendChild(wordEl);
  wordChoices.appendChild(slot);
});

  // Button Click
  checkButton.onclick = () => {
    const userWords = [...dropzone.children].map(el => el.textContent);
    const correctWords = task.correct;

    interactionDisabled = true;

    if (userWords.join(" ") === correctWords.join(" ")) {
      feedback.textContent = "✅ Richtig!";
      bottomBar.classList.remove("incorrect");
      bottomBar.classList.add("correct");
      checkButton.textContent = "Weiter";
      checkButton.classList.remove("red", "disabled");
      checkButton.classList.add("green");
    } else {
      feedback.textContent = `❌ Leider falsch. Richtig wäre: ${correctWords.join(" ")}`;
      bottomBar.classList.remove("correct");
      bottomBar.classList.add("incorrect");
      checkButton.textContent = "Weiter";
      checkButton.classList.remove("green", "disabled");
      checkButton.classList.add("red");
    }

    checkButton.onclick = () => {
      currentIndex++;
      if (currentIndex < tasks.length) {
        renderTask(tasks[currentIndex]);
      } else {
        sentenceElement.textContent = "🎉 Lektion abgeschlossen!";
        dropzone.innerHTML = "";
        wordChoices.innerHTML = "";
        feedback.textContent = "";
        bottomBar.classList.remove("correct", "incorrect");
        checkButton.style.display = "none";
      }
    };
  };

  // Aktivieren des Drag-and-Drop-Verhaltens
  setupDropzoneReordering();
}

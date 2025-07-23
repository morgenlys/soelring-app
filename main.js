let currentIndex = 0;
let tasks = [];

function renderTask(task) {
  switch (task.type) {
    case "drag-platt-to-de":
      renderDragPlattToDe(task);
      break;
    // zukünftig:
    // case "drag-de-to-platt": renderDragDeToPlatt(task); break;
    // case "textinput": renderTextInput(task); break;
    default:
      console.error("Unbekannter Aufgabentyp:", task.type);
  }
}

// Lade Aufgaben aus JSON-Datei (aktuell Sölring -> Deutsch)
fetch("data/tasks_drag_soelring_to_de.json")
  .then(res => res.json())
  .then(json => {
    tasks = json;
    renderTask(tasks[currentIndex]);
  })
  .catch(err => {
    console.error("Fehler beim Laden der Aufgaben:", err);
    document.getElementById("platt-sentence").textContent = "⚠️ Aufgaben konnten nicht geladen werden.";
  });

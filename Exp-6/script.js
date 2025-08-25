const svg = document.getElementById("drawingArea");
const clearBtn = document.getElementById("clearBtn");

let drawing = false;
let currentPath;

svg.addEventListener("mousedown", (e) => {
  drawing = true;
  const point = getMousePosition(e);
  currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  currentPath.setAttribute("stroke", "blue");
  currentPath.setAttribute("stroke-width", "2");
  currentPath.setAttribute("fill", "none");
  currentPath.setAttribute("d", `M${point.x},${point.y}`);
  svg.appendChild(currentPath);
});

svg.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const point = getMousePosition(e);
  let d = currentPath.getAttribute("d");
  currentPath.setAttribute("d", d + ` L${point.x},${point.y}`);
});

svg.addEventListener("mouseup", () => {
  drawing = false;
});

svg.addEventListener("mouseleave", () => {
  drawing = false;
});

function getMousePosition(e) {
  const rect = svg.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

clearBtn.addEventListener("click", () => {
  svg.innerHTML = "";
});
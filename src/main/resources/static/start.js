document.getElementById("startGameBtn").onclick = () => {
  window.location.href = "game.html";
};
const modal = document.getElementById("rulesModal");
document.getElementById("rulesBtn").onclick = () => {
  modal.style.display = "flex";
};
document.querySelector(".close").onclick = () => {
  modal.style.display = "none";
};
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
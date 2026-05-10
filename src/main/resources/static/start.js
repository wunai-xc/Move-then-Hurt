document.getElementById("startGameBtn").addEventListener("click", () => {
    window.location.href = "game.html";
});

const modal = document.getElementById("rulesModal");
const rulesBtn = document.getElementById("rulesBtn");
const closeSpan = document.getElementsByClassName("close")[0];

rulesBtn.onclick = () => {
    modal.style.display = "block";
};
closeSpan.onclick = () => {
    modal.style.display = "none";
};
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};
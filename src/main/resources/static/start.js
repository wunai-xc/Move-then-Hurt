document.getElementById("startGameBtn").onclick = () => {
    window.location.href = "game.html";
};

const rulesModal = document.getElementById("rulesModal");
document.getElementById("rulesBtn").onclick = () => {
    rulesModal.style.display = "flex";
};

const aboutModal = document.getElementById("aboutModal");
document.getElementById("aboutBtn").onclick = () => {
    aboutModal.style.display = "flex";
};

const closeButtons = document.querySelectorAll(".close");
closeButtons.forEach(btn => {
    btn.onclick = () => {
        rulesModal.style.display = "none";
        aboutModal.style.display = "none";
    };
});

window.onclick = (e) => {
    if (e.target === rulesModal) {
        rulesModal.style.display = "none";
    }
    if (e.target === aboutModal) {
        aboutModal.style.display = "none";
    }
};

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        rulesModal.style.display = "none";
        aboutModal.style.display = "none";
    }
});

let collection = [];

// Dark mode toggle
const darkModeToggle = document.getElementById("darkModeToggle");
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Camera setup
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error("Camera niet beschikbaar:", err));

// Kaart scannen (placeholder)
document.getElementById("capture").addEventListener("click", () => {
  alert("Kaart scannen werkt hier nog als test. Later vullen we AI-herkenning in.");
});

// Filters toepassen
document.getElementById("applyFilters").addEventListener("click", () => {
  const min = parseFloat(document.getElementById("filterMin").value) || 0;
  const max = parseFloat(document.getElementById("filterMax").value) || Infinity;
  const set = document.getElementById("filterSet").value.toLowerCase();
  renderCollection(collection.filter(card => {
    const price = card.average || 0;
    return price >= min && price <= max && (!set || card.set.toLowerCase().includes(set));
  }));
});

// Totaalwaarde berekenen
function calculateTotal() {
  return collection.reduce((sum, card) => sum + ((card.quantity || 1) * (card.average || 0)), 0);
}

// Render collectie
function renderCollection(cards) {
  const list = document.getElementById("cardsList");
  list.innerHTML = "";
  cards.forEach(card => {
    const li = document.createElement("li");
    li.textContent = `${card.name} (${card.set}) x${card.quantity || 1} | Cardmarket: €${card.cardmarket || 0} | TCGPlayer: €${card.tcgplayer || 0} | Gemiddelde: €${card.average || 0}`;
    list.appendChild(li);
  });
  document.getElementById("totalValue").textContent = `Totaalwaarde: €${calculateTotal()}`;
}

// Voor test: voorbeeldkaart toevoegen
collection.push({
  name: "Pikachu",
  set: "Base",
  quantity: 2,
  cardmarket: 5,
  tcgplayer: 6,
  average: 5.5
});

renderCollection(collection);
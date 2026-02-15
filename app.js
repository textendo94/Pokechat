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
  // Voor nu toevoegen via prompt
  const name = prompt("Naam van de kaart:");
  const set = prompt("Set van de kaart:");
  const cardmarket = parseFloat(prompt("Cardmarket prijs (€):")) || 0;
  const tcgplayer = parseFloat(prompt("TCGPlayer prijs (€):")) || 0;
  const quantity = parseInt(prompt("Aantal:")) || 1;
  const average = ((cardmarket + tcgplayer)/2).toFixed(2);

  collection.push({ name, set, cardmarket, tcgplayer, average, quantity });
  renderCollection(collection);
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

// Render collectie + bewerk/verwijder knoppen
function renderCollection(cards) {
  const list = document.getElementById("cardsList");
  list.innerHTML = "";
  cards.forEach((card, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${card.name} (${card.set}) x${card.quantity} | Cardmarket: €${card.cardmarket} | TCGPlayer: €${card.tcgplayer} | Gemiddelde: €${card.average}
      <button onclick="editCard(${index})">✏️</button>
      <button onclick="removeCard(${index})">🗑</button>
    `;
    list.appendChild(li);
  });
  document.getElementById("totalValue").textContent = `Totaalwaarde: €${calculateTotal()}`;
}

// Kaart bewerken
function editCard(index) {
  const card = collection[index];
  card.quantity = parseInt(prompt("Aantal aanpassen:", card.quantity)) || card.quantity;
  renderCollection(collection);
}

// Kaart verwijderen
function removeCard(index) {
  if(confirm(`Weet je zeker dat je ${collection[index].name} wilt verwijderen?`)) {
    collection.splice(index, 1);
    renderCollection(collection);
  }
}

// Voor test: voorbeeldkaart
collection.push({
  name: "Pikachu",
  set: "Base",
  quantity: 2,
  cardmarket: 5,
  tcgplayer: 6,
  average: 5.5
});

renderCollection(collection);

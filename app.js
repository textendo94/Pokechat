let collection = [];

// Achtercamera starten
const video = document.getElementById("camera");

navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => {
  video.srcObject = stream;
})
.catch(() => {
  navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);
});

// Kaart scannen
document.getElementById("capture").addEventListener("click", () => {

  const name = prompt("Naam van de kaart:");
  const set = prompt("Set van de kaart:");
  const cardmarket = parseFloat(prompt("Cardmarket prijs (€):")) || 0;
  const tcgplayer = parseFloat(prompt("TCGPlayer prijs (€):")) || 0;
  const quantity = parseInt(prompt("Aantal:")) || 1;

  const average = ((cardmarket + tcgplayer) / 2).toFixed(2);

  // Gratis online Pokémon kaart afbeelding (placeholder)
  const image = "https://images.pokemontcg.io/base1/4.png";

  collection.push({
    name,
    set,
    cardmarket,
    tcgplayer,
    average,
    quantity,
    image
  });

  renderCollection();
});

// Totaalwaarde berekenen
function calculateTotal() {
  return collection.reduce((sum, card) =>
    sum + (card.quantity * card.average), 0
  );
}

// Kaarten tonen
function renderCollection() {
  const list = document.getElementById("cardsList");
  list.innerHTML = "";

  collection.forEach((card, index) => {

    const li = document.createElement("li");

    li.innerHTML = `
      <img src="${card.image}" width="80" style="vertical-align:middle; margin-right:10px;">
      <b>${card.name}</b> (${card.set}) x${card.quantity}<br>
      Cardmarket: €${card.cardmarket} |
      TCGPlayer: €${card.tcgplayer} |
      Gemiddelde: €${card.average}
      <br>
      <button onclick="editCard(${index})">✏️</button>
      <button onclick="removeCard(${index})">🗑</button>
      <hr>
    `;

    list.appendChild(li);
  });

  document.getElementById("totalValue").textContent =
    "Totaalwaarde: €" + calculateTotal().toFixed(2);
}

// Aantal aanpassen
function editCard(index) {
  const newQuantity = parseInt(prompt("Nieuw aantal:", collection[index].quantity));
  if (!isNaN(newQuantity)) {
    collection[index].quantity = newQuantity;
    renderCollection();
  }
}

// Kaart verwijderen
function removeCard(index) {
  if (confirm("Weet je zeker dat je deze kaart wilt verwijderen?")) {
    collection.splice(index, 1);
    renderCollection();
  }
}

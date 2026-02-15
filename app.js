let collection = JSON.parse(localStorage.getItem("collection")) || [];

const video = document.getElementById("camera");

// Achtercamera
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
.then(stream => video.srcObject = stream)
.catch(() => navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => video.srcObject = stream));

document.getElementById("capture").addEventListener("click", async () => {

  const searchName = prompt("Voer de naam van de Pokémon kaart in:");

  if (!searchName) return;

  // Pokémon TCG API
 const response = await fetch(`/api/search?name=${searchName}*`);


  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    alert("Kaart niet gevonden");
    return;
  }

  const card = data.data[0];

  const name = card.name;
  const set = card.set.name;
  const image = card.images.small;

  const price =
    card.tcgplayer?.prices?.holofoil?.market ||
    card.tcgplayer?.prices?.normal?.market ||
    0;

  collection.push({
    name,
    set,
    price,
    quantity: 1,
    image
  });

  localStorage.setItem("collection", JSON.stringify(collection));

  renderCollection();
});

function calculateTotal() {
  return collection.reduce((sum, card) =>
    sum + (card.quantity * card.price), 0
  );
}

function renderCollection() {

  const list = document.getElementById("cardsList");
  list.innerHTML = "";

  collection.forEach((card, index) => {

    const li = document.createElement("li");

    li.innerHTML = `
      <img src="${card.image}" width="80" style="vertical-align:middle;margin-right:10px;">
      <b>${card.name}</b> (${card.set}) x${card.quantity}<br>
      Marktprijs: €${card.price || 0}
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

function editCard(index) {
  const newQuantity = parseInt(prompt("Nieuw aantal:", collection[index].quantity));
  if (!isNaN(newQuantity)) {
    collection[index].quantity = newQuantity;
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();
  }
}

function removeCard(index) {
  if (confirm("Weet je zeker dat je deze kaart wilt verwijderen?")) {
    collection.splice(index, 1);
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();
  }
}

renderCollection();

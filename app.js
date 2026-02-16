// 🌟 Globale collectie
let collection = JSON.parse(localStorage.getItem("collection")) || [];
renderCollection();

// 🌟 Camera openen
let videoStream;
async function startCamera() {
  const video = document.getElementById("camera");
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = videoStream;
  } catch (err) {
    alert("Camera werkt niet: " + err.message);
  }
}

// 🌟 Kaart scannen + OCR + toevoegen
async function captureCard() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  context.drawImage(video, 0, 0);

  alert("Scannen... even wachten");

  try {
    const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
    console.log("OCR tekst:", text);

    const match = text.match(/\d+\/\d+/);
    if (!match) {
      alert("Geen setnummer gevonden. Probeer dichterbij of betere belichting.");
      return;
    }

    const cardNumber = match[0];
    alert("Nummer gevonden: " + cardNumber);

    // API call naar Pokémon TCG
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=number:${cardNumber}&pageSize=1`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      alert("Kaart niet gevonden in database.");
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

    // Voeg toe aan collectie
    collection.push({ name, set, price, quantity: 1, image });
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();

    alert(`${name} toegevoegd!`);

  } catch (err) {
    alert("Fout bij scannen of ophalen: " + err.message);
    console.error(err);
  }
}

// 🌟 Collectie renderen
function renderCollection() {
  const list = document.getElementById("collectionList");
  list.innerHTML = "";

  collection.forEach((card, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${card.image}" width="80" style="vertical-align:middle; margin-right:10px;">
      <strong>${card.name}</strong> (${card.set}) - €${card.price}
      <button onclick="removeCard(${index})">Verwijderen</button>
    `;
    list.appendChild(li);
  });
}

// 🌟 Kaart verwijderen
function removeCard(index) {
  collection.splice(index, 1);
  localStorage.setItem("collection", JSON.stringify(collection));
  renderCollection();
}

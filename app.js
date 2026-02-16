// 🌟 Globale collectie
let collection = JSON.parse(localStorage.getItem("collection")) || [];
renderCollection();

// 🌟 Camera starten
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

// 🌟 Foto maken en OCR met voorverwerking + retry
async function takePhoto() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const context = canvas.getContext("2d");

  // Stop camera zodra foto gemaakt is
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }

  // 📌 Crop onderste 25% voor OCR
  const cropHeight = video.videoHeight * 0.25;
  const cropY = video.videoHeight - cropHeight;

  canvas.width = video.videoWidth;
  canvas.height = cropHeight;
  context.drawImage(video, 0, cropY, video.videoWidth, cropHeight, 0, 0, video.videoWidth, cropHeight);

  // 📌 Voorverwerking: grijswaarden + contrast
  let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let gray = data[i]*0.3 + data[i+1]*0.59 + data[i+2]*0.11;
    gray = ((gray - 128) * 1.5) + 128;
    gray = Math.min(255, Math.max(0, gray));
    data[i] = data[i+1] = data[i+2] = gray;
  }
  context.putImageData(imageData, 0, 0);

  const photoData = canvas.toDataURL("image/png");
  alert("Scannen... even wachten");

  try {
    let text = "";
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      const result = await Tesseract.recognize(canvas, 'eng', { logger: m => console.log(m) });
      text = result.data.text;
      console.log(`OCR poging ${i+1}:`, text);
      if (text.match(/\d+\/\d+/)) break;
    }

    const match = text.match(/\d+\/\d+/);
    if (!match) {
      alert("Geen setnummer gevonden. Probeer handmatig toe te voegen of betere belichting.");
      return;
    }

    const cardNumber = match[0];
    alert("Nummer gevonden: " + cardNumber);

    await addCardByNumber(cardNumber, photoData);

  } catch (err) {
    alert("Fout bij scannen of ophalen: " + err.message);
    console.error(err);
  }
}

// 🌟 Functie voor het ophalen van kaart via API (hergebruikt door OCR en handmatig)
async function addCardByNumber(cardNumber, fallbackImage = "") {
  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=number:${cardNumber}&pageSize=1`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      alert("Kaart niet gevonden in database.");
      return;
    }

    const card = data.data[0];
    const name = card.name;
    const set = card.set.name;
    const image = card.images.small || fallbackImage;
    const price =
      card.tcgplayer?.prices?.holofoil?.market ||
      card.tcgplayer?.prices?.normal?.market ||
      0;

    collection.push({ name, set, price, quantity: 1, image });
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();

    alert(`${name} toegevoegd!`);
  } catch (err) {
    alert("Fout bij ophalen van kaart: " + err.message);
    console.error(err);
  }
}

// 🌟 Handmatig kaart toevoegen
async function addManualCard() {
  const cardNumber = document.getElementById("manualCardNumber").value.trim();
  if (!cardNumber) {
    alert("Voer eerst een kaartnummer in!");
    return;
  }
  await addCardByNumber(cardNumber);
  document.getElementById("manualCardNumber").value = "";
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

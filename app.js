// 🌟 Globale collectie en preview
let collection = JSON.parse(localStorage.getItem("collection")) || [];
let previewCards = []; // tijdelijke previewlijst
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

// 🌟 Foto maken en OCR voor meerdere kaarten
async function takePhoto() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const context = canvas.getContext("2d");

  // Stop camera
  if (videoStream) videoStream.getTracks().forEach(track => track.stop());

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  // Grijswaarden + contrast
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
    const result = await Tesseract.recognize(canvas, 'eng', { logger: m => console.log(m) });
    const text = result.data.text;
    console.log("OCR tekst:", text);

    const matches = text.match(/\d+\/\d+/g);
    if (!matches || matches.length === 0) {
      alert("Geen kaartnummers gevonden.");
      return;
    }

    alert(`Gevonden ${matches.length} kaart(s): ${matches.join(", ")}`);

    // 🌟 Preview opbouwen
    previewCards = [];
    const previewList = document.getElementById("previewList");
    previewList.innerHTML = "";

    for (const cardNumber of matches) {
      previewCards.push({ number: cardNumber, image: photoData, selected: true });

      const li = document.createElement("li");
      li.innerHTML = `
        <input type="checkbox" checked data-number="${cardNumber}"> ${cardNumber}
        <img src="${photoData}" width="60" style="vertical-align:middle; margin-left:10px;">
      `;
      previewList.appendChild(li);
    }

  } catch (err) {
    alert("Fout bij scannen of ophalen: " + err.message);
    console.error(err);
  }
}

// 🌟 Voeg geselecteerde kaarten toe vanuit preview
async function addSelectedCards() {
  const checkboxes = document.querySelectorAll("#previewList input[type='checkbox']");
  for (const box of checkboxes) {
    if (box.checked) {
      const card = previewCards.find(c => c.number === box.dataset.number);
      if (card) {
        await addCardByNumber(card.number, card.image);
      }
    }
  }
  // Preview leegmaken
  previewCards = [];
  document.getElementById("previewList").innerHTML = "";
}

// 🌟 Kaart toevoegen via API
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

// 🌟 Handmatig toevoegen
async function addManualCard() {
  const cardNumber = document.getElementById("manualCardNumber").value.trim();
  if (!cardNumber) {
    alert("Voer eerst een kaartnummer in!");
    return;
  }
  await addCardByNumber(cardNumber);
  document.getElementById("manualCardNumber").value = "";
}

// 🌟 Render collectie met sorteren
function renderCollection() {
  const list = document.getElementById("collectionList");
  list.innerHTML = "";

  const sort = document.getElementById("sortSelect").value;
  let sorted = [...collection];

  switch(sort) {
    case "name-asc": sorted.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "name-desc": sorted.sort((a,b)=>b.name.localeCompare(a.name)); break;
    case "set-asc": sorted.sort((a,b)=>a.set.localeCompare(b.set)); break;
    case "set-desc": sorted.sort((a,b)=>b.set.localeCompare(a.set)); break;
    case "price-asc": sorted.sort((a,b)=>a.price - b.price); break;
    case "price-desc": sorted.sort((a,b)=>b.price - a.price); break;
  }

  sorted.forEach((card, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${card.image}" width="80" style="vertical-align:middle; margin-right:10px;">
      <strong>${card.name}</strong> (${card.set}) - €${card.price}
      <button onclick="removeCard(${index})">Verwijderen</button>
    `;
    list.appendChild(li);
  });

  updateTotalValue();
}

// 🌟 Kaart verwijderen
function removeCard(index) {
  collection.splice(index, 1);
  localStorage.setItem("collection", JSON.stringify(collection));
  renderCollection();
}

// 🌟 Bereken totaalwaarde
function updateTotalValue() {
  const total = collection.reduce((sum, card) => sum + parseFloat(card.price || 0), 0);
  document.getElementById("totalValue").textContent = total.toFixed(2);
}

// 🌟 Globale collectie en preview
let collection = JSON.parse(localStorage.getItem("collection")) || [];
let previewCards = [];
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

// 🌟 Foto maken en OCR verbeteren (snelle herkenning)
async function takePhoto() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const ctx = canvas.getContext("2d");

  if (videoStream) videoStream.getTracks().forEach(track => track.stop());

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 🌟 Snelheidsoptimalisatie: verklein indien te groot
  const maxWidth = 800;
  if (canvas.width > maxWidth) {
    const scale = maxWidth / canvas.width;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvas.width * scale;
    tmpCanvas.height = canvas.height * scale;
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    canvas.width = tmpCanvas.width;
    canvas.height = tmpCanvas.height;
    ctx.drawImage(tmpCanvas, 0, 0);
  }

  // 🌟 Preprocessing: grijswaarden + contrast + threshold voor OCR
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    let gray = d[i]*0.3 + d[i+1]*0.59 + d[i+2]*0.11;
    gray = ((gray - 128) * 1.8) + 128;
    gray = gray > 200 ? 255 : gray;
    gray = gray < 100 ? 0 : gray;
    d[i] = d[i+1] = d[i+2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);

  const photoData = canvas.toDataURL("image/png");
  alert("Scannen... even wachten");

  try {
    const result = await Tesseract.recognize(canvas, 'eng', { 
      logger: m => console.log(m),
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/ "
    });

    const text = result.data.text;
    console.log("OCR tekst:", text);

    let matches = [];
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    lines.forEach(line => {
      const found = line.match(/\d+\/\d+/g);
      if(found) matches.push(...found);
    });

    if (matches.length === 0) {
      alert("Geen kaartnummers gevonden. Gebruik handmatige invoer of betere belichting.");
      return;
    }

    alert(`Gevonden ${matches.length} kaart(s): ${matches.join(", ")}`);

    previewCards = [];
    const previewList = document.getElementById("previewList");
    previewList.innerHTML = "";

    matches.forEach(cardNumber => {
      previewCards.push({ number: cardNumber, image: photoData, selected: true });

      const li = document.createElement("li");
      li.innerHTML = `
        <input type="checkbox" checked data-number="${cardNumber}"> ${cardNumber}
        <img src="${photoData}" width="60" style="vertical-align:middle; margin-left:10px;">
      `;
      previewList.appendChild(li);
    });

  } catch (err) {
    alert("Fout bij OCR: " + err.message);
    console.error(err);
  }
}

// 🌟 Voeg geselecteerde kaarten toe vanuit preview
async function addSelectedCards() {
  const checkboxes = document.querySelectorAll("#previewList input[type='checkbox']");
  for (const box of checkboxes) {
    if (box.checked) {
      const card = previewCards.find(c => c.number === box.dataset.number);
      if (card) await addCard(card.number, card.image);
    }
  }
  previewCards = [];
  document.getElementById("previewList").innerHTML = "";
}

// 🌟 Kaart toevoegen via API (op naam of nummer)
async function addCard(input, fallbackImage = "") {
  try {
    let query = input.match(/^\d+\/\d+$/) ? `number:${input}` : `name:"${input}"`;

    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=1`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      alert(`Kaart "${input}" niet gevonden in database.`);
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
  const input = document.getElementById("manualCardInput").value.trim();
  if (!input) {
    alert("Voer eerst een kaartnummer of naam in!");
    return;
  }
  await addCard(input);
  document.getElementById("manualCardInput").value = "";
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

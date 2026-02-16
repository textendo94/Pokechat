// 🌟 Nieuwe API key
const API_KEY = "21f50505-4de2-4054-9321-bab450f6bee5";

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

// 🌟 Foto maken en OCR
async function takePhoto() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("snapshot");
  const ctx = canvas.getContext("2d");

  if (videoStream) videoStream.getTracks().forEach(track => track.stop());

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const photoData = canvas.toDataURL("image/png");
  alert("Scannen... even wachten");

  try {
    const result = await Tesseract.recognize(canvas,'eng',{
      logger: m=>console.log(m),
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/ "
    });
    const text = result.data.text.trim();
    console.log("OCR:",text);

    if(!text) {
      alert("Geen tekst herkend. Probeer betere belichting of handmatige invoer.");
      return;
    }

    previewCards = [];
    const previewList=document.getElementById("previewList");
    previewList.innerHTML="";

    // Elke regel controleren op iets dat op een kaartnummer lijkt of naam
    text.split("\n").map(l=>l.trim()).filter(l=>l.length>0).forEach(line=>{
      previewCards.push({number:line,image:photoData,selected:true});
      const li=document.createElement("li");
      li.innerHTML=`<input type="checkbox" checked data-number="${line}"> ${line} <img src="${photoData}" width="60" style="vertical-align:middle; margin-left:10px;">`;
      previewList.appendChild(li);
    });

    alert(`Gevonden ${previewCards.length} mogelijke kaart(en)`);

  } catch(err){alert("Fout bij OCR: "+err.message); console.error(err);}
}

// 🌟 Voeg geselecteerde kaarten toe vanuit preview
async function addSelectedCards(){
  const boxes=document.querySelectorAll("#previewList input[type='checkbox']");
  for(const box of boxes){
    if(box.checked){
      const card=previewCards.find(c=>c.number===box.dataset.number);
      if(card) await addCard(card.number,card.image);
    }
  }
  previewCards=[];
  document.getElementById("previewList").innerHTML="";
}

// 🌟 Kaart toevoegen via API (met fuzzy search)
async function addCard(input,fallbackImage=""){
  try{
    const query = `q=name:${input}*`; // * = fuzzy search zodat niet exact hoeft
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?${query}&pageSize=5`, {
      headers: {"X-Api-Key": API_KEY}
    });
    const data = await response.json();

    if(!data.data || data.data.length===0){alert(`Kaart "${input}" niet gevonden`);return;}

    const card = data.data[0]; // pak de eerste match
    const name = card.name;
    const set = card.set.name;
    const image = card.images.small || fallbackImage;
    const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;

    collection.push({name,set,price,quantity:1,image});
    localStorage.setItem("collection",JSON.stringify(collection));
    renderCollection();
    alert(`${name} toegevoegd!`);
  } catch(err){alert("Fout bij API: "+err.message); console.error(err);}
}

// 🌟 Handmatig toevoegen
async function addManualCard(){
  const input=document.getElementById("manualCardInput").value.trim();
  if(!input){alert("Voer eerst een kaartnummer of naam in!"); return;}
  await addCard(input);
  document.getElementById("manualCardInput").value="";
}

// 🌟 Render collectie
function renderCollection(){
  const list=document.getElementById("collectionList");
  list.innerHTML="";
  const sort=document.getElementById("sortSelect").value;
  let sorted=[...collection];
  switch(sort){
    case "name-asc":sorted.sort((a,b)=>a.name.localeCompare(b.name));break;
    case "name-desc":sorted.sort((a,b)=>b.name.localeCompare(a.name));break;
    case "set-asc":sorted.sort((a,b)=>a.set.localeCompare(b.set));break;
    case "set-desc":sorted.sort((a,b)=>b.set.localeCompare(a.set));break;
    case "price-asc":sorted.sort((a,b)=>a.price-b.price);break;
    case "price-desc":sorted.sort((a,b)=>b.price-b.price);break;
  }
  sorted.forEach((card,index)=>{
    const li=document.createElement("li");
    li.innerHTML=`<img src="${card.image}" width="80" style="vertical-align:middle; margin-right:10px;">
      <strong>${card.name}</strong> (${card.set}) - €${card.price}
      <button onclick="removeCard(${index})">Verwijderen</button>`;
    list.appendChild(li);
  });
  updateTotalValue();
}

// 🌟 Verwijderen
function removeCard(index){
  collection.splice(index,1);
  localStorage.setItem("collection",JSON.stringify(collection));
  renderCollection();
}

// 🌟 Totaalwaarde
function updateTotalValue(){
  const total=collection.reduce((sum,card)=>sum+parseFloat(card.price||0),0);
  document.getElementById("totalValue").textContent=total.toFixed(2);
}

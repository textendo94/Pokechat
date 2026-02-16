// 🌟 Jouw API key
const API_KEY = "b5a3c0b3-7d9a-405d-954c-2527beff9e6f";

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

  const maxWidth = 800;
  if (canvas.width > maxWidth) {
    const scale = maxWidth / canvas.width;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvas.width * scale;
    tmpCanvas.height = canvas.height * scale;
    tmpCanvas.getContext("2d").drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
    canvas.width = tmpCanvas.width;
    canvas.height = tmpCanvas.height;
    ctx.drawImage(tmpCanvas, 0, 0);
  }

  let imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
  for (let i=0;i<imgData.data.length;i+=4){
    let gray = imgData.data[i]*0.3 + imgData.data[i+1]*0.59 + imgData.data[i+2]*0.11;
    gray = ((gray-128)*1.8)+128;
    gray = gray>200?255:gray;
    gray = gray<100?0:gray;
    imgData.data[i]=imgData.data[i+1]=imgData.data[i+2]=gray;
  }
  ctx.putImageData(imgData,0,0);

  const photoData = canvas.toDataURL("image/png");
  alert("Scannen... even wachten");

  try {
    const result = await Tesseract.recognize(canvas,'eng',{
      logger: m=>console.log(m),
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/ "
    });
    const text = result.data.text;
    console.log("OCR:",text);

    let matches=[];
    text.split("\n").map(l=>l.trim()).filter(l=>l.length>0).forEach(line=>{
      const found=line.match(/\d+\/\d+/g);
      if(found) matches.push(...found);
    });

    if(matches.length===0){
      alert("Geen kaartnummers gevonden. Gebruik handmatige invoer of betere belichting.");
      return;
    }

    alert(`Gevonden ${matches.length} kaart(s): ${matches.join(", ")}`);

    previewCards=[];
    const previewList=document.getElementById("previewList");
    previewList.innerHTML="";
    matches.forEach(num=>{
      previewCards.push({number:num,image:photoData,selected:true});
      const li=document.createElement("li");
      li.innerHTML=`<input type="checkbox" checked data-number="${num}"> ${num} <img src="${photoData}" width="60" style="vertical-align:middle; margin-left:10px;">`;
      previewList.appendChild(li);
    });

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

// 🌟 Kaart toevoegen via API (fuzzy search)
async function addCard(input,fallbackImage=""){
  try{
    const query=input.match(/^\d+\/\d+$/)?`number:${input}`:`name:${input}`;
    const response=await fetch(`https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=5`,{
      headers:{"X-Api-Key":API_KEY}
    });
    const data=await response.json();
    if(!data.data||data.data.length===0){alert(`Kaart "${input}" niet gevonden`);return;}

    const card=data.data[0];
    const name=card.name;
    const set=card.set.name;
    const image=card.images.small||fallbackImage;
    const price=card.tcgplayer?.prices?.holofoil?.market||card.tcgplayer?.prices?.normal?.market||0;

    collection.push({name,set,price,quantity:1,image});
    localStorage.setItem("collection",JSON.stringify(collection));
    renderCollection();
    alert(`${name} toegevoegd!`);
  }catch(err){alert("Fout bij API: "+err.message); console.error(err);}
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

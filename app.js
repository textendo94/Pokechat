// 🌟 Nieuwe API key
const API_KEY = "21f50505-4de2-4054-9321-bab450f6bee5";

// 🌟 Globale collectie
let collection = JSON.parse(localStorage.getItem("collection")) || [];
renderCollection();

// 🌟 Kaart toevoegen via API (handmatig)
async function addCard(input) {
  try {
    if(!input) { alert("Voer eerst een kaartnaam in!"); return; }

    // Fuzzy search zodat exacte set niet nodig is
    const query = `q=name:${input}*`;
    console.log("API query:", query);

    const response = await fetch(`https://api.pokemontcg.io/v2/cards?${query}&pageSize=5`, {
      headers: { "X-Api-Key": API_KEY }
    });

    const data = await response.json();

    if(!data.data || data.data.length === 0){
      alert(`Kaart "${input}" niet gevonden`);
      return;
    }

    const card = data.data[0]; // pak eerste match
    const name = card.name;
    const set = card.set.name;
    const image = card.images.small || "";
    const price = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0;

    collection.push({name, set, price, quantity:1, image});
    localStorage.setItem("collection", JSON.stringify(collection));
    renderCollection();
    alert(`${name} toegevoegd!`);

  } catch(err) {
    alert("Fout bij API: " + err.message);
    console.error(err);
  }
}

// 🌟 Handmatige invoer knop
async function addManualCard() {
  const input = document.getElementById("manualCardInput").value.trim();
  await addCard(input);
  document.getElementById("manualCardInput").value = "";
}

// 🌟 Render collectie
function renderCollection() {
  const list = document.getElementById("collectionList");
  list.innerHTML = "";
  const sort = document.getElementById("sortSelect").value;
  let sorted = [...collection];

  switch(sort){
    case "name-asc": sorted.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "name-desc": sorted.sort((a,b)=>b.name.localeCompare(a.name)); break;
    case "set-asc": sorted.sort((a,b)=>a.set.localeCompare(b.set)); break;
    case "set-desc": sorted.sort((a,b)=>b.set.localeCompare(a.set)); break;
    case "price-asc": sorted.sort((a,b)=>a.price-b.price); break;
    case "price-desc": sorted.sort((a,b)=>b.price-a.price); break;
  }

  sorted.forEach((card,index)=>{
    const li = document.createElement("li");
    li.innerHTML = `<img src="${card.image}" width="80" style="vertical-align:middle; margin-right:10px;">
                    <strong>${card.name}</strong> (${card.set}) - €${card.price}
                    <button onclick="removeCard(${index})">Verwijderen</button>`;
    list.appendChild(li);
  });

  updateTotalValue();
}

// 🌟 Verwijderen
function removeCard(index) {
  collection.splice(index,1);
  localStorage.setItem("collection", JSON.stringify(collection));
  renderCollection();
}

// 🌟 Totaalwaarde
function updateTotalValue() {
  const total = collection.reduce((sum,card)=>sum + parseFloat(card.price||0),0);
  document.getElementById("totalValue").textContent = total.toFixed(2);
}

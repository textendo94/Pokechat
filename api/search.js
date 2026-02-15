export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Geen naam opgegeven" });
  }

  try {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:${name}&pageSize=1`
    );

    const data = await response.json();

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Fout bij ophalen kaart" });
  }
}

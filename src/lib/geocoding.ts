export type Coords = { latitude: number; longitude: number };

export async function geocodeAddress(address: string): Promise<Coords | null> {
    if (!address || address.trim() === "") return null;

    const url =
  "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
  encodeURIComponent(address);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent" : "PoolServiceApp/1.0",
            },
        });

        const data = await response.json();

        if(data.length == 0) return null;

        return {
            latitude: Number(data[0].lat),
            longitude: Number(data[0].lon)
        };
    } catch (error) {
        console.log("Geocoding error:", (error as Error).message);
        return null;
    }
}

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
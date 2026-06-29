export type ChemicalReading = {
    id: string;
    visitId: string;
    ph: number | null;
    freeChlorine: number | null;
    totalAlkalinity: number | null;
    calciumHardness: number | null;
    cyanuricAcid: number | null;
    salt: number | null;
    waterTemp: number | null;
    notes: string;
};

export type ReadingInput = Omit<ChemicalReading, "id" | "visitId">;
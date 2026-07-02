export type Part = {
    description: string;
    qty: number; 
    costEach: number;
    chargeEach: number;
};

export type Invoice = {
    id: string;
    visitId: string;
    workDescription: string;
    parts: Part[];
    laborHours: number;
    laborRate: number;
    partsTotal: number;
    laborTotal: number;
    total: number;
    profit: number;
    status: string;
};

export type InvoiceInput = {
    visitId: string;
    workDescription: string;
    parts: Part[];
    laborHours: number;
    laborRate: number;
};
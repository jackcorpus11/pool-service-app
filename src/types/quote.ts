import { Part } from "./invoice";

export type Quote = {
    id: string;
    clientId: number | null;
    oneoffName: string;
    oneoffPhone: string;
    oneoffEmail: string;
    jobType: string;
    description: string;
    parts: Part[];
    laborHours: number;
    laborRate: number;
    partsTotal: number;
    laborTotal: number;
    total: number;
    proposedDate: string | null;
    status: string;
    tentativeVisitId: string | null;
};

export type QuoteInput = {
    clientId: number | null;
    oneoffName: string;
    oneoffPhone: string;
    oneoffEmail: string;
    jobType: string;
    description: string;
    parts: Part[];
    laborHours: number;
    laborRate: number;
    proposedDate: string | null;
};
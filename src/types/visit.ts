export type ServiceVisit = {
    id: string;
    poolId: string;
    planId: string | null;
    visitDate: string;
    status: string;
    jobType: string;
};

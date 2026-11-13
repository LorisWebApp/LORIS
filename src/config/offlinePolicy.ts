/**
 * Offline policy constants shared by the Dashboard and the Offline Library (Phase 4).
 * Values taken from the Offline Library wireframe ("2.0 GB allocated", "30-day archival policy").
 * Confirm them with the team – the SRS leaves the licence period undefined.
 */
export const OFFLINE_STORAGE_ALLOCATION_BYTES = 2 * 1024 * 1024 * 1024; // 2.0 GB
export const OFFLINE_LICENCE_DAYS = 30;
/** Downloads expiring within this many days are flagged "Expiring soon". */
export const OFFLINE_EXPIRY_WARNING_DAYS = 7;

import type { Certification } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

const CERTS_KEY = "certtrack_certs_v1";

function loadCerts(): Certification[] {
  try {
    const raw = localStorage.getItem(CERTS_KEY);
    if (!raw) {
      const initial: Certification[] = [];
      localStorage.setItem(CERTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as Certification[];
  } catch {
    return [];
  }
}

function saveCerts(certs: Certification[]) {
  localStorage.setItem(CERTS_KEY, JSON.stringify(certs));
}

export async function getAllCertifications(): Promise<Certification[]> {
  return loadCerts();
}

export async function getCertificationsByUser(userId?: string | null): Promise<Certification[]> {
  const certs = loadCerts();
  if (!userId) return [];
  return certs.filter((c) => c.userId === userId);
}

export async function createCertification(data: Partial<Certification>): Promise<Certification> {
  const certs = loadCerts();
  const id = uuidv4();
  const cert: Certification = {
    id,
    userId: data.userId || "",
    name: data.name || "",
    issuingOrganization: data.issuingOrganization || "",
    credentialId: data.credentialId || "",
    issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
    expirationDate: data.expirationDate || new Date().toISOString().slice(0, 10),
  } as Certification;
  certs.push(cert);
  saveCerts(certs);
  return cert;
}

export async function updateCertification(id: string, data: Partial<Certification>): Promise<Certification> {
  const certs = loadCerts();
  const idx = certs.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Not found");
  certs[idx] = { ...certs[idx], ...data };
  saveCerts(certs);
  return certs[idx];
}

export async function deleteCertification(id: string): Promise<void> {
  const certs = loadCerts();
  const newCerts = certs.filter((c) => c.id !== id);
  saveCerts(newCerts);
}

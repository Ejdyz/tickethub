import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL || 'postgresql://tickethub:zTAVD3ttOCGb9hustsLT@192.168.1.101:5436/tickethub',
});

export type { Contract };


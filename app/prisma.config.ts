import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: { connection: process.env['DATABASE_URL'] || 'postgresql://tickethub:zTAVD3ttOCGb9hustsLT@192.168.1.101:5436/tickethub' },
  }),
});


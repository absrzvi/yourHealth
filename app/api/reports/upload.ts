import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/db';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({ multiples: false, uploadDir: './public/uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getSession({ req });
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const file = files.file as formidable.File;
    const reportType = fields.type as string;
    const fileName = file.originalFilename || uuidv4();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    fs.renameSync(file.filepath, filePath);

    // File type validation and parsing
    let parsedData: string | null = null;
    const allowedTypes = ['text/csv', 'application/pdf', 'application/json', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: `Unsupported file type. Please upload a CSV, PDF, TXT, or JSON file.` });
    }
    if (file.mimetype === 'text/csv') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const records = csvParse(content, { columns: true });
        parsedData = JSON.stringify(records);
      } catch (err) {
        return res.status(400).json({ error: 'Failed to parse CSV. Please check your file format.' });
      }
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Save report in DB
    await prisma.report.create({
      data: {
        userId: user.id,
        type: reportType,
        fileName,
        filePath: `/uploads/${fileName}`,
        parsedData,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp-client';
import { chunkText } from '@/lib/utils';
import mammoth from 'mammoth';

// Dynamic import for pdf-parse to avoid ESM/CJS issues
interface PdfParseResult {
  text: string;
}

interface PdfParseModule {
  default?: (buffer: Buffer) => Promise<PdfParseResult>;
  (buffer: Buffer): Promise<PdfParseResult>;
}

async function parsePdf(buffer: Buffer) {
  const pdfModule = (await import('pdf-parse')) as unknown as PdfParseModule;
  const pdfParse = pdfModule.default || pdfModule;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf') {
      text = await parsePdf(buffer);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ buffer });
      text = data.value;
    } else {
      // Treat as plain text
      text = buffer.toString('utf-8');
    }

    const chunks = chunkText(text, 1000, 200);

    // Call add_memory for each chunk sequentially to avoid overwhelming the transport
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await mcpClient.callTool('add_memory', {
        name: `${file.name} (Part ${i + 1}/${chunks.length})`,
        episode_body: chunk,
        group_id: groupId,
        source: 'text',
        source_description: `Document: ${file.name}`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      chunks: chunks.length,
      message: `File '${file.name}' processed into ${chunks.length} chunks.`
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}

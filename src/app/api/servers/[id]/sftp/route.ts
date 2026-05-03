import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const clientId = (session?.user as any)?.clientId;

  if (!userId || !clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const server = await prisma.vpsService.findFirst({
    where: { id, clientId }
  });

  if (!server || !server.ipAddress) {
    return NextResponse.json({ error: 'Servidor no encontrado o sin dirección IP.' }, { status: 404 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let action, reqPath, credentials, content, newPath, fileBuffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      action = formData.get('action') as string;
      reqPath = formData.get('path') as string;
      credentials = JSON.parse(formData.get('credentials') as string);
      
      const file = formData.get('file') as File;
      if (file) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const body = await request.json();
      action = body.action;
      reqPath = body.path;
      credentials = body.credentials;
      content = body.content;
      newPath = body.newPath;
    }

    if (!credentials || !credentials.password) {
      return NextResponse.json({ error: 'Credenciales SSH requeridas.' }, { status: 400 });
    }

    const authArg = `${credentials.username || 'root'}:${credentials.password}`;
    const baseUrl = `sftp://${server.ipAddress}`;

    const runCurl = (args: string[], stdinContent?: string | Buffer): Promise<string> => {
      return new Promise((resolve, reject) => {
        const { execFile } = require('child_process');
        const child = execFile('curl', args, { maxBuffer: 1024 * 1024 * 10 }, (error: any, stdout: string, stderr: string) => {
          if (error) {
            if (stderr.includes('Authentication failure') || stderr.includes('Login denied')) {
              return reject(new Error('Credenciales inválidas o acceso denegado.'));
            }
            if (stderr.includes('Could not resolve host') || stderr.includes('Connection refused')) {
              return reject(new Error('No se pudo conectar al servidor.'));
            }
            return reject(new Error(`cURL error: ${stderr || error.message}`));
          }
          resolve(stdout);
        });

        if (stdinContent && child.stdin) {
          child.stdin.write(stdinContent);
          child.stdin.end();
        }
      });
    };

    let result;

    switch (action) {
      case 'list': {
        const targetPath = reqPath.endsWith('/') ? reqPath : `${reqPath}/`;
        const stdout = await runCurl(['-s', '-k', '-u', authArg, `${baseUrl}${targetPath}`]);
        
        const lines = stdout.split('\n').filter((line: string) => line.trim().length > 0);
        const parsedFiles = [];
        const regex = /^([bcdlsp-][rwx-]{9})\s+\d+\s+(\S+)\s+(\S+)\s+(\d+)\s+([A-Za-z]{3}\s+\d+\s+[\d:]+|\w{3}\s+\d+\s+\d{4})\s+(.+)$/;
        
        for (const line of lines) {
          const match = line.match(regex);
          if (match) {
            const isDir = match[1].startsWith('d');
            const name = match[6];
            if (name === '.' || name === '..') continue;
            
            parsedFiles.push({
              type: isDir ? 'd' : '-',
              name: name,
              size: parseInt(match[4], 10),
              modifyTime: new Date(match[5]).getTime(),
              rights: { user: '', group: '', other: '' },
              owner: 0,
              group: 0
            });
          }
        }
        result = parsedFiles;
        break;
      }
      case 'read':
        result = await runCurl(['-s', '-k', '-u', authArg, `${baseUrl}${reqPath}`]);
        break;
      case 'download': {
        // For downloads, we use spawn to stream the data directly to the Next.js response
        // without keeping the entire file in RAM
        const { spawn } = require('child_process');
        const child = spawn('curl', ['-s', '-k', '-u', authArg, `${baseUrl}${reqPath}`]);
        
        const stream = new ReadableStream({
          start(controller) {
            child.stdout.on('data', (chunk: Buffer) => controller.enqueue(chunk));
            child.stdout.on('end', () => controller.close());
            child.stderr.on('data', (data: Buffer) => {
              // Curl writes errors to stderr
              const errStr = data.toString();
              if (errStr.includes('Authentication failure')) {
                controller.error(new Error('Credenciales inválidas.'));
              }
            });
            child.on('error', (err: Error) => controller.error(err));
          }
        });

        const fileName = reqPath.split('/').pop() || 'download';
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`
          }
        });
      }
      case 'upload':
        if (!fileBuffer) throw new Error('No se proporcionó ningún archivo para subir.');
        await runCurl(['-s', '-k', '-u', authArg, '-T', '-', `${baseUrl}${reqPath}`], fileBuffer);
        result = { success: true };
        break;
      case 'write':
        await runCurl(['-s', '-k', '-u', authArg, '-T', '-', `${baseUrl}${reqPath}`], content);
        result = { success: true };
        break;
      case 'delete':
        await runCurl(['-s', '-k', '-u', authArg, '-Q', `rm ${reqPath}`, `${baseUrl}/`]);
        result = { success: true };
        break;
      case 'rename':
        await runCurl(['-s', '-k', '-u', authArg, '-Q', `rename ${reqPath} ${newPath}`, `${baseUrl}/`]);
        result = { success: true };
        break;
      case 'mkdir':
        await runCurl(['-s', '-k', '-u', authArg, '-Q', `mkdir ${reqPath}`, `${baseUrl}/`]);
        result = { success: true };
        break;
      case 'rmdir':
        await runCurl(['-s', '-k', '-u', authArg, '-Q', `rmdir ${reqPath}`, `${baseUrl}/`]);
        result = { success: true };
        break;
      default:
        return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('cURL SFTP Error:', error.message);
    return NextResponse.json({ error: error.message || 'Error en operación SFTP' }, { status: 500 });
  }
}

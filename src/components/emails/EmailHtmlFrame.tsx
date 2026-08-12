'use client';

import { useEffect, useRef, useState } from 'react';

interface EmailHtmlFrameProps {
  html: string;
  title: string;
}

function buildIsolatedEmailDocument(html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; media-src https: http: data:; style-src 'unsafe-inline'; font-src https: data:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none';">
    <base target="_blank">
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; width: 100%; max-width: 100%; overflow-x: hidden; overflow-wrap: anywhere; }
      body { background: transparent; color: #d7d7dc; font: 14px/1.6 Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; }
      img, video { max-width: 100% !important; height: auto !important; }
      table { width: 100% !important; max-width: 100% !important; }
      td, th { max-width: 100%; overflow-wrap: anywhere; }
      pre { max-width: 100%; white-space: pre-wrap; }
      a { overflow-wrap: anywhere; }
      blockquote { margin-left: 0.75rem; margin-right: 0; padding-left: 0.75rem; }
      @media (max-width: 640px) {
        body { font-size: 16px !important; line-height: 1.65 !important; }
        p, li, td, th, a { font-size: max(16px, 1em) !important; line-height: 1.65 !important; }
      }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

export default function EmailHtmlFrame({ html, title }: EmailHtmlFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(360);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const resizeFrame = () => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument?.body) return;

    const updateHeight = () => {
      const contentHeight = Math.max(
        frameDocument.body.scrollHeight,
        frameDocument.documentElement.scrollHeight,
      );
      setHeight(Math.min(Math.max(contentHeight + 2, 160), 6000));
    };

    observerRef.current?.disconnect();
    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(updateHeight);
      observerRef.current.observe(frameDocument.body);
    }
  };

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={buildIsolatedEmailDocument(html)}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      onLoad={resizeFrame}
      style={{ height }}
      className="block w-full min-w-0 max-h-[6000px] border-0 bg-transparent"
    />
  );
}

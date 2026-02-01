import fs from "fs";
import path from "path";
import React from "react";

type FileItem = {
  name: string;
  ext: string;
  kind: "image" | "pdf" | "other";
};

function classify(name: string): FileItem {
  const ext = (name.match(/\.([^.]+)$/)?.[1] || "").toLowerCase();
  if (/(png|jpe?g|gif|webp|svg)$/i.test(ext)) return { name, ext, kind: "image" };
  if (ext === "pdf") return { name, ext, kind: "pdf" };
  return { name, ext, kind: "other" };
}

export default function CertificatesPage() {
  const certDir = path.join(process.cwd(), "public", "certificate");
  let files: FileItem[] = [];
  try {
    if (fs.existsSync(certDir)) {
      files = fs
        .readdirSync(certDir)
        .filter((f) => !f.startsWith("."))
        .map(classify)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (e) {
    files = [];
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Certificates</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.length === 0 && (
          <p className="text-muted-foreground">No certificates found in the certificate folder.</p>
        )}

        {files.map((file) => (
          <article key={file.name} className="rounded shadow-sm overflow-hidden bg-white">
            {file.kind === "image" ? (
              <img
                src={`/certificate/${encodeURIComponent(file.name)}`}
                alt={file.name}
                className="w-full h-56 object-contain p-4 bg-gray-50"
              />
            ) : file.kind === "pdf" ? (
              <div className="flex items-center justify-center h-56 bg-gray-50 p-4">
                <a
                  href={`/certificate/${encodeURIComponent(file.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center"
                >
                  <div className="text-xl font-medium">📄 {file.name}</div>
                  <div className="text-sm text-slate-500 mt-2">Open / Download</div>
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-56 bg-gray-50 p-4">
                <a href={`/certificate/${encodeURIComponent(file.name)}`} target="_blank" rel="noreferrer">
                  {file.name}
                </a>
              </div>
            )}

            <footer className="p-2 text-sm text-center break-words">{file.name}</footer>
          </article>
        ))}
      </div>
    </main>
  );
}

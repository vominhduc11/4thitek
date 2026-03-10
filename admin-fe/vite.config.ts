import { defineConfig, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import type { OutputBundle, OutputChunk } from 'rollup'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()]

  if (process.env.ANALYZE === 'true') {
    const bundleReportPlugin: Plugin = {
      name: 'bundle-report',
      generateBundle(_options, bundle: OutputBundle) {
        const assets = Object.values(bundle)
          .filter((item): item is OutputChunk => item.type === 'chunk')
          .map((item) => ({
            fileName: item.fileName,
            size: item.code.length,
            imports: item.imports,
          }))
          .sort((left, right) => right.size - left.size)

        this.emitFile({
          type: 'asset',
          fileName: 'bundle-report.json',
          source: JSON.stringify(
            {
              generatedAt: new Date().toISOString(),
              mode,
              assets,
            },
            null,
            2,
          ),
        })

        const rows = assets
          .map(
            (asset) => `
              <tr>
                <td>${asset.fileName}</td>
                <td>${Math.round(asset.size / 1024)} KB</td>
                <td>${asset.imports.join(', ') || '-'}</td>
              </tr>
            `,
          )
          .join('')

        this.emitFile({
          type: 'asset',
          fileName: 'bundle-report.html',
          source: `
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <title>Admin Bundle Report</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
                  table { border-collapse: collapse; width: 100%; }
                  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                  th { background: #e2e8f0; }
                </style>
              </head>
              <body>
                <h1>Admin Bundle Report</h1>
                <p>Generated ${new Date().toISOString()}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Chunk</th>
                      <th>Size</th>
                      <th>Imports</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </body>
            </html>
          `,
        })
      },
    }

    plugins.push(bundleReportPlugin)
  }

  return {
    plugins,
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    build: {
      chunkSizeWarningLimit: 800,
    },
    test: {
      environment: 'node',
      globals: true,
    },
  }
})

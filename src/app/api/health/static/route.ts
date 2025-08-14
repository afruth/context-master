import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Check if Next.js static files are accessible
    const staticChecks = [
      '/_next/static/css/app/layout.css',
      '/_next/static/chunks/webpack.js',
    ]

    const results = []
    
    for (const staticPath of staticChecks) {
      try {
        // Try to access the file through the file system
        const filePath = join(process.cwd(), '.next', staticPath.replace('/_next/', ''))
        await readFile(filePath)
        results.push({
          path: staticPath,
          status: 'accessible',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          path: staticPath,
          status: 'not found',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }
    }

    // Check if .next directory exists
    const nextDirExists = await readFile(join(process.cwd(), '.next', 'build-manifest.json'))
      .then(() => true)
      .catch(() => false)

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      nextDirExists,
      staticFiles: results,
      buildId: process.env.BUILD_ID || 'default',
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
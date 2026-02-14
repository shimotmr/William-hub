import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TailscaleDevice {
  name: string
  ip: string
  online: boolean
}

const DEVICES: TailscaleDevice[] = [
  { name: 'travisdemac-mini-1', ip: '100.103.23.67', online: true },
  { name: 'iphone181', ip: '100.94.147.18', online: false },
]

export async function GET() {
  return NextResponse.json({ 
    devices: DEVICES, 
    success: true 
  })
}

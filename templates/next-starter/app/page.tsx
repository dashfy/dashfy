'use client'

import dynamic from 'next/dynamic'

const DashfyApp = dynamic(() => import('@/components/DashfyApp'), {
  ssr: false,
})

export default function Page() {
  return <DashfyApp />
}

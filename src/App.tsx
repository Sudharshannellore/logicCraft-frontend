import { QueryProvider } from '@/app/providers/QueryProvider'
import { AppRouter } from '@/app/router'
import { PixelClickBurst } from '@/components/pixel/PixelClickBurst'

export default function App() {
  return (
    <QueryProvider>
      <AppRouter />
      <PixelClickBurst />
    </QueryProvider>
  )
}

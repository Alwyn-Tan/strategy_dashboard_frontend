import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import enUS from 'antd/locale/en_US'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={enUS}
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { LanguageProvider } from './contexts/LanguageContext'
import { UserMemoryProvider } from './contexts/UserMemoryContext'
import './index.css'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<LanguageProvider>
			<UserMemoryProvider>
				<App />
			</UserMemoryProvider>
		</LanguageProvider>
	</StrictMode>,
)

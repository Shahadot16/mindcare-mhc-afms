import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { RealtimeProvider } from '@/context/RealtimeContext';
import App from '@/app/App';
import '@/styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '14px', fontSize: '14px', padding: '10px 14px' },
          success: { iconTheme: { primary: '#0a8577', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

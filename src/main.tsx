import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import UploadMaterial from './pages/UploadMaterial.tsx'
import MaterialDetails from './pages/MaterialDetails.tsx'
import ManageMaterials from './pages/ManageMaterials.tsx' // <-- Add this
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/upload" element={<UploadMaterial />} />
        <Route path="/material/:id" element={<MaterialDetails />} />
        <Route path="/manage" element={<ManageMaterials />} /> {/* <-- Add this */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Catalogue from './pages/Catalogue.tsx'
import UploadMaterial from './pages/UploadMaterial.tsx'
import MaterialDetails from './pages/MaterialDetails.tsx'
import OrganisationOverview from './pages/OrganisationOverview.tsx'
import ManageMaterials from './pages/ManageMaterials.tsx'
import Members from './pages/Members.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Catalogue />} />
          <Route path="material/:id" element={<MaterialDetails />} />
          <Route path="manage" element={<OrganisationOverview />} />
          <Route path="manage/table" element={<ManageMaterials />} />
          <Route path="manage/members" element={<Members />} />
          <Route path="upload" element={<UploadMaterial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
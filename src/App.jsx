import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Ingredients from './pages/Ingredients'
import Menus from './pages/Menus'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/menus" replace />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="menus" element={<Menus />} />
          <Route path="settings" element={<div className="p-4 lg:p-8"><div className="max-w-5xl mx-auto"><h1 className="text-2xl font-bold text-stone-800">設定</h1></div></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

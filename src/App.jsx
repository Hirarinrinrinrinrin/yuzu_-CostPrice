import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Ingredients from './pages/Ingredients'
import PrepIngredients from './pages/PrepIngredients'
import Menus from './pages/Menus'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter basename="/yuzu_-CostPrice">
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/menus" replace />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="prep" element={<PrepIngredients />} />
          <Route path="menus" element={<Menus />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


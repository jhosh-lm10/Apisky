import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Send, Home, Users, MessageSquare, Clock, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react'
import Login from '@/pages/Login.jsx'
import Inicio from '@/pages/Inicio.jsx'
import Contactos from '@/pages/Contactos.jsx'
import Mensajes from '@/pages/Mensajes.jsx'
import Programados from '@/pages/Programados.jsx'
import Historial from '@/pages/Historial.jsx'
import Configuracion from '@/pages/Configuracion.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scheduledMessages, setScheduledMessages] = useState([])
  const [sentMessages, setSentMessages] = useState([])

  const menuItems = [
    { path: '/inicio', label: 'Inicio', icon: Home },
    { path: '/contactos', label: 'Contactos', icon: Users },
    { path: '/mensajes', label: 'Mensajes', icon: MessageSquare },
    { path: '/programados', label: 'Envíos programados', icon: Clock },
    { path: '/historial', label: 'Historial y estadísticas', icon: BarChart3 },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ]

  if (!isLoggedIn) {
    return <Login onSuccess={(user) => { setIsLoggedIn(true); setUsername(user) }} />
  }

  return (
    <Router>
      <Layout
        username={username}
        menuItems={menuItems}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={() => setIsLoggedIn(false)}
      >
        <Routes>
          <Route path='/' element={<Navigate to='/inicio' />} />
          <Route path='/inicio' element={<Inicio />} />
          <Route path='/contactos' element={<Contactos />} />
          <Route path='/mensajes' element={<Mensajes scheduledMessages={scheduledMessages} setScheduledMessages={setScheduledMessages} sentMessages={sentMessages} setSentMessages={setSentMessages} />} />
          <Route path='/programados' element={<Programados scheduledMessages={scheduledMessages} />} />
          <Route path='/historial' element={<Historial sentMessages={sentMessages} />} />
          <Route path='/configuracion' element={<Configuracion />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function Layout({ username, menuItems, isMobileMenuOpen, setIsMobileMenuOpen, onLogout, children }) {
  const location = useLocation()
  const currentLabel = menuItems.find(item => item.path === location.pathname)?.label || 'PIsky'

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:transform-none`}>
        <div className='flex items-center justify-between h-16 px-6 border-b'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <Send className='w-5 h-5 text-white' />
            </div>
            <span className='text-xl font-bold text-gray-900'>PIsky</span>
          </div>
          <Button variant='ghost' size='sm' className='lg:hidden' onClick={() => setIsMobileMenuOpen(false)}>
            <X className='w-5 h-5' />
          </Button>
        </div>
        <nav className='mt-6 px-3'>
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className='w-5 h-5' />
                <span className='font-medium'>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className='absolute bottom-0 left-0 right-0 p-3 border-t bg-white lg:static lg:bg-transparent'>
          <Button variant='ghost' onClick={onLogout} className='w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50'>
            <LogOut className='w-5 h-5 mr-3' />
            Cerrar sesión
          </Button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden' onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className='flex-1 lg:ml-0'>
        <header className='bg-white shadow-sm border-b h-16 flex items-center justify-between px-6'>
          <div className='flex items-center space-x-4'>
            <Button variant='ghost' size='sm' className='lg:hidden' onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className='w-5 h-5' />
            </Button>
            <h1 className='text-xl font-semibold text-gray-900 capitalize'>{currentLabel}</h1>
          </div>
          <div className='text-sm text-gray-600'>Bienvenido, {username}</div>
        </header>
        <main className='p-6'>{children}</main>
      </div>
    </div>
  )
}

export default App

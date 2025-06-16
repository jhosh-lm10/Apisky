import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Home, 
  Users, 
  MessageSquare, 
  Clock, 
  BarChart3, 
  Settings,
  Send,
  Upload,
  Mail,
  Phone,
  LogOut,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useContacts } from './hooks/useContacts'
import { useMessages, useWhatsApp, useEmail } from './hooks/useMessages'
import { useStats } from './hooks/useStats'
import { useConfig } from './hooks/useConfig'
import { authService } from './services/api'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentSection, setCurrentSection] = useState('inicio')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginData.username || !loginData.password) {
      setLoginError('Por favor ingresa usuario y contraseña')
      return
    }

    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await authService.login(loginData)
      if (response.success) {
        setIsLoggedIn(true)
        setCurrentSection('inicio')
        setLoginError('')
      }
    } catch (error) {
      setLoginError('Error al iniciar sesión. Verifica tus credenciales.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setIsLoggedIn(false)
      setLoginData({ username: '', password: '' })
      setCurrentSection('inicio')
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'contactos', label: 'Contactos', icon: Users },
    { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
    { id: 'programados', label: 'Envíos programados', icon: Clock },
    { id: 'historial', label: 'Historial y estadísticas', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ]

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">PIsky</CardTitle>
            <CardDescription className="text-gray-600">
              Gestión de mensajes promocionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="h-11"
                  disabled={loginLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="h-11"
                  disabled={loginLoading}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:transform-none`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PIsky</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
                  currentSection === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 capitalize">
              {menuItems.find(item => item.id === currentSection)?.label || 'PIsky'}
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            Bienvenido, {loginData.username}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {currentSection === 'inicio' && <InicioSection />}
          {currentSection === 'contactos' && <ContactosSection />}
          {currentSection === 'mensajes' && <MensajesSection />}
          {currentSection === 'programados' && <ProgramadosSection />}
          {currentSection === 'historial' && <HistorialSection />}
          {currentSection === 'configuracion' && <ConfiguracionSection />}
        </main>
      </div>
    </div>
  )
}

// Componentes de las secciones
function InicioSection() {
  const { dashboardStats, loading, error } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const stats = dashboardStats || {
    totalContacts: 1234,
    messagesSent: 5678,
    deliveryRate: 94.2,
    scheduledMessages: 23
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contactos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts.toLocaleString()}</p>
                {stats.monthlyGrowth?.contacts && (
                  <p className="text-xs text-green-600">+{stats.monthlyGrowth.contacts}% vs mes anterior</p>
                )}
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mensajes Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messagesSent.toLocaleString()}</p>
                {stats.monthlyGrowth?.messages && (
                  <p className="text-xs text-green-600">+{stats.monthlyGrowth.messages}% vs mes anterior</p>
                )}
              </div>
              <Send className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Entrega</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
                {stats.monthlyGrowth?.deliveryRate && (
                  <p className="text-xs text-green-600">+{stats.monthlyGrowth.deliveryRate}% vs mes anterior</p>
                )}
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Programados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduledMessages}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
          <CardDescription>
            Actividad reciente de tus campañas de mensajes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Campaña "Ofertas de Verano" completada</p>
                <p className="text-sm text-gray-600">Enviado a 1,205 contactos • Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Nueva lista de contactos importada</p>
                <p className="text-sm text-gray-600">234 nuevos contactos • Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Campaña "Newsletter Semanal" programada</p>
                <p className="text-sm text-gray-600">Programado para mañana a las 9:00 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ContactosSection() {
  const { contacts, loading, error, importContacts } = useContacts()
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportLoading(true)
    setImportResult(null)

    try {
      const result = await importContacts(file)
      setImportResult(result)
    } catch (err) {
      setImportResult({ 
        success: false, 
        message: 'Error al importar contactos' 
      })
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Contactos</h2>
          <p className="text-gray-600">Administra y organiza tu base de contactos</p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={importLoading}
          />
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={importLoading}
          >
            {importLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir CSV/Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {importResult && (
        <Alert variant={importResult.success ? "default" : "destructive"}>
          {importResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {importResult.success 
              ? `Importación exitosa: ${importResult.imported} contactos importados, ${importResult.duplicates} duplicados, ${importResult.failed} fallidos.`
              : importResult.message}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando contactos...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Contactos</CardTitle>
            <CardDescription>Total: {contacts.length} contactos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segmento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{contact.segment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MensajesSection() {
  const { sendMessage, loading, error } = useMessages()
  const { whatsappStatus, emailStatus, checkWhatsappStatus, checkEmailStatus } = useConfig()
  const [messageContent, setMessageContent] = useState('')
  const [messageSubject, setMessageSubject] = useState('') // Solo para email
  const [channel, setChannel] = useState('whatsapp')
  const [recipients, setRecipients] = useState('all') // 'all', 'segment', 'custom'
  const [selectedSegment, setSelectedSegment] = useState('general')
  const [customRecipients, setCustomRecipients] = useState('')
  const [sendResult, setSendResult] = useState(null)

  useEffect(() => {
    checkWhatsappStatus()
    checkEmailStatus()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    setSendResult(null)

    if (!messageContent.trim()) {
      setSendResult({ success: false, message: 'El contenido del mensaje no puede estar vacío.' })
      return
    }

    if (channel === 'email' && !messageSubject.trim()) {
      setSendResult({ success: false, message: 'El asunto del correo no puede estar vacío.' })
      return
    }

    let finalRecipients = []
    if (recipients === 'all') {
      finalRecipients = ['all'] // El backend manejará esto
    } else if (recipients === 'segment') {
      finalRecipients = [selectedSegment]
    } else if (recipients === 'custom') {
      finalRecipients = customRecipients.split(',').map(r => r.trim()).filter(r => r)
      if (finalRecipients.length === 0) {
        setSendResult({ success: false, message: 'Debes especificar al menos un destinatario personalizado.' })
        return
      }
    }

    try {
      const result = await sendMessage({
        content: messageContent,
        subject: messageSubject,
        channel,
        recipients: finalRecipients,
      })
      setSendResult(result)
    } catch (err) {
      setSendResult({ success: false, message: err.message || 'Error al enviar mensaje.' })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Crear y Enviar Mensajes</h2>
      <p className="text-gray-600">Redacta tus mensajes y selecciona el canal de envío.</p>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Canales</CardTitle>
          <CardDescription>Verifica la conexión de tus servicios de envío.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2">
            {whatsappStatus.connected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">WhatsApp:</span>
            <span className={`${whatsappStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
            {whatsappStatus.connected && whatsappStatus.phoneNumber && (
              <span className="text-sm text-gray-500">({whatsappStatus.phoneNumber})</span>
            )}
            <Button variant="ghost" size="sm" onClick={checkWhatsappStatus} disabled={whatsappStatus.loading}>
              {whatsappStatus.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refrescar'}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            {emailStatus.connected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">Email (SMTP):</span>
            <span className={`${emailStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {emailStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
            <Button variant="ghost" size="sm" onClick={checkEmailStatus} disabled={emailStatus.loading}>
              {emailStatus.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refrescar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSendMessage} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contenido del Mensaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={channel === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setChannel('whatsapp')}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button
                type="button"
                variant={channel === 'email' ? 'default' : 'outline'}
                onClick={() => setChannel('email')}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
            </div>
            
            {channel === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del Correo</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Asunto de tu correo promocional"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="messageContent">Mensaje</Label>
              <textarea
                id="messageContent"
                rows="6"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Escribe tu mensaje aquí..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destinatarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Seleccionar Destinatarios</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={recipients === 'all' ? 'default' : 'outline'}
                  onClick={() => setRecipients('all')}
                  className="flex-1"
                >
                  Todos los Contactos
                </Button>
                <Button
                  type="button"
                  variant={recipients === 'segment' ? 'default' : 'outline'}
                  onClick={() => setRecipients('segment')}
                  className="flex-1"
                >
                  Por Segmento
                </Button>
                <Button
                  type="button"
                  variant={recipients === 'custom' ? 'default' : 'outline'}
                  onClick={() => setRecipients('custom')}
                  className="flex-1"
                >
                  Personalizado
                </Button>
              </div>
            </div>

            {recipients === 'segment' && (
              <div className="space-y-2">
                <Label htmlFor="segment">Seleccionar Segmento</Label>
                <select
                  id="segment"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="vip">VIP</option>
                  <option value="new">Nuevos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            )}

            {recipients === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customRecipients">Destinatarios Personalizados (separados por coma)</Label>
                <textarea
                  id="customRecipients"
                  rows="3"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="ej: +1234567890, +1987654321 (para WhatsApp) o email1@ejemplo.com, email2@ejemplo.com (para Email)"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {sendResult && (
          <Alert variant={sendResult.success ? "default" : "destructive"}>
            {sendResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {sendResult.success 
                ? `Mensaje enviado exitosamente. Enviados: ${sendResult.sent}, Fallidos: ${sendResult.failed}.`
                : sendResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Mensaje'
          )}
        </Button>
      </form>
    </div>
  )
}

function ProgramadosSection() {
  const [scheduledMessages, setScheduledMessages] = useState([
    { id: 1, title: 'Ofertas de Primavera', channel: 'whatsapp', date: '2025-03-15 10:00 AM', status: 'Pendiente', recipients: 'VIP' },
    { id: 2, title: 'Newsletter Mensual', channel: 'email', date: '2025-03-20 09:00 AM', status: 'Enviado', recipients: 'Todos' },
    { id: 3, title: 'Recordatorio de Pago', channel: 'whatsapp', date: '2025-03-22 02:00 PM', status: 'Fallido', recipients: 'Inactivos' },
  ])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Envíos Programados</h2>
      <p className="text-gray-600">Gestiona tus mensajes programados para envío futuro.</p>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Envíos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatarios</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{msg.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{msg.channel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        msg.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        msg.status === 'Enviado' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.recipients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HistorialSection() {
  const { historyStats, loading, error } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando historial...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const stats = historyStats || {
    totalSent: 15000,
    delivered: 14500,
    failed: 500,
    whatsappSent: 10000,
    emailSent: 5000,
    recentSends: [
      { id: 1, campaign: 'Oferta Black Friday', date: '2024-11-29', channel: 'email', status: 'delivered', sent: 5000, delivered: 4900, failed: 100 },
      { id: 2, campaign: 'Lanzamiento Nuevo Producto', date: '2025-01-10', channel: 'whatsapp', status: 'delivered', sent: 3000, delivered: 2950, failed: 50 },
      { id: 3, campaign: 'Encuesta de Satisfacción', date: '2025-02-01', channel: 'email', status: 'delivered', sent: 2000, delivered: 1980, failed: 20 },
      { id: 4, campaign: 'Promoción Verano', date: '2025-03-05', channel: 'whatsapp', status: 'failed', sent: 1000, delivered: 800, failed: 200 },
    ]
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Historial y Estadísticas</h2>
      <p className="text-gray-600">Revisa el rendimiento de tus campañas de mensajes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Total Enviados</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Entregados</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envíos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviados</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregados</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fallidos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentSends.map((send) => (
                  <tr key={send.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{send.campaign}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{send.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{send.channel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        send.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {send.status === 'delivered' ? 'Entregado' : 'Fallido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{send.sent.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{send.delivered.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{send.failed.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfiguracionSection() {
  const { config, loading, error, updateConfig } = useConfig()
  const [whatsappToken, setWhatsappToken] = useState(config?.whatsappToken || '')
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(config?.whatsappPhoneId || '')
  const [smtpHost, setSmtpHost] = useState(config?.smtpHost || '')
  const [smtpPort, setSmtpPort] = useState(config?.smtpPort || '')
  const [smtpUser, setSmtpUser] = useState(config?.smtpUser || '')
  const [smtpPass, setSmtpPass] = useState(config?.smtpPass || '')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveResult, setSaveResult] = useState(null)

  useEffect(() => {
    if (config) {
      setWhatsappToken(config.whatsappToken || '')
      setWhatsappPhoneId(config.whatsappPhoneId || '')
      setSmtpHost(config.smtpHost || '')
      setSmtpPort(config.smtpPort || '')
      setSmtpUser(config.smtpUser || '')
      setSmtpPass(config.smtpPass || '')
    }
  }, [config])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setSaveResult(null)

    try {
      const result = await updateConfig({
        whatsappToken,
        whatsappPhoneId,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass
      })
      setSaveResult(result)
    } catch (err) {
      setSaveResult({ success: false, message: err.message || 'Error al guardar configuración.' })
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando configuración...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
      <p className="text-gray-600">Configura tus integraciones y preferencias de cuenta.</p>

      <form onSubmit={handleSaveConfig} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Integración WhatsApp Business API</CardTitle>
            <CardDescription>Configura tus credenciales para enviar mensajes por WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappToken">Token de Acceso</Label>
              <Input
                id="whatsappToken"
                type="password"
                placeholder="Ingresa tu token de acceso de WhatsApp"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappPhoneId">ID de Número de Teléfono</Label>
              <Input
                id="whatsappPhoneId"
                type="text"
                placeholder="Ingresa el ID de tu número de teléfono de WhatsApp"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Email (SMTP)</CardTitle>
            <CardDescription>Configura tus credenciales SMTP para enviar correos electrónicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input
                id="smtpHost"
                type="text"
                placeholder="ej: smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Puerto SMTP</Label>
              <Input
                id="smtpPort"
                type="number"
                placeholder="ej: 587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuario SMTP</Label>
              <Input
                id="smtpUser"
                type="text"
                placeholder="ej: tu_email@ejemplo.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPass">Contraseña SMTP</Label>
              <Input
                id="smtpPass"
                type="password"
                placeholder="Ingresa tu contraseña SMTP"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {saveResult && (
          <Alert variant={saveResult.success ? "default" : "destructive"}>
            {saveResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {saveResult.success 
                ? 'Configuración guardada exitosamente.'
                : saveResult.message}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-blue-600 hover:bg-blue-700"
          disabled={saveLoading}
        >
          {saveLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </form>
    </div>
  )
}



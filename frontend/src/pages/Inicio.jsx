import { useStats } from "@/hooks/useStats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Alert, AlertDescription } from "@/components/ui/alert.jsx"
import { Users, Send, BarChart3, Clock, Loader2, AlertCircle } from "lucide-react"

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

export default InicioSection

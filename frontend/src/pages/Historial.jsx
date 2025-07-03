import { useStats } from "@/hooks/useStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Alert, AlertDescription } from "@/components/ui/alert.jsx"
import { Loader2, AlertCircle } from "lucide-react"

function HistorialSection({ sentMessages }) {
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
      { id: 1, campaign: 'Oferta Black Friday', date: '2024-11-29', channel: 'whatsapp', status: 'delivered', sent: 5000, delivered: 4900, failed: 100, content: '¡Aprovecha nuestras ofertas!' },
      { id: 2, campaign: 'Lanzamiento Nuevo Producto', date: '2025-01-10', channel: 'whatsapp', status: 'delivered', sent: 3000, delivered: 2950, failed: 50, content: '¡Nuevo producto disponible!' },
      { id: 3, campaign: 'Encuesta de Satisfacción', date: '2025-02-01', channel: 'whatsapp', status: 'delivered', sent: 2000, delivered: 1980, failed: 20, content: '¿Qué te pareció nuestro servicio?' },
      { id: 4, campaign: 'Promoción Verano', date: '2025-03-05', channel: 'whatsapp', status: 'failed', sent: 1000, delivered: 800, failed: 200, content: '¡Promoción de verano!' },
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatarios</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sentMessages.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-400">No hay mensajes enviados.</td></tr>
                ) : sentMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">{msg.content}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        msg.status === 'Enviado' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{msg.recipients.length} contacto(s)</td>
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

export default HistorialSection

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"

function ProgramadosSection({ scheduledMessages }) {
  // Reloj en tiempo real
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Envíos Programados</h2>
        <div className="text-sm text-gray-600 font-mono bg-gray-100 rounded px-3 py-1">
          Hora actual: {now.toLocaleString()}
        </div>
      </div>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatarios</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledMessages.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-400">No hay mensajes programados.</td></tr>
                ) : scheduledMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-6 py-4 whitespace-pre-wrap text-sm font-medium text-gray-900">{msg.content}</td>
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

export default ProgramadosSection

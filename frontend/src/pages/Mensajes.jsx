import { useState, useEffect } from "react"
import { useMessages } from "@/hooks/useMessages"
import { useConfig } from "@/hooks/useConfig"
import { useContacts } from "@/hooks/useContacts"
import { sendWhatsAppMessage } from "@/services/api"
import { Button } from "@/components/ui/button.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Loader2 } from "lucide-react"

function MensajesSection({ scheduledMessages, setScheduledMessages, sentMessages, setSentMessages }) {
  const { sendMessage, loading, error } = useMessages()
  const { whatsappStatus, checkWhatsappStatus } = useConfig()
  const { contacts, loading: contactsLoading, error: contactsError } = useContacts()
  const [messageContent, setMessageContent] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [waResult, setWaResult] = useState(null)
  const [waLoading, setWaLoading] = useState(false)
  const [schedule, setSchedule] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  // Buscador de contactos
  const [search, setSearch] = useState('')

  useEffect(() => {
    checkWhatsappStatus()
  }, [])

  // Efecto robusto para envío programado: un solo intervalo global
  useEffect(() => {
    let isProcessing = false;
    const timer = setInterval(async () => {
      if (isProcessing) return;
      isProcessing = true;
      setScheduledMessages((msgs) => {
        const now = new Date();
        // Buscar el primer mensaje pendiente y listo para enviar
        const idx = msgs.findIndex(
          (msg) => msg.status === 'Pendiente' && msg.date && !isNaN(new Date(msg.date).getTime()) && new Date(msg.date) <= now
        );
        if (idx === -1) return msgs;
        const msg = msgs[idx];
        // Marcar como Enviando
        const updatedMsgs = msgs.map((m, i) =>
          i === idx ? { ...m, status: 'Enviando' } : m
        );
        // Enviar fuera del setState para evitar problemas de concurrencia
        setTimeout(async () => {
          for (const to of msg.recipients) {
            try {
              await sendWhatsAppMessage({ to, message: msg.content });
            } catch (err) {
              console.error('Error enviando mensaje programado:', err);
            }
          }
          setScheduledMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, status: 'Enviado', sentAt: new Date().toISOString() } : m
            )
          );
          setSentMessages((prev) =>
            prev.some((m) => m.id === msg.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: msg.id,
                    content: msg.content,
                    recipients: msg.recipients,
                    date: msg.date,
                    sentAt: new Date().toISOString(),
                    status: 'Enviado',
                  },
                ]
          );
        }, 0);
        return updatedMsgs;
      });
      isProcessing = false;
    }, 1000);
    return () => clearInterval(timer);
  }, [setScheduledMessages, setSentMessages])

  const handleContactCheck = (number) => {
    setSelectedContacts((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    )
  }

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    setWaResult(null);
    setWaLoading(true);
    try {
      if (schedule && scheduledDate) {
        // Guardar mensaje programado en el estado global
        setScheduledMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: messageContent,
            recipients: selectedContacts,
            date: scheduledDate,
            status: 'Pendiente',
          },
        ])
        setWaResult({ success: true, message: 'Mensaje programado correctamente.' });
        setMessageContent('');
        setSelectedContacts([]);
        setScheduledDate('');
        setSchedule(false);
        setWaLoading(false);
        return;
      }
      // Envío inmediato a todos los seleccionados
      for (const to of selectedContacts) {
        await sendWhatsAppMessage({ to, message: messageContent });
      }
      // Guardar en historial de enviados
      setSentMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: messageContent,
          recipients: selectedContacts,
          date: new Date().toISOString(),
          status: 'Enviado',
        },
      ])
      setWaResult({ success: true, message: 'Mensaje(s) enviado(s) correctamente.' });
      setMessageContent('');
      setSelectedContacts([]);
    } catch (err) {
      setWaResult({ success: false, message: err.message });
    } finally {
      setWaLoading(false);
    }
  };

  // Filtrar contactos por búsqueda
  const filteredContacts = contacts
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .filter(contact =>
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.number?.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Crear y Enviar Mensajes</h2>
      <p className="text-gray-600">Redacta tu mensaje y selecciona los destinatarios.</p>

      <Card>
        <CardHeader>
          <CardTitle>Contenido del Mensaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSendWhatsApp} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="waTo">Destinatarios</Label>
              <Input
                type="text"
                placeholder="Buscar contacto por nombre o número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mb-2"
              />
              {contactsLoading ? (
                <div className="text-gray-500">Cargando contactos...</div>
              ) : contactsError ? (
                <div className="text-red-500">Error al cargar contactos</div>
              ) : (
                <div className="border rounded p-2 max-h-48 overflow-y-auto bg-gray-50">
                  {filteredContacts.map(contact => (
                    <label key={contact.id} className="flex items-center space-x-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.number)}
                        onChange={() => handleContactCheck(contact.number)}
                      />
                      <span>{contact.name} ({contact.number})</span>
                    </label>
                  ))}
                  {filteredContacts.length === 0 && (
                    <div className="text-xs text-gray-400 px-2 py-1">No se encontraron contactos.</div>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">Seleccionados: {selectedContacts.length}</div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="schedule"
                checked={schedule}
                onChange={e => setSchedule(e.target.checked)}
              />
              <Label htmlFor="schedule">Programar mensaje</Label>
              {schedule && (
                <input
                  type="datetime-local"
                  className="ml-2 border rounded px-2 py-1"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required={schedule}
                />
              )}
            </div>
            <Button type="submit" disabled={waLoading || !messageContent || selectedContacts.length === 0 || (schedule && !scheduledDate)} className="w-full">
              {waLoading ? (schedule ? 'Programando...' : 'Enviando...') : (schedule ? 'Programar Mensaje' : 'Enviar WhatsApp')}
            </Button>
            {waResult && (
              <div className={waResult.success ? 'text-green-600' : 'text-red-600'}>
                {waResult.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default MensajesSection

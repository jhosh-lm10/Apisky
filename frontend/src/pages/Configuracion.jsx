import { useState } from "react"
import { useConfig } from "@/hooks/useConfig"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Button } from "@/components/ui/button.jsx"
import { Alert, AlertDescription } from "@/components/ui/alert.jsx"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

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



export default ConfiguracionSection

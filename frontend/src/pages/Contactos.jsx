import { useState } from "react"
import { useContacts } from "@/hooks/useContacts"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Alert, AlertDescription } from "@/components/ui/alert.jsx"
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react"

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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segmento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts
                    .slice()
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{contact.segment || '-'}</td>
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

export default ContactosSection

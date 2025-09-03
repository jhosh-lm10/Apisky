; Script personalizado para el instalador NSIS
; Este archivo se incluye en el instalador generado por electron-builder

; Configuración del instalador
!define APPNAME "Apisky"
!define APPVERSION "1.0.0"
!define APPCOMPANY "Apisky Team"

; Información del producto
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "ProductVersion" "${APPVERSION}"
VIAddVersionKey "CompanyName" "${APPCOMPANY}"
VIAddVersionKey "FileDescription" "WhatsApp Mass Messaging Application"
VIAddVersionKey "FileVersion" "${APPVERSION}"
VIAddVersionKey "LegalCopyright" "© 2024 ${APPCOMPANY}"

; Función personalizada que se ejecuta después de la instalación
Function .onInstSuccess
  ; Crear acceso directo adicional en el escritorio con nombre personalizado
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" "$INSTDIR\${APPNAME}.exe" 0
  
  ; Mostrar mensaje de instalación exitosa
  MessageBox MB_OK "¡${APPNAME} se ha instalado correctamente!$\r$\n$\r$\nPuedes encontrar el acceso directo en tu escritorio y menú de inicio."
FunctionEnd

; Función que se ejecuta antes de desinstalar
Function un.onInit
  MessageBox MB_YESNO "¿Estás seguro de que quieres desinstalar ${APPNAME}?" IDYES uninst
  Abort
  uninst:
FunctionEnd

; Función que se ejecuta después de desinstalar
Function un.onUninstSuccess
  MessageBox MB_OK "${APPNAME} ha sido desinstalado correctamente."
FunctionEnd

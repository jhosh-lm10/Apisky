[Setup]
AppName=Apisky - WhatsApp Mass Messaging
AppVersion=1.0.0
AppPublisher=Apisky Developer
AppPublisherURL=https://github.com/apisky
AppSupportURL=https://github.com/apisky
AppUpdatesURL=https://github.com/apisky
DefaultDirName={autopf}\Apisky
DefaultGroupName=Apisky
AllowNoIcons=yes
LicenseFile=README.txt
OutputDir=dist
OutputBaseFilename=Apisky-Setup
SetupIconFile=assets\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "dist\Apisky-Executable\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "README.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Apisky"; Filename: "{app}\Iniciar-Apisky.bat"
Name: "{group}\{cm:UninstallProgram,Apisky}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Apisky"; Filename: "{app}\Iniciar-Apisky.bat"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Apisky"; Filename: "{app}\Iniciar-Apisky.bat"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\Instalar-Dependencias.bat"; Description: "Instalar dependencias (requerido)"; Flags: runhidden
Filename: "{app}\Iniciar-Apisky.bat"; Description: "Iniciar Apisky ahora"; Flags: postinstall nowait skipifsilent

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Crear acceso directo en el escritorio si se seleccionó
    if WizardIsTaskSelected('desktopicon') then
    begin
      CreateShortcut(ExpandConstant('{autodesktop}') + '\Apisky.lnk',
        ExpandConstant('{app}') + '\Iniciar-Apisky.bat',
        '', 'Apisky - WhatsApp Mass Messaging',
        ExpandConstant('{app}'), 0, SW_SHOWNORMAL);
    end;
  end;
end;

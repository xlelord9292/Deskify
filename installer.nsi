; Deskify manual NSIS installer script (alternative to electron-builder)
; Build prerequisites: Install NSIS (https://nsis.sourceforge.io/Download)
; Then run: makensis installer.nsi

OutFile "DeskifySetup.exe"
InstallDir "$LOCALAPPDATA\Deskify"
InstallDirRegKey HKCU "Software\Deskify" "InstallDir"
RequestExecutionLevel user
!define APP_EXEC "Deskify.exe"

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  ; Copy packaged app produced by: npm run pack:win (alt-dist/Deskify-win32-x64)
  File /r "alt-dist\Deskify-win32-x64\*"
  ; Persist install dir
  WriteRegStr HKCU "Software\Deskify" "InstallDir" "$INSTDIR"
  ; Shortcuts
  CreateShortCut "$DESKTOP\Deskify.lnk" "$INSTDIR\Deskify.exe" "" "$INSTDIR\resources\app.asar" 0
  CreateShortCut "$SMPROGRAMS\Deskify.lnk" "$INSTDIR\Deskify.exe"
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\Deskify.lnk"
  Delete "$SMPROGRAMS\Deskify.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Deskify"
SectionEnd

; Optional: Preserve user data at $APPDATA\Deskify (electron userData path). We don't remove it here.

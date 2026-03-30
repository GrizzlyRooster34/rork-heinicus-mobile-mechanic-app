param(
  [string]$GradleTask = "assembleDebug"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"

if (!(Test-Path $androidDir)) {
  throw "Android project not found at: $androidDir"
}

$javaHome = $env:JAVA_HOME
if ([string]::IsNullOrWhiteSpace($javaHome)) {
  $candidate = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($candidate) {
    $javaHome = $candidate.FullName
  }
}

if ([string]::IsNullOrWhiteSpace($javaHome) -or !(Test-Path (Join-Path $javaHome "bin\java.exe"))) {
  throw "JAVA_HOME is not configured correctly. Install JDK 17 and set JAVA_HOME."
}

$androidHome = $env:ANDROID_HOME
if ([string]::IsNullOrWhiteSpace($androidHome)) {
  $androidHome = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

if (!(Test-Path (Join-Path $androidHome "platform-tools\adb.exe"))) {
  throw "ANDROID_HOME is not configured correctly. Expected Android SDK at: $androidHome"
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:NODE_ENV = "development"
$env:Path = "$javaHome\bin;$androidHome\platform-tools;$env:Path"

Push-Location $androidDir
try {
  & .\gradlew.bat $GradleTask --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle task failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

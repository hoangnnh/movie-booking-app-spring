param(
    [switch]$KeepServerRunning
)

$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $env:TMDB_API_READ_ACCESS_TOKEN) {
    Write-Error "TMDB_API_READ_ACCESS_TOKEN is not set. Export it first, then run this script again."
    exit 1
}

$env:APP_TMDB_TRAILER_BACKFILL_ENABLED = "true"

if ($KeepServerRunning.IsPresent) {
    $env:APP_TMDB_TRAILER_BACKFILL_EXIT_AFTER_RUN = "false"
} else {
    $env:APP_TMDB_TRAILER_BACKFILL_EXIT_AFTER_RUN = "true"
}

$wrapperProperties = Join-Path $backendRoot ".mvn\wrapper\maven-wrapper.properties"
$wrapperScript = Join-Path $backendRoot "mvnw.cmd"
$mavenCommand = Get-Command "mvn" -ErrorAction SilentlyContinue

Push-Location $backendRoot

try {
    if ((Test-Path $wrapperScript) -and (Test-Path $wrapperProperties)) {
        & $wrapperScript spring-boot:run
        exit $LASTEXITCODE
    }

    if ($mavenCommand) {
        & $mavenCommand.Source spring-boot:run
        exit $LASTEXITCODE
    }

    Write-Host "No runnable Maven command was found."
    Write-Host "Start the backend your usual way after setting:"
    Write-Host "  APP_TMDB_TRAILER_BACKFILL_ENABLED=true"
    Write-Host "  APP_TMDB_TRAILER_BACKFILL_EXIT_AFTER_RUN=true"
    exit 1
} finally {
    Pop-Location
}

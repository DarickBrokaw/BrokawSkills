$envAppData = $env:APPDATA
if (-not $envAppData) {
    throw "APPDATA environment variable is not set."
}
$bundleRoot = Join-Path $envAppData 'Autodesk\ApplicationPlugins\DTCAI.bundle'
$skillRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$assetsRoot = Join-Path $skillRoot 'assets'

$contentsSource = Join-Path $assetsRoot 'Contents'
$resourcesSource = Join-Path $assetsRoot 'Resources'

Write-Host "Installing DTCAI bundle to $bundleRoot"
New-Item -ItemType Directory -Path $bundleRoot -Force | Out-Null

Copy-Item -Path (Join-Path $assetsRoot 'PackageContents.xml') -Destination $bundleRoot -Force
Copy-Item -Path (Join-Path $assetsRoot 'DTC.addin') -Destination $bundleRoot -Force

if (Test-Path $resourcesSource) {
    $destResources = Join-Path $bundleRoot 'Resources'
    Remove-Item -Recurse -Force (Join-Path $bundleRoot 'Resources') -ErrorAction SilentlyContinue
    Copy-Item -Path $resourcesSource -Destination $destResources -Recurse -Force
}

foreach ($year in @(2025, 2026)) {
    $sourceDir = Join-Path $contentsSource ($year.ToString())
    if (-not (Test-Path $sourceDir)) {
        Write-Warning "Missing assets for $year."
        continue
    }

    $destDir = Join-Path $bundleRoot "Contents\$year"
    Remove-Item -Recurse -Force $destDir -ErrorAction SilentlyContinue
    Copy-Item -Path $sourceDir -Destination $destDir -Recurse -Force
}

Write-Host 'DTCAI bundle install complete. Restart Revit to load the updated add-in.'

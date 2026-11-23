param([switch]$PrepareOnly)

$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$lab = Join-Path $project 'lab-private\eu-runtime'
$exe = Join-Path $lab 'app\dw3recomp.exe'
$profile = Join-Path $lab 'profile'
$local = Join-Path $lab 'local'
$temp = Join-Path $lab 'tmp'
$card = Join-Path $profile 'DW3Recomp\memcards\slot1.mcd'
$disc = Join-Path $lab 'disc\Digimon World 2003 (Europe) (En,Fr,De,Es,It).cue'
$bin = [IO.Path]::ChangeExtension($disc, '.bin')

foreach ($path in @($project, (Join-Path $project 'lab-private'), $lab, $exe, $profile, $local, $temp, $card, $disc, $bin)) {
    if (!(Test-Path -LiteralPath $path)) { throw "Missing isolated lab path: $path" }
    if ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked lab path: $path" }
}
foreach ($path in @($profile, $local, $temp, (Join-Path $lab 'app'), (Join-Path $lab 'disc'))) {
    if (Get-ChildItem -LiteralPath $path -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint } | Select-Object -First 1) {
        throw "Linked contents inside lab: $path"
    }
}
if ((Get-Content -LiteralPath $disc -TotalCount 1) -ne 'FILE "Digimon World 2003 (Europe) (En,Fr,De,Es,It).bin" BINARY') { throw 'Unexpected CUE reference' }
if ((Get-FileHash -Algorithm SHA1 -LiteralPath $bin).Hash -ne '457CB233349BA841E03B33D8060F8FBCADD45CB3') { throw 'Wrong European disc' }
if (Test-Path -LiteralPath (Join-Path $lab 'app\dxgi.dll')) { throw 'Clean validation requires no local DXGI injector; disable it in the isolated lab before running.' }

$envMap = @{ APPDATA = $profile; LOCALAPPDATA = $local; TEMP = $temp; TMP = $temp; ZIG_GLOBAL_CACHE_DIR = (Join-Path $local 'zig-global'); ZIG_LOCAL_CACHE_DIR = (Join-Path $local 'zig-local') }
$previous = @{}
foreach ($key in $envMap.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $envMap[$key], 'Process')
}
Push-Location -LiteralPath $lab
try {
    & $exe --disc $disc --no-config --prepare
    if ($LASTEXITCODE -ne 0) { throw "EU preparation failed ($LASTEXITCODE); no gameplay validation performed." }
    if (!$PrepareOnly) {
        & $exe --disc $disc --no-config --memcard1 $card --renderer software --window-size 960x720
        if ($LASTEXITCODE -ne 0) { throw "EU run failed ($LASTEXITCODE)" }
    }
} finally {
    Pop-Location
    foreach ($key in $envMap.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}

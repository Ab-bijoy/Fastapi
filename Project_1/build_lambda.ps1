# =============================================================
# build_lambda.ps1 — Build Lambda deployment package on Windows
# =============================================================
# Run:  powershell -ExecutionPolicy Bypass -File .\build_lambda.ps1
# =============================================================

$ErrorActionPreference = "Stop"

Write-Host "=== Step 1: Generating requirements.txt ===" -ForegroundColor Cyan
poetry run pip freeze > requirements.txt
if (-not (Test-Path "requirements.txt")) {
    Write-Error "Failed to generate requirements.txt"
    exit 1
}

# Relax exact version pinning for C-extensions that don't have matching wheels for Linux
(Get-Content requirements.txt) -replace 'greenlet==.*', 'greenlet' | Set-Content requirements.txt
(Get-Content requirements.txt) -replace 'psycopg2-binary==.*', 'psycopg2-binary' | Set-Content requirements.txt
(Get-Content requirements.txt) -replace 'pydantic-core==.*', 'pydantic-core' | Set-Content requirements.txt

Write-Host "=== Step 2: Cleaning previous build ===" -ForegroundColor Cyan
if (Test-Path "package") { Remove-Item -Recurse -Force "package" }
if (Test-Path "lambda_function.zip") { Remove-Item -Force "lambda_function.zip" }

Write-Host "=== Step 3: Installing dependencies (Linux wheels for Lambda) ===" -ForegroundColor Cyan
# Force disable the --user flag globally in case it is set in pip.ini
$env:PIP_USER = "false"

# Run pip from within poetry's virtual environment
poetry run python -m pip install `
    -r requirements.txt `
    -t package `
    --platform manylinux2014_x86_64 `
    --implementation cp `
    --python-version 3.11 `
    --only-binary=:all: `
    --upgrade `
    --quiet

Write-Host "=== Step 4: Copying application source code ===" -ForegroundColor Cyan
# Create the project package directory
New-Item -ItemType Directory -Path "package\project" -Force | Out-Null

# Copy all Python source files
Copy-Item "src\project\__init__.py" "package\project\"
Copy-Item "src\project\main.py"    "package\project\"
Copy-Item "src\project\db.py"      "package\project\"
Copy-Item "src\project\models.py"  "package\project\"

# Copy Routers
New-Item -ItemType Directory -Path "package\project\Routers" -Force | Out-Null
Copy-Item "src\project\Routers\*" "package\project\Routers\" -Recurse -Exclude "__pycache__"

Write-Host "=== Step 5: Creating lambda_function.zip ===" -ForegroundColor Cyan
Compress-Archive -Path "package\*" -DestinationPath "lambda_function.zip" -Force

$zipSize = (Get-Item "lambda_function.zip").Length / 1MB
Write-Host ""
Write-Host "BUILD COMPLETE!" -ForegroundColor Green
Write-Host "  Output: lambda_function.zip ($([math]::Round($zipSize, 1)) MB)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Upload lambda_function.zip to AWS Lambda" -ForegroundColor Yellow
Write-Host "  2. Set Handler to:  project.main.handler" -ForegroundColor Yellow
Write-Host "  3. Set environment variables:" -ForegroundColor Yellow
Write-Host "       DATABASE_URL = postgresql://user:pass@your-rds-host:5432/dbname" -ForegroundColor Yellow
Write-Host "       SECRET_KEY   = your-production-secret-key" -ForegroundColor Yellow
Write-Host "  4. Add an HTTP API Gateway trigger" -ForegroundColor Yellow

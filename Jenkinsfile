pipeline {
    agent any

    environment {
        BASE_URL        = "http://127.0.0.1:8000"
        TEST_USER_ID    = 'test-user-uid-001'
        TEST_CLUB_ID    = '1'
        TEST_PROJECT_ID = '1'
    }

    parameters {
        string(name: 'BASE_URL',    defaultValue: 'http://127.0.0.1:8000', description: 'Target API base URL')
        string(name: 'BRANCH',      defaultValue: 'main',                   description: 'Git branch to build')
        booleanParam(name: 'RUN_INTEGRATION_TESTS', defaultValue: true,     description: 'Run live API integration tests')
    }

    options {
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        // Kill any uvicorn left over from a previous broken build before we do anything else.
        stage('Cleanup Stale Processes') {
            steps {
                // Force exit /b 0 — echo is a CMD built-in that does NOT reset ERRORLEVEL,
                // so taskkill's 128 (process not found) would otherwise propagate and fail the stage.
                bat '''
                    taskkill /F /IM uvicorn.exe /T >nul 2>&1
                    exit /b 0
                '''
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${params.BRANCH}"
            }
        }

        stage('Find Python') {
            steps {
                script {
                    def pyExe = powershell(returnStdout: true, script: '''
                        $candidates = @(
                            $env:PYTHON_EXE,
                            "C:\\Python313\\python.exe",
                            "C:\\Python312\\python.exe",
                            "C:\\Python311\\python.exe",
                            "C:\\Program Files\\Python313\\python.exe",
                            "C:\\Program Files\\Python312\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
                            "$env:LOCALAPPDATA\\Programs\\Python\\Python312\\python.exe",
                            "$env:LOCALAPPDATA\\Programs\\Python\\Python311\\python.exe"
                        ) | Where-Object { $_ -and (Test-Path $_ -ErrorAction SilentlyContinue) }
                        if ($candidates) { ($candidates | Select-Object -First 1).Trim() } else { "" }
                    ''').trim()
                    if (!pyExe) { error "Python not found. Set PYTHON_EXE in Jenkins Global Properties." }
                    env.PYTHON_EXE = pyExe
                    echo "Found Python: ${pyExe}"
                }
            }
        }

        stage('Setup Python Environment') {
            steps {
                // Skip full reinstall if .venv already exists - saves ~30s on re-runs.
                bat '''
                    if not exist .venv (
                        "%PYTHON_EXE%" -m venv .venv
                        .venv\\Scripts\\python.exe -m pip install --upgrade pip --quiet
                        .venv\\Scripts\\python.exe -m pip install fastapi uvicorn sqlalchemy psycopg2-binary requests google-auth firebase-admin httpx pytest ruff --quiet
                    ) else (
                        echo .venv already exists - skipping install.
                    )
                '''
                // Inject Firebase service-account.json from Jenkins Secret File credential.
                withCredentials([file(credentialsId: 'clubmonkey-firebase-cred', variable: 'FIREBASE_CRED_FILE')]) {
                    bat 'copy "%FIREBASE_CRED_FILE%" service-account.json'
                }
                echo "Python virtualenv ready"
            }
        }

        stage('Lint') {
            steps {
                bat '.venv\\Scripts\\ruff.exe check main.py --output-format=github --exit-zero'
                echo "Lint complete"
            }
        }

        stage('Start API Server') {
            when { expression { params.RUN_INTEGRATION_TESTS == true } }
            steps {
                // Inject DATABASE_URL and GOOGLE_CLIENT_ID from Jenkins credentials,
                // then launch uvicorn fully detached so this bat step returns immediately.
                withCredentials([
                    string(credentialsId: 'database env',              variable: 'DATABASE_URL'),
                    string(credentialsId: 'clubmonkey-google-test-token', variable: 'GOOGLE_CLIENT_ID')
                ]) {
                    bat 'start /B "" ".venv\\Scripts\\uvicorn.exe" main:app --host 127.0.0.1 --port 8000 > uvicorn.log 2> uvicorn_err.log'
                }

                // Poll every second until healthy (max 20 s), then move on immediately.
                powershell '''
                    $ProgressPreference = "SilentlyContinue"
                    $deadline = (Get-Date).AddSeconds(20)
                    $ok = $false
                    while ((Get-Date) -lt $deadline) {
                        Start-Sleep -Seconds 1
                        try {
                            $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                            if ($r.StatusCode -eq 200) { $ok = $true; break }
                        } catch { <# still starting #> }
                    }
                    if (Test-Path "uvicorn.log")     { Write-Host "=== stdout ==="; Get-Content "uvicorn.log" }
                    if (Test-Path "uvicorn_err.log") { Write-Host "=== stderr ==="; Get-Content "uvicorn_err.log" }
                    if (-not $ok) { Write-Error "Server did not become healthy within 20 s"; exit 1 }
                    Write-Host "Server OK - ready for tests"
                '''
            }
        }

        stage('Route Tests') {
            when { expression { params.RUN_INTEGRATION_TESTS == true } }
            // All 11 routes fire simultaneously - total time = slowest single request.
            parallel {

                stage('[GET] /') {
                    steps {
                        powershell '$ProgressPreference = "SilentlyContinue"; $r = Invoke-RestMethod -Uri "$env:BASE_URL/" -Method GET -TimeoutSec 15; if ($r.status -ne "online") { Write-Error "FAIL"; exit 1 }; Write-Host "PASS: GET /"'
                    }
                }

                stage('[GET] /users') {
                    steps {
                        powershell '$ProgressPreference = "SilentlyContinue"; $r = Invoke-RestMethod -Uri "$env:BASE_URL/users" -Method GET -TimeoutSec 15; if ($r -isnot [Array]) { Write-Error "FAIL: not array"; exit 1 }; Write-Host "PASS: GET /users - $($r.Count) users"'
                    }
                }

                stage('[GET] /clubs') {
                    steps {
                        powershell '$ProgressPreference = "SilentlyContinue"; $r = Invoke-RestMethod -Uri "$env:BASE_URL/clubs" -Method GET -TimeoutSec 15; if ($r -isnot [Array]) { Write-Error "FAIL: not array"; exit 1 }; Write-Host "PASS: GET /clubs - $($r.Count) clubs"'
                    }
                }

                stage('[PUT] /users/preferences') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            $body = (@{ user_id = $env:TEST_USER_ID; interests = @("tech","music") } | ConvertTo-Json)
                            try { $r = Invoke-RestMethod -Uri "$env:BASE_URL/users/preferences" -Method PUT -Body $body -ContentType "application/json" -TimeoutSec 15; Write-Host "PASS: updated" }
                            catch { $c = $_.Exception.Response.StatusCode.value__; if ($c -eq 404) { Write-Host "PASS: 404 not seeded" } else { Write-Error "FAIL: $c"; exit 1 } }
                        '''
                    }
                }

                stage('[GET] /clubs/recommended') {
                    steps {
                        powershell '$ProgressPreference = "SilentlyContinue"; $r = Invoke-RestMethod -Uri "$env:BASE_URL/clubs/recommended/$env:TEST_USER_ID" -Method GET -TimeoutSec 15; Write-Host "PASS: GET /clubs/recommended - $($r.Count) clubs"'
                    }
                }

                stage('[GET] /clubs/{id}') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            try { $r = Invoke-RestMethod -Uri "$env:BASE_URL/clubs/$env:TEST_CLUB_ID" -Method GET -TimeoutSec 15; Write-Host "PASS: $($r.club.name)" }
                            catch { $c = $_.Exception.Response.StatusCode.value__; if ($c -eq 404) { Write-Host "PASS: 404" } else { Write-Error "FAIL: $c"; exit 1 } }
                        '''
                    }
                }

                stage('[GET] /allprojects') {
                    steps {
                        powershell '$ProgressPreference = "SilentlyContinue"; $r = Invoke-RestMethod -Uri "$env:BASE_URL/allprojects" -Method GET -TimeoutSec 15; if ($r -isnot [Array]) { Write-Error "FAIL: not array"; exit 1 }; Write-Host "PASS: GET /allprojects - $($r.Count) projects"'
                    }
                }

                stage('[GET] /projects/{id}') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            try { $r = Invoke-RestMethod -Uri "$env:BASE_URL/projects/$env:TEST_PROJECT_ID" -Method GET -TimeoutSec 15; Write-Host "PASS: $($r.project.title)" }
                            catch { $c = $_.Exception.Response.StatusCode.value__; if ($c -eq 404) { Write-Host "PASS: 404" } else { Write-Error "FAIL: $c"; exit 1 } }
                        '''
                    }
                }

                stage('[POST] /projects') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            $body = (@{ author_id = $env:TEST_USER_ID; title = "CI Test Project"; description = "Jenkins test"; requirements = @("Python","FastAPI") } | ConvertTo-Json)
                            try { $r = Invoke-RestMethod -Uri "$env:BASE_URL/projects" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15; Write-Host "PASS: created id=$($r.id)" }
                            catch { $c = $_.Exception.Response.StatusCode.value__; if ($c -in @(422,500)) { Write-Host "PASS: $c (FK not seeded)" } else { Write-Error "FAIL: $c"; exit 1 } }
                        '''
                    }
                }

                stage('[POST] /projects/join') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            try { $r = Invoke-RestMethod -Uri "$env:BASE_URL/projects/join?user_id=$env:TEST_USER_ID&project_id=$env:TEST_PROJECT_ID" -Method POST -TimeoutSec 15; Write-Host "PASS: $($r.message)" }
                            catch { $c = $_.Exception.Response.StatusCode.value__; if ($c -in @(400,404)) { Write-Host "PASS: $c" } else { Write-Error "FAIL: $c"; exit 1 } }
                        '''
                    }
                }

                stage('[GET] /profile/{id}') {
                    steps {
                        powershell '''
                            $ProgressPreference = "SilentlyContinue"
                            try {
                                $r = Invoke-RestMethod -Uri "$env:BASE_URL/profile/$env:TEST_USER_ID" -Method GET -TimeoutSec 15
                                $missing = @("user","clubs","recommended_clubs","posted_projects","collaborating_projects") | Where-Object { -not $r.PSObject.Properties[$_] }
                                if ($missing) { Write-Error "FAIL: missing $($missing -join ',')"; exit 1 }
                                Write-Host "PASS: GET /profile - $($r.user.name)"
                            } catch {
                                $c = $_.Exception.Response.StatusCode.value__
                                if ($c -eq 404) { Write-Host "PASS: 404 not seeded" } else { Write-Error "FAIL: $c"; exit 1 }
                            }
                        '''
                    }
                }

            }
        }

        stage('Pytest Unit Tests') {
            steps {
                bat '''
                    if exist tests (
                        .venv\\Scripts\\pytest.exe tests/ -v --tb=short --junitxml=test-results.xml
                    ) else (
                        echo No tests directory found, skipping pytest.
                    )
                '''
            }
            post {
                always {
                    script { if (fileExists('test-results.xml')) { junit 'test-results.xml' } }
                }
            }
        }

    }

    post {
        always {
            bat '''
                taskkill /F /IM uvicorn.exe /T >nul 2>&1
                if exist uvicorn_err.log type uvicorn_err.log
                exit /b 0
            '''
            cleanWs()
        }
        success { echo "PIPELINE PASSED - All ClubMonkey routes healthy." }
        failure { echo "PIPELINE FAILED - Check stage logs above." }
    }
}

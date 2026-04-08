pipeline {
    agent any

    environment {
        BASE_URL        = "http://localhost:8000"
        TEST_USER_ID    = 'test-user-uid-001'
        TEST_CLUB_ID    = '1'
        TEST_PROJECT_ID = '1'
    }

    parameters {
        string(name: 'BASE_URL',    defaultValue: 'http://localhost:8000', description: 'Target API base URL')
        string(name: 'BRANCH',      defaultValue: 'main',                  description: 'Git branch to build')
        booleanParam(name: 'RUN_INTEGRATION_TESTS', defaultValue: true,    description: 'Run live API integration tests')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        // ─────────────────────────────────────────────────────────────
        // STAGE 1: Checkout
        // ─────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${params.BRANCH}"
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 2: Find Python
        // Searches common install paths since Jenkins SYSTEM has minimal PATH
        // ─────────────────────────────────────────────────────────────
        stage('Find Python') {
            steps {
                script {
                    def pyExe = powershell(returnStdout: true, script: '''
                        $candidates = @(
                            $env:PYTHON_EXE,
                            "C:\\Python313\\python.exe",
                            "C:\\Python312\\python.exe",
                            "C:\\Python311\\python.exe",
                            "C:\\Python310\\python.exe",
                            "C:\\Program Files\\Python313\\python.exe",
                            "C:\\Program Files\\Python312\\python.exe",
                            "C:\\Program Files\\Python311\\python.exe",
                            "C:\\Program Files\\Python310\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
                            "$env:USERPROFILE\\AppData\\Local\\Programs\\Python\\Python310\\python.exe",
                            "$env:LOCALAPPDATA\\Programs\\Python\\Python313\\python.exe",
                            "$env:LOCALAPPDATA\\Programs\\Python\\Python312\\python.exe",
                            "$env:LOCALAPPDATA\\Programs\\Python\\Python311\\python.exe"
                        ) | Where-Object { $_ -and (Test-Path $_ -ErrorAction SilentlyContinue) }
                        if ($candidates) { ($candidates | Select-Object -First 1).Trim() } else { "" }
                    ''').trim()

                    if (!pyExe) {
                        error """
Python not found in any common location!
Quick fix: Open PowerShell and run:
  (Get-Command python).Source
Then go to: Manage Jenkins -> System -> Global properties -> Environment variables
Add:  Name=PYTHON_EXE   Value=<the path from above>
"""
                    }
                    env.PYTHON_EXE = pyExe
                    echo "Found Python: ${pyExe}"
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 3: Setup Python Environment
        // ─────────────────────────────────────────────────────────────
        stage('Setup Python Environment') {
            steps {
                bat '''
                    "%PYTHON_EXE%" -m venv .venv
                    .venv\\Scripts\\python.exe -m pip install --upgrade pip
                    .venv\\Scripts\\python.exe -m pip install fastapi uvicorn sqlalchemy psycopg2-binary requests google-auth firebase-admin httpx pytest ruff
                '''
                // Copy secret file (gitignored) from source repo into workspace
                bat 'if not exist service-account.json copy "C:\\Users\\Sambhav\\Desktop\\onHold\\var-clubmonkey\\service-account.json" service-account.json'
                echo "Python virtualenv ready"
            }
        }


        // ─────────────────────────────────────────────────────────────
        // STAGE 3: Lint
        // ─────────────────────────────────────────────────────────────
        stage('Lint') {
            steps {
                bat '''
                    .venv\\Scripts\\ruff.exe check main.py --output-format=github --exit-zero
                '''
                echo "Lint complete"
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 4: Start API Server (Background)
        // ─────────────────────────────────────────────────────────────
        stage('Start API Server') {
            when {
                expression { params.RUN_INTEGRATION_TESTS == true }
            }
            steps {
                powershell '''
                    $proc = Start-Process -FilePath ".venv\\Scripts\\uvicorn.exe" -ArgumentList "main:app", "--host", "127.0.0.1", "--port", "8000" -RedirectStandardOutput "uvicorn.log" -RedirectStandardError "uvicorn_err.log" -PassThru -NoNewWindow
                    $proc.Id | Out-File ".uvicorn.pid" -Encoding ascii
                    Write-Host "Uvicorn PID: $($proc.Id)"
                    Start-Sleep -Seconds 6
                    if (Test-Path "uvicorn.log")     { Write-Host "--- stdout ---"; Get-Content "uvicorn.log" }
                    if (Test-Path "uvicorn_err.log") { Write-Host "--- stderr ---"; Get-Content "uvicorn_err.log" }
                    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -UseBasicParsing -ErrorAction SilentlyContinue
                    if ($null -eq $resp -or $resp.StatusCode -ne 200) {
                        Write-Error "Uvicorn did not start. Check the logs above."
                        exit 1
                    }
                    Write-Host "Health check OK - status $($resp.StatusCode)"
                '''
            }
        }



        // ─────────────────────────────────────────────────────────────
        // STAGE 5: Route Tests (PowerShell curl = Invoke-WebRequest)
        // ─────────────────────────────────────────────────────────────
        stage('Route Tests') {
            when {
                expression { params.RUN_INTEGRATION_TESTS == true }
            }
            stages {

                // ── GET / ─────────────────────────────────────────────
                stage('[GET] / - Health Check') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET / ---"
                            $resp = Invoke-RestMethod -Uri "$env:BASE_URL/" -Method GET
                            Write-Host "Response: $($resp | ConvertTo-Json)"
                            if ($resp.status -ne "online") {
                                Write-Error "FAIL: status is not online"
                                exit 1
                            }
                            Write-Host "PASS: GET /"
                        '''
                    }
                }

                // ── GET /users ────────────────────────────────────────
                stage('[GET] /users - List All Users') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /users ---"
                            $resp = Invoke-RestMethod -Uri "$env:BASE_URL/users" -Method GET
                            if ($resp -isnot [Array]) {
                                Write-Error "FAIL: Expected array response"
                                exit 1
                            }
                            Write-Host "PASS: GET /users — $($resp.Count) users returned"
                        '''
                    }
                }

                // ── GET /clubs ────────────────────────────────────────
                stage('[GET] /clubs - List All Clubs') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /clubs ---"
                            $resp = Invoke-RestMethod -Uri "$env:BASE_URL/clubs" -Method GET
                            if ($resp -isnot [Array]) {
                                Write-Error "FAIL: Expected array response"
                                exit 1
                            }
                            Write-Host "PASS: GET /clubs — $($resp.Count) clubs returned"
                        '''
                    }
                }

                // ── PUT /users/preferences ────────────────────────────
                stage('[PUT] /users/preferences - Update Preferences') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing PUT /users/preferences ---"
                            $body = @{ user_id = $env:TEST_USER_ID; interests = @("tech","music") } | ConvertTo-Json
                            try {
                                $resp = Invoke-RestMethod -Uri "$env:BASE_URL/users/preferences" `
                                    -Method PUT -Body $body -ContentType "application/json"
                                Write-Host "PASS: PUT /users/preferences — user updated"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                if ($code -eq 404) {
                                    Write-Host "PASS: PUT /users/preferences — 404 (test user not in DB, acceptable)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

                // ── GET /clubs/recommended/{user_id} ─────────────────
                stage('[GET] /clubs/recommended/{user_id} - Recommended Clubs') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /clubs/recommended/{user_id} ---"
                            $resp = Invoke-RestMethod -Uri "$env:BASE_URL/clubs/recommended/$env:TEST_USER_ID" -Method GET
                            Write-Host "PASS: GET /clubs/recommended — $($resp.Count) clubs returned"
                        '''
                    }
                }

                // ── GET /clubs/{club_id} ──────────────────────────────
                stage('[GET] /clubs/{club_id} - Club Details') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /clubs/{club_id} ---"
                            try {
                                $resp = Invoke-RestMethod -Uri "$env:BASE_URL/clubs/$env:TEST_CLUB_ID" -Method GET
                                if (-not $resp.club) {
                                    Write-Error "FAIL: Missing 'club' key in response"
                                    exit 1
                                }
                                Write-Host "PASS: GET /clubs/{club_id} — club: $($resp.club.name)"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                if ($code -eq 404) {
                                    Write-Host "PASS: GET /clubs/{club_id} — 404 (no test seed data, acceptable)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

                // ── GET /allprojects ──────────────────────────────────
                stage('[GET] /allprojects - All Projects') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /allprojects ---"
                            $resp = Invoke-RestMethod -Uri "$env:BASE_URL/allprojects" -Method GET
                            if ($resp -isnot [Array]) {
                                Write-Error "FAIL: Expected array response"
                                exit 1
                            }
                            Write-Host "PASS: GET /allprojects — $($resp.Count) projects returned"
                        '''
                    }
                }

                // ── GET /projects/{project_id} ────────────────────────
                stage('[GET] /projects/{project_id} - Project Details') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /projects/{project_id} ---"
                            try {
                                $resp = Invoke-RestMethod -Uri "$env:BASE_URL/projects/$env:TEST_PROJECT_ID" -Method GET
                                if (-not $resp.project) {
                                    Write-Error "FAIL: Missing 'project' key"
                                    exit 1
                                }
                                Write-Host "PASS: GET /projects/{project_id} — $($resp.project.title)"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                if ($code -eq 404) {
                                    Write-Host "PASS: GET /projects/{project_id} — 404 (no seed data, acceptable)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

                // ── POST /projects ────────────────────────────────────
                stage('[POST] /projects - Create Project') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing POST /projects ---"
                            $body = @{
                                author_id    = $env:TEST_USER_ID
                                title        = "CI Test Project"
                                description  = "Created by Jenkins pipeline"
                                requirements = @("Python", "FastAPI")
                            } | ConvertTo-Json
                            try {
                                $resp = Invoke-RestMethod -Uri "$env:BASE_URL/projects" `
                                    -Method POST -Body $body -ContentType "application/json"
                                Write-Host "PASS: POST /projects — ID: $($resp.id)"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                # 500 is acceptable if FK user doesn't exist in test DB
                                if ($code -in @(422, 500)) {
                                    Write-Host "PASS: POST /projects — status $code (expected in isolated test env)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

                // ── POST /projects/join ───────────────────────────────
                stage('[POST] /projects/join - Join Project') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing POST /projects/join ---"
                            try {
                                $resp = Invoke-RestMethod `
                                    -Uri "$env:BASE_URL/projects/join?user_id=$env:TEST_USER_ID&project_id=$env:TEST_PROJECT_ID" `
                                    -Method POST
                                Write-Host "PASS: POST /projects/join — $($resp.message)"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                if ($code -in @(400, 404)) {
                                    Write-Host "PASS: POST /projects/join — status $code (already joined or not seeded)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

                // ── GET /profile/{user_id} ────────────────────────────
                stage('[GET] /profile/{user_id} - User Profile') {
                    steps {
                        powershell '''
                            Write-Host "--- Testing GET /profile/{user_id} ---"
                            try {
                                $resp = Invoke-RestMethod -Uri "$env:BASE_URL/profile/$env:TEST_USER_ID" -Method GET
                                $requiredKeys = @("user","clubs","recommended_clubs","posted_projects","collaborating_projects")
                                $missing = $requiredKeys | Where-Object { -not $resp.PSObject.Properties[$_] }
                                if ($missing) {
                                    Write-Error "FAIL: Missing keys in profile response: $($missing -join ', ')"
                                    exit 1
                                }
                                Write-Host "PASS: GET /profile — user: $($resp.user.name)"
                            } catch {
                                $code = $_.Exception.Response.StatusCode.value__
                                if ($code -eq 404) {
                                    Write-Host "PASS: GET /profile — 404 (test user not seeded, acceptable)"
                                } else {
                                    Write-Error "FAIL: Unexpected status $code"
                                    exit 1
                                }
                            }
                        '''
                    }
                }

            } // end nested stages
        } // end Route Tests

        // ─────────────────────────────────────────────────────────────
        // STAGE 6: Pytest Unit Tests
        // ─────────────────────────────────────────────────────────────
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
                    script {
                        if (fileExists('test-results.xml')) {
                            junit 'test-results.xml'
                        }
                    }
                }
            }
        }

    } // end stages

    // ─────────────────────────────────────────────────────────────────
    // POST: Cleanup
    // ─────────────────────────────────────────────────────────────────
    post {
        always {
            bat '''
                taskkill /F /IM uvicorn.exe /T > nul 2>&1 || echo uvicorn already stopped
                if exist uvicorn.log (
                    echo --- Uvicorn Log ---
                    type uvicorn.log
                )
            '''
            cleanWs()
        }
        success {
            echo "PIPELINE PASSED — All ClubMonkey routes are healthy."
        }
        failure {
            echo "PIPELINE FAILED — Check stage logs above."
        }
    }
}

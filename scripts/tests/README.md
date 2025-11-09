# OpenSilício - Test Scripts

This directory contains convenient scripts to run your test suite in various ways.

## Available Scripts

### 1. Run All Tests (Unit + Integration)
Runs both unit tests and integration tests.

**Windows:**
```bash
.\run-all-tests.bat
```

**Linux/Mac:**
```bash
./run-all-tests.sh
```

### 2. Run Integration Tests Only
Runs only the integration tests.

**Windows:**
```bash
.\run-integration-tests.bat
```

**Linux/Mac:**
```bash
./run-integration-tests.sh
```

### 3. Run Tests in Watch Mode
Runs tests in watch mode, automatically re-running tests when files change. Useful for development.

**Windows:**
```bash
.\run-tests-watch.bat
```

**Linux/Mac:**
```bash
./run-tests-watch.sh
```

Press `CTRL+C` to exit watch mode.

### 4. Run Tests for a Specific File
Runs tests for a specific test file.

**Windows:**
```bash
.\test-specific-file.bat src/tests/integration/auth.test.ts
```

**Linux/Mac:**
```bash
./test-specific-file.sh src/tests/integration/auth.test.ts
```

#### Example Test Files:
- `src/tests/integration/auth.test.ts` - Authentication tests (login, verify token)
- `src/tests/integration/blog.test.ts` - Blog API tests
- `src/tests/integration/education.test.ts` - Education resources API tests
- `src/tests/integration/wiki.test.ts` - Wiki API tests
- `src/tests/integration/settings.test.ts` - Site settings API tests

## Prerequisites

- Docker must be running
- Services must be started with: `scripts/dev/start.bat` (Windows) or `scripts/dev/start.sh` (Linux/Mac)

## Admin Credentials for Tests

Tests use the following credentials:
- **Username:** `AdmOpen`
- **Password:** `Dev123!@LocalOnly`

These are automatically configured in the test setup.

claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key ctx7sk-5b917a52-f94a-494f-a623-ea82bf6621ba


## Test Results

All test scripts will:
- ✅ Show a success message if all tests pass
- ❌ Show a failure message and exit with code 1 if any test fails
- Display detailed test output so you can see what went wrong

## Making Scripts Executable (Linux/Mac)

If you get a "permission denied" error, make the scripts executable:

```bash
chmod +x scripts/tests/*.sh
```

## CI/CD Integration

These scripts are designed to be used in CI/CD pipelines:

- Use `run-integration-tests.bat/sh` in your CI/CD pipeline for consistency
- Scripts exit with proper status codes (0 = success, 1 = failure)
- All Docker and environment setup is handled automatically

## Troubleshooting

### Docker not running
If you see "Docker não está rodando", start Docker Desktop and try again.

### Tests timing out
If tests timeout, try:
1. Ensuring services are fully started: `scripts/dev/start.bat`
2. Waiting a few seconds for the database to initialize
3. Checking Docker logs: `docker-compose -f docker/docker-compose.dev.yml logs -f`

### Port already in use
If you get a "port already in use" error, the previous containers may not have shut down:
```bash
docker-compose -f docker/docker-compose.dev.yml down
```

Then try running the tests again.

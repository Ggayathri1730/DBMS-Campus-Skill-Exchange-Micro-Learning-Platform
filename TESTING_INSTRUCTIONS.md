# Testing Instructions

## Required software

- Python 3.12+
- MySQL running locally
- Node.js and npm
- Git
- VS Code or a browser-based environment

## Local setup

### Backend

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### Frontend

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm install
```

## Test database setup

- Create or use a separate local MySQL schema for testing.
- Keep the dev database separate from any production records.
- Do not run destructive SQL against user data.

## Seed data

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
.\.venv\Scripts\Activate.ps1
python -m seed
```

The seeder is idempotent and safe to rerun.

## Run backend tests

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
$env:PYTHONPATH = $PWD.Path
python -m unittest discover -s tests -v
```

## Run frontend lint/build

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm run lint
npm run build
```

## Run the app locally

### Backend

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

## Reset test data safely

- Remove only the demo/test accounts you created during local testing.
- Do not delete the real app data.
- Prefer the seed script to add new rows instead of manually editing live DB tables.

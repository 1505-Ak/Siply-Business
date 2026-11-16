# Siply Business

Standalone venue-owner service for claiming a hospitality listing and managing its performance. This project is intentionally independent from the Siply consumer app.

## Local development

Backend:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8401
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3400`. Demo login: `owner@northstarcoffee.co.uk` / `SiplyBusiness!`

## Future Siply integration boundary

- Replace `/api/venues/search` with the consumer-map venue service.
- Replace the demo login with shared Siply identity plus a `business_owner` role.
- Publish approved claims back as `venue.ownerBusinessId` only after staff verification.
- Keep business analytics scoped to approved venue IDs; never expose platform-wide admin analytics.


// Vercel Serverless: POST /api/scan-document
// Accepts base64 image, sends to Claude vision, returns extracted work order fields

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    try {
        const { image, mimeType } = req.body;
        if (!image) return res.status(400).json({ error: 'No image provided' });

        const mediaType = mimeType || 'image/jpeg';

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: { type: 'base64', media_type: mediaType, data: image }
                        },
                        {
                            type: 'text',
                            text: `Extract work order / invoice / delivery ticket data from this image. Return ONLY a JSON object with these fields (use null for missing values):

{
  "job_site_name": "site or project name",
  "job_type": "fuel-delivery|service|swap|pickup",
  "contract_number": "contract or ticket number",
  "po_number": "PO number",
  "priority": "normal|high|urgent",
  "document_source": "powerplus|manual|scan|other",
  "address_street": "street address",
  "address_city": "city",
  "address_state": "two-letter state code",
  "address_zip": "ZIP code",
  "customer_name": "company or customer name",
  "contact_name": "contact person name",
  "contact_phone": "phone number",
  "fuel_gallons": number or null,
  "def_gallons": number or null,
  "instructions": "any notes or special instructions",
  "order_id": "order ID",
  "job_number": "job number",
  "customer_number": "customer number",
  "vendor_number": "vendor number",
  "date_out": "YYYY-MM-DD",
  "time_out": "HH:MM",
  "est_return": "YYYY-MM-DD",
  "time_return": "HH:MM",
  "rental_company": "rental company or PC number",
  "salesman": "salesman name",
  "field_ticket_id": "field ticket ID number",
  "ticket_type": "ticket type e.g. SWAP, DELIVERY",
  "area": "area code e.g. SAN, LA",
  "ticket_status": "e.g. TENTATIVE, CONFIRMED",
  "work_performed": "description of work performed",
  "old_gen_hour": "old generator hour reading",
  "new_gen_id": "new generator ID",
  "new_gen_hour": "new generator hour reading"
}

Return ONLY valid JSON, no markdown, no explanation.`
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Claude API error:', err);
            return res.status(502).json({ error: 'AI service error', details: err });
        }

        const result = await response.json();
        const text = result.content?.[0]?.text || '';

        // Parse JSON from response (handle potential markdown wrapping)
        let parsed;
        try {
            const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(jsonStr);
        } catch(e) {
            return res.status(200).json({ raw: text, error: 'Could not parse AI response as JSON' });
        }

        return res.status(200).json({ success: true, data: parsed });

    } catch(e) {
        console.error('Scan error:', e);
        return res.status(500).json({ error: e.message });
    }
}

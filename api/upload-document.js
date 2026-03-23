// Vercel Serverless: POST /api/upload-document
// Uploads a scanned document image to Supabase Storage and returns the public URL

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
);

export const config = {
    api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    try {
        const { image, jobId, filename } = req.body || {};
        if (!image) return res.status(400).json({ error: 'image (base64) required' });

        // Parse base64 data URL
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: 'Invalid base64 image' });

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const ext = contentType.split('/')[1] || 'jpg';
        const ts = Date.now();
        const name = filename || `doc_${ts}.${ext}`;
        const path = jobId ? `jobs/${jobId}/${name}` : `uploads/${name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(path);

        // If jobId provided, update the job with the document URL
        if (jobId) {
            await supabase
                .from('jobs')
                .update({ document_image: urlData.publicUrl })
                .eq('id', jobId);
        }

        return res.status(200).json({
            success: true,
            url: urlData.publicUrl,
            path
        });

    } catch (e) {
        console.error('Upload error:', e);
        return res.status(500).json({ error: e.message });
    }
}

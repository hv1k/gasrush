// Vercel Serverless: POST /api/login
// Simple email+password auth against users table

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabase = createClient(
    'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcW94ZHNpYml1dHBmaHR2eXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDgzODEsImV4cCI6MjA4NDg4NDM4MX0.GgpdgFyJBVtkAKmp2ZJIoEd5xO5EwA2itnfST-ig1ck'
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate simple token
        const token = crypto.randomBytes(32).toString('hex');

        // Return user (without password)
        const { password: _, ...safeUser } = user;
        return res.status(200).json({
            success: true,
            user: { ...safeUser, token }
        });

    } catch(e) {
        console.error('Login error:', e);
        return res.status(500).json({ error: 'Server error' });
    }
}

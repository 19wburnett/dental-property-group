import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import pdf from 'pdf-parse';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const upload = multer({ dest: 'uploads/' });

export default async function handler(req, res) {
    if (req.method === 'POST') {
        // Your existing logic for handling the lease analysis
        // Use req.body and req.file as needed
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 
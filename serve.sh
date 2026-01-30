#!/bin/bash
# Simple local server to avoid CORS issues when loading assets
# Usage: ./serve.sh
echo "Starting server at http://localhost:8080"
python3 -m http.server 8080

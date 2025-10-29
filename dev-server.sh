#!/bin/bash

# Simple dev server for vanilla JS app
echo "Starting Sample Scratcher HTML app on http://localhost:8080"
echo "Make sure your Next.js API is running on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
else
    echo "Error: Python is not installed"
    exit 1
fi

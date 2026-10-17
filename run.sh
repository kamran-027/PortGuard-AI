#!/bin/bash
# PortGuard AI - One-command local startup script

echo "🚢 Starting PortGuard AI..."

# Check Ollama
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running locally on port 11434."
else
    echo "⚠️  Warning: Ollama does not seem to be running on http://127.0.0.1:11434."
    echo "   Please start Ollama in a separate terminal with: ollama serve"
fi

# Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down PortGuard AI..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Start FastAPI Backend
echo "🚀 Launching FastAPI Backend on http://localhost:8000..."
cd "$(dirname "$0")/backend"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Next.js Frontend
echo "💻 Launching Next.js 15 Frontend on http://localhost:3000..."
cd ../frontend
bun run dev --port 3000 &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo "🎉 PortGuard AI is live!"
echo "   👉 Dashboard:  http://localhost:3000"
echo "   👉 API Docs:   http://localhost:8000/docs"
echo "   👉 Ollama:     http://localhost:11434 (gemma4:12b)"
echo "============================================================"
echo "Press Ctrl+C to stop all services."
echo ""

wait

#!/bin/bash

# Quick Task Seeding Script
# Generates a few tasks for testing without TypeScript compilation

echo "╔════════════════════════════════════════════╗"
echo "║       Quick Task Generation (Mock)         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Error: AI Engine server is not running!"
    echo "   Please start it with: npm run dev"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo ""

# Fields to generate
FIELDS=("software_engineering" "marketing" "data_science")

echo "📊 Generating 1 task for ${#FIELDS[@]} fields..."
echo ""

TOTAL=0
SUCCESS=0

for FIELD in "${FIELDS[@]}"; do
    echo "🔄 Generating task for $FIELD..."

    RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks/generate-and-save \
        -H "Content-Type: application/json" \
        -d "{
            \"job_field\": \"$FIELD\",
            \"difficulty_level\": \"intermediate\",
            \"count\": 1
        }")

    if echo "$RESPONSE" | grep -q "\"success\":true"; then
        TASK_IDS=$(echo "$RESPONSE" | grep -o '"task_ids":\[[^]]*\]')
        echo "✅ Generated task for $FIELD"
        echo "   Task IDs: $TASK_IDS"
        ((SUCCESS++))
    else
        echo "❌ Failed to generate task for $FIELD"
        echo "   Response: $RESPONSE"
    fi

    ((TOTAL++))
    echo ""

    # Small delay to be nice to the API
    sleep 0.5
done

echo "╔════════════════════════════════════════════╗"
echo "║              Complete                       ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "✅ Successfully generated: $SUCCESS/$TOTAL tasks"
echo "🎉 Tasks are now in your database!"
echo ""

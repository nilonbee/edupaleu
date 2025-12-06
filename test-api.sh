#!/bin/bash

# Test API endpoints
BASE_URL="http://localhost:3001/api/v1"
PORT=3001

echo "=========================================="
echo "Testing Academic Qualifications API"
echo "=========================================="

# Check if server is running
if ! curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
    echo "❌ ERROR: Server is not running on port ${PORT}"
    echo "Please start the server first with: cd server && npm run dev"
    exit 1
fi

echo "✅ Server is running on port ${PORT}"
echo ""

# First, let's try to login (you'll need to provide valid credentials)
echo "Step 1: Login to get auth token..."
echo "NOTE: You need to provide your login credentials"
echo ""

# For now, let's check if we can get an existing application
# Replace APPLICATION_ID with an actual application ID from your database
APPLICATION_ID=${1:-17}  # Default to 17 if not provided

echo "Step 2: Testing getApplication with ID: ${APPLICATION_ID}"
echo "----------------------------------------"
echo ""

# Test getApplication endpoint
echo "GET /api/v1/applications/${APPLICATION_ID}"
echo ""
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_token_here" \
  "${BASE_URL}/applications/${APPLICATION_ID}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check if academicQualifications exist in response
if echo "$BODY" | grep -q "academicQualifications"; then
    ACADEMIC_COUNT=$(echo "$BODY" | jq '.data.academicQualifications | length' 2>/dev/null || echo "0")
    echo "✅ academicQualifications field found in response"
    echo "   Count: $ACADEMIC_COUNT"
    
    if [ "$ACADEMIC_COUNT" -gt 0 ]; then
        echo "✅ SUCCESS: Academic qualifications are present!"
        echo ""
        echo "Academic Qualifications:"
        echo "$BODY" | jq '.data.academicQualifications' 2>/dev/null || echo "$BODY"
    else
        echo "⚠️  WARNING: academicQualifications array is empty"
    fi
else
    echo "❌ ERROR: academicQualifications field NOT found in response"
    echo ""
    echo "Available keys in data:"
    echo "$BODY" | jq '.data | keys' 2>/dev/null || echo "Could not parse response"
fi

echo ""
echo "=========================================="


#!/bin/bash

# Test getApplication endpoint
# Usage: ./test-get-application.sh <application_id> [auth_token]

APPLICATION_ID=${1:-17}
AUTH_TOKEN=${2:-""}
BASE_URL="http://localhost:3001/api/v1"

echo "=========================================="
echo "Testing GET /api/v1/applications/${APPLICATION_ID}"
echo "=========================================="
echo ""

# Build curl command
if [ -z "$AUTH_TOKEN" ]; then
    echo "⚠️  No auth token provided - request may fail"
    echo "Usage: $0 <application_id> <auth_token>"
    echo ""
    CURL_CMD="curl -s -w \"\nHTTP_STATUS:%{http_code}\" -H \"Content-Type: application/json\" \"${BASE_URL}/applications/${APPLICATION_ID}\""
else
    CURL_CMD="curl -s -w \"\nHTTP_STATUS:%{http_code}\" -H \"Content-Type: application/json\" -H \"Cookie: accessToken=${AUTH_TOKEN}\" \"${BASE_URL}/applications/${APPLICATION_ID}\""
fi

echo "Making request..."
RESPONSE=$(eval $CURL_CMD)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

# Try to parse JSON
if command -v jq &> /dev/null; then
    echo "Response Body (formatted):"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    
    # Check for academicQualifications
    if echo "$BODY" | jq -e '.data.academicQualifications' > /dev/null 2>&1; then
        COUNT=$(echo "$BODY" | jq '.data.academicQualifications | length' 2>/dev/null || echo "0")
        echo "=========================================="
        echo "✅ academicQualifications field EXISTS in response"
        echo "   Count: $COUNT"
        echo ""
        
        if [ "$COUNT" -gt 0 ]; then
            echo "✅ SUCCESS: Academic qualifications are present!"
            echo ""
            echo "Academic Qualifications:"
            echo "$BODY" | jq '.data.academicQualifications'
        else
            echo "⚠️  WARNING: academicQualifications array is EMPTY"
        fi
    else
        echo "=========================================="
        echo "❌ ERROR: academicQualifications field NOT FOUND in response"
        echo ""
        echo "Available keys in data:"
        echo "$BODY" | jq '.data | keys' 2>/dev/null || echo "Could not parse JSON"
    fi
else
    echo "Response Body:"
    echo "$BODY"
    echo ""
    echo "=========================================="
    
    # Simple grep check
    if echo "$BODY" | grep -q "academicQualifications"; then
        echo "✅ academicQualifications found in response (raw text check)"
    else
        echo "❌ academicQualifications NOT found in response (raw text check)"
    fi
fi

echo "=========================================="


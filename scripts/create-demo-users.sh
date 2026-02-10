#!/bin/bash
# LIQUIDA360 - Create demo users for each role
# Uses Supabase Admin API with service_role key

SUPABASE_URL="${SUPABASE_URL:?Missing SUPABASE_URL env var}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY env var}"
PASSWORD="${DEMO_PASSWORD:-Demo2026!}"

create_user() {
  local email=$1
  local role=$2
  local name=$3

  echo "Creating user: $email (role: $role)..."

  response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${PASSWORD}\",
      \"email_confirm\": true,
      \"app_metadata\": { \"role\": \"${role}\" },
      \"user_metadata\": { \"full_name\": \"${name}\" }
    }")

  # Check if user was created successfully
  if echo "$response" | grep -q '"id"'; then
    user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  OK - ID: $user_id"
  else
    echo "  ERROR: $response"
  fi
}

echo "========================================"
echo "LIQUIDA360 - Creating Demo Users"
echo "Password for all users: ${PASSWORD}"
echo "========================================"
echo ""

create_user "pagador@liquida360.demo" "pagador" "Ana Garcia (Pagador)"
create_user "supervisor@liquida360.demo" "supervisor" "Carlos Lopez (Supervisor)"
create_user "financiero@liquida360.demo" "financiero" "Maria Torres (Financiero)"
create_user "admin@liquida360.demo" "admin" "Pedro Martinez (Admin)"

echo ""
echo "========================================"
echo "Demo Users Created!"
echo "========================================"
echo ""
echo "Login credentials:"
echo "  pagador@liquida360.demo    / ${PASSWORD}"
echo "  supervisor@liquida360.demo / ${PASSWORD}"
echo "  financiero@liquida360.demo / ${PASSWORD}"
echo "  admin@liquida360.demo      / ${PASSWORD}"
echo ""
echo "URL: https://liquida360.vercel.app"

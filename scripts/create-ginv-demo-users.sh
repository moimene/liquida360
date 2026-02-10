#!/bin/bash
# LIQUIDA360 - Create G-Invoice demo users
# Uses Supabase Admin API with service_role key
# Each user gets role: 'admin' (so they can access the internal app)
# plus a ginv_role for G-Invoice access

SUPABASE_URL="${SUPABASE_URL:?Missing SUPABASE_URL env var}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Missing SUPABASE_SERVICE_ROLE_KEY env var}"
PASSWORD="${DEMO_PASSWORD:-Demo2026!}"

create_ginv_user() {
  local email=$1
  local ginv_role=$2
  local name=$3

  echo "Creating user: $email (ginv_role: $ginv_role)..."

  response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${PASSWORD}\",
      \"email_confirm\": true,
      \"app_metadata\": { \"role\": \"admin\", \"ginv_role\": \"${ginv_role}\" },
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
echo "LIQUIDA360 - Creating G-Invoice Demo Users"
echo "Password for all users: ${PASSWORD}"
echo "========================================"
echo ""

create_ginv_user "ginv.admin@liquida360.demo"      "ginv_admin"             "Admin GInv (G-Invoice)"
create_ginv_user "ginv.operador@liquida360.demo"    "ginv_operador"          "Intake Ops (Operador)"
create_ginv_user "ginv.socio@liquida360.demo"       "ginv_socio_aprobador"   "Socio Aprobador (Socio)"
create_ginv_user "ginv.bpo@liquida360.demo"         "ginv_bpo_facturacion"   "BPO Facturacion (BPO)"
create_ginv_user "ginv.compliance@liquida360.demo"  "ginv_compliance_uttai"  "Compliance UTTAI"

echo ""
echo "========================================"
echo "G-Invoice Demo Users Created!"
echo "========================================"
echo ""
echo "Login credentials (select G-Invoice tab on login page):"
echo "  ginv.admin@liquida360.demo      / ${PASSWORD}  (ginv_admin)"
echo "  ginv.operador@liquida360.demo   / ${PASSWORD}  (ginv_operador)"
echo "  ginv.socio@liquida360.demo      / ${PASSWORD}  (ginv_socio_aprobador)"
echo "  ginv.bpo@liquida360.demo        / ${PASSWORD}  (ginv_bpo_facturacion)"
echo "  ginv.compliance@liquida360.demo / ${PASSWORD}  (ginv_compliance_uttai)"
echo ""
echo "URL: https://liquida360.vercel.app"

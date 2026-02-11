
vault {
  address = "https://vault-server:8200"
  tls_skip_verify = true
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/vault/approle/role-id"
      secret_id_file_path = "/vault/approle/secret-id"
      remove_secret_id_file_after_reading = false
    }
  }
  sink "file" {
    config = {
      path = "/vault/auth_token/token"
    }
  }
}

template {
  source      = "/vault/templates/certificate.tmpl"
  destination = "/vault/secrets/certificate.json"
  command     = <<-EOH
    jq -r '.certificate' /vault/secrets/certificate.json > /vault/secrets/filebeat.crt && \
    jq -r '.private_key' /vault/secrets/certificate.json > /vault/secrets/filebeat.key && \
    jq -r '.issuing_ca'  /vault/secrets/certificate.json > /vault/secrets/ca.crt && \
    chmod 644 /vault/secrets/filebeat.* /vault/secrets/ca.crt
  EOH
}

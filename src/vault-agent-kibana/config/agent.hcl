
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
  source      = "/vault/templates/kibana.crt.tmpl"
  destination = "/vault/secrets/kibana.crt"
  command     = "chown vault:1000 /vault/secrets/kibana.crt"
}

template {
  source      = "/vault/templates/kibana.key.tmpl"
  destination = "/vault/secrets/kibana.key"
  command     = "chown vault:1000 /vault/secrets/kibana.key"
}

template {
  source      = "/vault/templates/ca.crt.tmpl"
  destination = "/vault/secrets/ca.crt"
  command     = "chown vault:1000 /vault/secrets/ca.crt"
}

template {
  source      = "/vault/templates/kibana_encryption_key.tmpl"
  destination = "/vault/secrets/kibana_encryption_key"
  command     = "chown vault:1000 /vault/secrets/kibana_encryption_key"
}

template {
  source      = "/vault/templates/kibana_system_password.tmpl"
  destination = "/vault/secrets/kibana_system_password"
  command     = "chown vault:1000 /vault/secrets/kibana_system_password"
}
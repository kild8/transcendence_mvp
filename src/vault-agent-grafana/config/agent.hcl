
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
  source      = "/vault/templates/client-id.tmpl"
  destination = "/vault/secrets/client-id"
  command     = "chown vault:1000 /vault/secrets/client-id"
}

template {
  source      = "/vault/templates/client-secret.tmpl"
  destination = "/vault/secrets/client-secret"
  command     = "chown vault:1000 /vault/secrets/client-secret"
}

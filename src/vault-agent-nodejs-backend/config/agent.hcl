
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
  source      = "/vault/templates/google_auth_client_id.tmpl"
  destination = "/vault/secrets/google_auth_client_id"
  command     = "chown vault:1001 /vault/secrets/google_auth_client_id"
}

template {
  source      = "/vault/templates/google_auth_secret_id.tmpl"
  destination = "/vault/secrets/google_auth_secret_id"
  command     = "chown vault:1001 /vault/secrets/google_auth_secret_id"
}

template {
  source      = "/vault/templates/jwt_secret.tmpl"
  destination = "/vault/secrets/jwt_secret"
  command     = "chown vault:1001 /vault/secrets/jwt_secret"
}
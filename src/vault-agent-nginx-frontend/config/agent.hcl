
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
  source      = "/vault/templates/nginx-frontend.crt.tmpl"
  destination = "/vault/secrets/nginx-frontend.crt"
  command     = "chown vault:101 /vault/secrets/nginx-frontend.crt"
}

template {
  source      = "/vault/templates/nginx-frontend.key.tmpl"
  destination = "/vault/secrets/nginx-frontend.key"
  command     = "chown vault:101 /vault/secrets/nginx-frontend.key"
}

template {
  source      = "/vault/templates/ca.crt.tmpl"
  destination = "/vault/secrets/ca.crt"
  command     = "chown vault:1000 /vault/secrets/ca.crt"
}
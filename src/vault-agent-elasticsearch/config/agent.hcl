
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
    jq -r '.certificate' /vault/secrets/certificate.json > /vault/secrets/elasticsearch.crt && \
    jq -r '.private_key' /vault/secrets/certificate.json > /vault/secrets/elasticsearch.key && \
    jq -r '.issuing_ca'  /vault/secrets/certificate.json > /vault/secrets/ca.crt && \
    chmod 644 /vault/secrets/elasticsearch.* /vault/secrets/ca.crt
  EOH
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

template {
  source      = "/vault/templates/elastic_password.tmpl"
  destination = "/vault/secrets/elastic_password"
  command     = "chown vault:1000 /vault/secrets/elastic_password"
}

template {
  source      = "/vault/templates/kibana_system_password.tmpl"
  destination = "/vault/secrets/kibana_system_password"
  command     = "chown vault:1000 /vault/secrets/kibana_system_password"
}

template {
  source      = "/vault/templates/logstash_internal_password.tmpl"
  destination = "/vault/secrets/logstash_internal_password"
  command     = "chown vault:1000 /vault/secrets/logstash_internal_password"
}

template {
  source      = "/vault/templates/kibana_api_user.tmpl"
  destination = "/vault/secrets/kibana_api_user"
  command     = "chown vault:1000 /vault/secrets/kibana_api_user"
}

template {
  source      = "/vault/templates/kibana_api_password.tmpl"
  destination = "/vault/secrets/kibana_api_password"
  command     = "chown vault:1000 /vault/secrets/kibana_api_password"
}
api_addr                = "https://vault-server:8200"
disable_mlock           = true
ui                      = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/vault-server.crt"
  tls_key_file  = "/vault/certs/vault-server.key"
  tls_client_ca_file = "/vault/certs/ca.crt"
  tls_min_version = "tls12"
}

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
  unauthenticated_metrics_access = true
}

storage "file" {
  path = "/vault/file"
}

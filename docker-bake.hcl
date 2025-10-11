# Docker Bake configuration for optimized builds
# Usage: docker buildx bake --file docker-bake.hcl

variable "TAG" {
  default = "latest"
}

variable "REGISTRY" {
  default = ""
}

variable "REPO" {
  default = "zephyr"
}

group "default" {
  targets = ["auth", "web", "docs"]
}

target "auth" {
  context    = "."
  dockerfile = "apps/auth/Dockerfile"
  tags       = ["${REGISTRY}${REPO}-auth:${TAG}"]
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=registry,ref=${REGISTRY}${REPO}-auth:cache"]
  cache-to   = ["type=registry,ref=${REGISTRY}${REPO}-auth:cache,mode=max"]
  labels = {
    "org.opencontainers.image.title"       = "Zephyr Auth Service"
    "org.opencontainers.image.description" = "Authentication service for Zephyr"
    "org.opencontainers.image.vendor"      = "Zephyr"
    "org.opencontainers.image.version"     = "${TAG}"
  }
}

target "web" {
  context    = "."
  dockerfile = "apps/web/Dockerfile"
  tags       = ["${REGISTRY}${REPO}-web:${TAG}"]
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=registry,ref=${REGISTRY}${REPO}-web:cache"]
  cache-to   = ["type=registry,ref=${REGISTRY}${REPO}-web:cache,mode=max"]
  labels = {
    "org.opencontainers.image.title"       = "Zephyr Web App"
    "org.opencontainers.image.description" = "Main web application for Zephyr"
    "org.opencontainers.image.vendor"      = "Zephyr"
    "org.opencontainers.image.version"     = "${TAG}"
  }
}

target "docs" {
  context    = "."
  dockerfile = "apps/docs/Dockerfile"
  tags       = ["${REGISTRY}${REPO}-docs:${TAG}"]
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=registry,ref=${REGISTRY}${REPO}-docs:cache"]
  cache-to   = ["type=registry,ref=${REGISTRY}${REPO}-docs:cache,mode=max"]
  labels = {
    "org.opencontainers.image.title"       = "Zephyr Docs"
    "org.opencontainers.image.description" = "Documentation site for Zephyr"
    "org.opencontainers.image.vendor"      = "Zephyr"
    "org.opencontainers.image.version"     = "${TAG}"
  }
}

target "auth-local" {
  inherits = ["auth"]
  tags     = ["zephyr-auth:local"]
  cache-from = ["type=local,src=/tmp/.buildx-cache-auth"]
  cache-to   = ["type=local,dest=/tmp/.buildx-cache-auth-new,mode=max"]
  platforms  = ["linux/amd64"]
}

target "web-local" {
  inherits = ["web"]
  tags     = ["zephyr-web:local"]
  cache-from = ["type=local,src=/tmp/.buildx-cache-web"]
  cache-to   = ["type=local,dest=/tmp/.buildx-cache-web-new,mode=max"]
  platforms  = ["linux/amd64"]
}

target "docs-local" {
  inherits = ["docs"]
  tags     = ["zephyr-docs:local"]
  cache-from = ["type=local,src=/tmp/.buildx-cache-docs"]
  cache-to   = ["type=local,dest=/tmp/.buildx-cache-docs-new,mode=max"]
  platforms  = ["linux/amd64"]
}

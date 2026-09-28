terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

variable "environment" {
  type    = string
  default = "production"
}

variable "domain_name" {
  type    = string
  default = "workhub.uz"
}

output "api_endpoint" {
  value = "https://api.${var.domain_name}"
}

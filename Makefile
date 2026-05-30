# Makefile — shortcuts for common commands
# Usage: make <target>
# Example: make tf-plan   make k-status   make local-up

.PHONY: help tf-init tf-plan tf-apply tf-destroy ansible-ping ansible-setup \
        local-up local-down ecr-push k-deploy k-status k-logs monitoring-install

# Default: show help
help:
	@echo ""
	@echo "  CloudShop DevOps Makefile"
	@echo "  ========================="
	@echo ""
	@echo "  TERRAFORM"
	@echo "  make tf-init       Initialize Terraform"
	@echo "  make tf-plan       Preview infrastructure changes"
	@echo "  make tf-apply      Apply infrastructure"
	@echo "  make tf-destroy    Destroy all infrastructure"
	@echo ""
	@echo "  ANSIBLE"
	@echo "  make ansible-ping  Test connectivity to Jenkins server"
	@echo "  make ansible-setup Configure Jenkins server"
	@echo ""
	@echo "  LOCAL DEV"
	@echo "  make local-up      Start local docker-compose stack"
	@echo "  make local-down    Stop local docker-compose stack"
	@echo ""
	@echo "  KUBERNETES"
	@echo "  make k-deploy      Deploy app to EKS (dev)"
	@echo "  make k-status      Show all pods in cloudshop-dev"
	@echo "  make k-logs        Tail backend logs"
	@echo "  make k-rollback    Rollback backend to previous version"
	@echo ""
	@echo "  MONITORING"
	@echo "  make monitoring-install   Install Prometheus+Grafana on EKS"
	@echo "  make monitoring-forward   Port-forward Grafana to localhost:3001"
	@echo ""

# ---- Terraform ----
tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan -var-file="environments/dev/dev.tfvars"

tf-apply:
	cd terraform && terraform apply -var-file="environments/dev/dev.tfvars"

tf-destroy:
	cd terraform && terraform destroy -var-file="environments/dev/dev.tfvars"

tf-output:
	cd terraform && terraform output -json

# ---- Ansible ----
ansible-ping:
	cd ansible && ansible -i inventory/hosts.ini jenkins -m ping

ansible-setup:
	cd ansible && ansible-playbook -i inventory/hosts.ini playbooks/setup-jenkins.yml -v

# ---- Local Dev ----
local-up:
	docker-compose up -d
	@echo "Services starting..."
	@echo "Backend:    http://localhost:3000"
	@echo "Frontend:   http://localhost:5173"
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana:    http://localhost:3001  (admin/admin)"

local-down:
	docker-compose down

local-logs:
	docker-compose logs -f backend

local-test:
	cd app/backend  && npm test
	cd app/frontend && npm test

# ---- Kubernetes ----
k-context:
	aws eks update-kubeconfig --name cloudshop-dev --region us-east-1

k-deploy:
	helm upgrade --install cloudshop-dev ./kubernetes/helm/cloudshop \
	  --namespace cloudshop-dev \
	  --create-namespace \
	  --values kubernetes/helm/cloudshop/values.yaml \
	  --wait

k-status:
	kubectl get all -n cloudshop-dev

k-logs:
	kubectl logs -f deployment/cloudshop-dev-backend -n cloudshop-dev

k-rollback:
	kubectl rollout undo deployment/cloudshop-dev-backend -n cloudshop-dev
	kubectl rollout undo deployment/cloudshop-dev-frontend -n cloudshop-dev

k-hpa:
	kubectl get hpa -n cloudshop-dev -w

# ---- Monitoring ----
monitoring-install:
	SLACK_WEBHOOK_URL=$(SLACK_WEBHOOK) \
	  bash kubernetes/monitoring/install-monitoring-stack.sh

monitoring-forward:
	kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3001:80 &
	kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090 &
	@echo "Grafana:    http://localhost:3001"
	@echo "Prometheus: http://localhost:9090"

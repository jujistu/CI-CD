REGISTRY     ?= ghcr.io
IMAGE_NAME   ?= ecommerce-api
IMAGE_TAG    ?= $(shell git rev-parse --short HEAD)
FULL_IMAGE   := $(REGISTRY)/$(IMAGE_NAME):sha-$(IMAGE_TAG)
HELM_CHART   := helm/ecommerce-api
NAMESPACE    ?= ecommerce-dev

.PHONY: install test build lint docker-build docker-push deploy-dev deploy-staging helm-lint

install:
	cd api && npm ci

lint:
	cd api && npm run lint

test:
	cd api && npm run test

test-cov:
	cd api && npm run test:cov

build:
	cd api && npm run build

docker-build:
	docker build \
	  --file api/Dockerfile \
	  --tag $(FULL_IMAGE) \
	  --cache-from $(FULL_IMAGE) \
	  api

docker-push: docker-build
	docker push $(FULL_IMAGE)

helm-lint:
	helm lint $(HELM_CHART) -f $(HELM_CHART)/values.yaml -f $(HELM_CHART)/envs/dev.yaml

deploy-dev: helm-lint
	helm upgrade --install ecommerce-api-dev $(HELM_CHART) \
	  --namespace $(NAMESPACE) \
	  --create-namespace \
	  --values $(HELM_CHART)/values.yaml \
	  --values $(HELM_CHART)/envs/dev.yaml \
	  --set image.tag=sha-$(IMAGE_TAG) \
	  --wait

deploy-staging:
	helm upgrade --install ecommerce-api-staging $(HELM_CHART) \
	  --namespace ecommerce-staging \
	  --create-namespace \
	  --values $(HELM_CHART)/values.yaml \
	  --values $(HELM_CHART)/envs/staging.yaml \
	  --set image.tag=sha-$(IMAGE_TAG) \
	  --wait

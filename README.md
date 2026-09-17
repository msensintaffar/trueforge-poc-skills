# TrueForge POC Skills

Agent skills for a TrueForge deployment on a self-hosted Kubernetes (kind) cluster, plus the example app they were built around.

## Skills

- **[k8s-container-builder](skills/k8s-container-builder/SKILL.md)** — build, version, and deploy container images entirely in-cluster: source in an internal git server, kaniko builds (no Docker daemon), push to an in-cluster registry, deploy from that registry. Defines a strict set of predetermined framework tiers (Python API / static nginx / Next.js SSR).

## Examples

- **[timeoff-demo-app](examples/timeoff-demo-app/)** — a complete Next.js 16 time-off tracking app (request submission, manager approvals, balance accrual, shared calendar) produced by the [skill-creator](https://github.com/anthropics/skills) flow on another TrueForge instance. It builds with the k8s-container-builder skill: multi-stage Dockerfile on node:22-alpine, OIDC login via `NEXT_PUBLIC_*` build args, local `node:sqlite` storage (mount a PVC at `/app/.data` for persistence).

See each skill's SKILL.md for requirements and usage.
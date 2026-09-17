# TrueForge POC Skills

Agent skills for a TrueForge deployment on a self-hosted Kubernetes (kind) cluster.

## Skills

- **[k8s-container-builder](skills/k8s-container-builder/SKILL.md)** — build, version, and deploy container images entirely in-cluster: source in an internal git server, kaniko builds (no Docker daemon), push to an in-cluster registry, deploy from that registry. Defines a strict set of predetermined framework tiers (Python API / static nginx / Next.js SSR).

See each skill's SKILL.md for requirements and usage.
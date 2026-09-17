---
name: k8s-container-builder
description: Build, version, and deploy container images inside the Kubernetes cluster. Use when asked to containerize, build, push, or deploy an app via the git+kaniko pipeline. Covers the predetermined framework tiers.
---

# Kubernetes Container Builder

Builds container images from source stored in the in-cluster Gitea, using kaniko (no Docker daemon exists in this cluster), pushes to the in-cluster registry, and deploys the result.

## Fixed infrastructure (already present — do not recreate)

- **Git:** Gitea at `http://gitea.trueforge.svc:3000`, user `trueforge-agent`. Use the `gitea` MCP connector tools (create_repo, create_or_update_file, create_tag, get_file_contents).
- **Registry:** `registry.trueforge.svc:5000` — HTTP-only (insecure), trusted by the node. All built images go here.
- **Builder:** kaniko runs as a Pod. Use the mirrored executor: `registry.trueforge.svc:5000/mirror/gcr.io/kaniko-project/executor:latest`.
- **Git clone image:** `registry.trueforge.svc:5000/mirror/alpine/git:latest`.
- **Agent token:** secret `gitea-mcp-token` (key `token`) in namespace `trueforge`.
- **Namespace for everything:** `trueforge` unless told otherwise.

## Predetermined framework tiers (STRICT policy)

Dockerfiles may only use these base images. Anything else is out of policy and must be refused:

| Tier | Base image | Mode | Port | Resources (requests) |
|---|---|---|---|---|
| Python API | `registry.trueforge.svc:5000/mirror/python:3-alpine` | stdlib http.server | 8080 | cpu 10m, mem 16Mi |
| Static site | `registry.trueforge.svc:5000/mirror/nginx:alpine` | static files | 8080 | cpu 10m, mem 16Mi |
| Next.js SSR app | `registry.trueforge.svc:5000/mirror/node:22-alpine` | `next start` (multi-stage build) | 3000 | cpu 100m, mem 256Mi (limit 512Mi) |

Next.js apps: Node >= 22 is REQUIRED (the app uses Node's built-in `node:sqlite`). Multi-stage Dockerfile: build stage runs `npm ci` (requires committed package-lock.json) then `npm run build`; runtime stage copies `.next`, `public`, `next.config.js` and runs `npm start`. Keep `experimental: { cpus: 2 }` in next.config.js for constrained build memory.

JS/Next builds require internet during the kaniko build (npm registry) — that is expected and allowed for this tier.

## Procedure

### 1. Version the source in Gitea

Create a repo named `<app>` under `trueforge-agent`, commit at minimum a Dockerfile and app source. Keep each file small — `create_or_update_file` takes one file per call. Never commit secrets or `.env.local`; use `.env.template` placeholders.

### 2. Build with a kaniko Pod

Apply this manifest (replace `<app>`, `<build-id>` — increment per retry: b1, b2…, `<tag>` — e.g. v1):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: build-<app>-<build-id>
  namespace: trueforge
spec:
  restartPolicy: Never
  initContainers:
  - name: clone
    image: registry.trueforge.svc:5000/mirror/alpine/git:latest
    command: ["sh", "-c", "git clone http://trueforge-agent:$(GIT_TOKEN)@gitea.trueforge.svc:3000/trueforge-agent/<app>.git /src && rm -rf /src/.git"]
    env:
    - name: GIT_TOKEN
      valueFrom: {secretKeyRef: {name: gitea-mcp-token, key: token}}
    volumeMounts: [{name: src, mountPath: /src}]
  containers:
  - name: kaniko
    image: registry.trueforge.svc:5000/mirror/gcr.io/kaniko-project/executor:latest
    args: ["--context=/src", "--dockerfile=/src/Dockerfile", "--destination=registry.trueforge.svc:5000/<app>:<tag>", "--insecure", "--cleanup"]
    volumeMounts: [{name: src, mountPath: /src}]
  volumes:
  - name: src
    emptyDir: {}
```

**Build args (Next.js tier):** apps whose Dockerfile declares `ARG` (e.g. `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_CLIENT_ID`, `NEXT_PUBLIC_REDIRECT_URL` for OIDC) must receive them via kaniko: append `--build-arg=NAME=<value>` args. These values are NOT secrets (public OIDC client IDs/URLs). Any values the app needs at RUNTIME (it reads them again server-side) must ALSO be set as `env` in the Deployment below.

### 3. Wait and verify the build

- `kubectl_get` pod `build-<app>-<build-id>` until phase is `Succeeded` or `Failed`.
- Next.js builds take minutes, not seconds (npm ci + next build). Budget accordingly.
- On `Failed`: read logs with `kubectl_logs`, fix the Dockerfile or source in Gitea, retry with `<build-id>` incremented.
- Never reuse a build Pod name — pods are immutable.

### 4. Deploy

Stateless apps (python, static):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app>
  namespace: trueforge
spec:
  replicas: 1
  selector: {matchLabels: {app: <app>}}
  template:
    metadata: {labels: {app: <app>}}
    spec:
      containers:
      - name: app
        image: registry.trueforge.svc:5000/<app>:<tag>
        imagePullPolicy: IfNotPresent
        resources: {requests: {cpu: 10m, memory: 16Mi}}
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata:
  name: <app>
  namespace: trueforge
spec:
  selector: {app: <app>}
  ports: [{port: 8080, targetPort: 8080}]
```

Stateful apps (Next.js SSR with local database — e.g. node:sqlite writing `./data`):

- **Create a PVC first** — without it every pod restart wipes the database:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: <app>-data
  namespace: trueforge
spec:
  accessModes: ["ReadWriteOnce"]
  resources: {requests: {storage: 1Gi}}
```

- Deployment adds the volume mount at the app's data path and the runtime env:

```yaml
      containers:
      - name: app
        image: registry.trueforge.svc:5000/<app>:<tag>
        imagePullPolicy: IfNotPresent
        resources: {requests: {cpu: 100m, memory: 256Mi}, limits: {memory: 512Mi}}
        ports: [{containerPort: 3000}]
        env:
        - {name: NEXT_PUBLIC_AUTH_URL, value: "<provided>"}
        - {name: NEXT_PUBLIC_CLIENT_ID, value: "<provided>"}
        - {name: NEXT_PUBLIC_REDIRECT_URL, value: "<provided>"}
        volumeMounts: [{name: data, mountPath: /app/.data}]
      volumes:
      - name: data
        persistentVolumeClaim: {claimName: <app>-data}
```

- Service targetPort 3000 for the Next tier.
- **Stateful apps run `replicas: 1` only** — a local sqlite file cannot be shared across replicas.
- Ask the operator for the OIDC env values if not provided; never invent them.

ClusterIP by default. Create a NodePort only if explicitly asked.

### 5. Verify and release

- `kubectl_get` pods until the app pod is `Running`; check logs for clean startup; for apps with a `/api/health` route, exec a curl to it from a debug pod (the app's own route, not the pod's).
- Tag the release in Gitea with `create_tag` (e.g. `v1`) so source and image versions correspond.
- Report: app name, repo path, image with tag, pod name, pod status, service name/port, and whether a PVC was created.

## Pitfalls

- kaniko needs `--insecure` for this registry — without it the push fails TLS validation.
- ConfigMap-mounted volumes are read-only — the build context must be an emptyDir populated by the clone initContainer.
- Do not put the agent token in plain text anywhere; it only travels via the secretKeyRef. OIDC client IDs/URLs are public by design and safe in env/build-args.
- Registry paths are case-sensitive; keep app names lowercase.
- Next.js: `NEXT_PUBLIC_*` values are inlined at BUILD time — changing them requires a rebuild, not just a pod restart.
- sqlite-on-PVC is the demo-tier storage choice; scaling or going multi-replica requires swapping to a hosted database (the app isolates this in one module).
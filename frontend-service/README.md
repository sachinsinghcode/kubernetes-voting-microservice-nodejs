# Kubernetes Voting Microservice Application

A simple microservices-based voting application built with **Node.js**, **PostgreSQL**, **Docker**, and **Kubernetes**.

This project was created to learn Kubernetes fundamentals such as:

- Deployments
- Services
- Internal DNS
- ConfigMaps & Secrets (future enhancement)
- Persistent Volumes
- Reverse Proxy using NGINX
- Ingress (future enhancement)
- Multi-container applications
- Kubernetes networking

---

# Architecture

```text
                           Browser
                               │
                               │ HTTP
                               ▼
                    Frontend Service (NGINX)
                               │
                    Reverse Proxy (/api/*)
                               │
                               ▼
                     Vote Service (Node.js)
                               │
                               ▼
                     PostgreSQL Service
                               │
                               ▼
                          PostgreSQL Pod
```

---

# Components

## Frontend

- Static HTML
- CSS
- Vanilla JavaScript
- Served using NGINX

Responsibilities:

- Display vote buttons
- Display live vote count
- Call backend REST APIs

---

## Vote Service

Node.js REST API responsible for:

- Recording votes
- Returning current vote counts
- Resetting votes
- Connecting to PostgreSQL

---

## PostgreSQL

Stores the vote count persistently.

---

# Kubernetes Resources

Each component is deployed independently.

```
frontend
│
├── Deployment
└── Service

vote-service
│
├── Deployment
└── Service

postgres
│
├── Deployment
├── Service
└── Persistent Volume
```

---

# Services Used

| Service | Type | Purpose |
|----------|------|---------|
| frontend-service | NodePort (local) | Exposes frontend |
| vote-service | ClusterIP | Internal API |
| postgres | ClusterIP | Internal Database |

Notice that only the **frontend** is exposed outside the cluster.

The backend and database are only accessible inside Kubernetes.

---

# Kubernetes DNS

One of the biggest features Kubernetes provides is **internal DNS**.

Inside the cluster, every Service automatically gets a DNS name.

For example,

```
postgres
```

automatically resolves to

```
postgres.default.svc.cluster.local
```

Similarly,

```
vote-service
```

automatically resolves to

```
vote-service.default.svc.cluster.local
```

Because of this, applications running **inside Kubernetes** can simply connect using the Service name.

Example:

```javascript
host: "postgres"
```

instead of using IP addresses.

---

# Why Doesn't the Browser Use Kubernetes Service Names?

Initially, the frontend attempted to call the backend like this:

```javascript
fetch("http://vote-service/votes")
```

This resulted in:

```
ERR_NAME_NOT_RESOLVED
```

Many beginners assume this is a Kubernetes issue.

It is not.

The problem is **where the JavaScript executes**.

JavaScript runs inside the **user's browser**, not inside Kubernetes.

```
Browser
    │
    ▼
DNS Lookup

vote-service
```

The browser asks the operating system:

> What is the IP address of vote-service?

Windows (or Linux/macOS) has no idea because **vote-service only exists inside Kubernetes DNS**.

Therefore the browser cannot resolve it.

This behavior is exactly the same on:

- Docker Desktop
- Kind
- AKS
- EKS
- GKE
- OpenShift

This is **not** specific to Kind.

---

# Why Does the Backend Connect to PostgreSQL Successfully?

The backend uses

```javascript
host: "postgres"
```

and it works perfectly.

Why?

Because the backend is running **inside Kubernetes**.

```
Vote Service Pod
        │
        ▼
postgres Service
```

Pods can use Kubernetes DNS.

Browsers cannot.

---

# Solution: Reverse Proxy

Instead of making the browser talk directly to the backend,

```
Browser
     │
     ▼
vote-service
```

the browser only communicates with the frontend.

```
Browser
     │
     ▼
Frontend (NGINX)
     │
     ▼
vote-service
```

This is called a **Reverse Proxy**.

---

# What is a Reverse Proxy?

A reverse proxy is a server that sits **in front of one or more backend services**.

Instead of clients calling the backend directly,

they call the reverse proxy.

The reverse proxy forwards the request to the correct backend.

```
Browser
    │
GET /api/votes
    │
    ▼
NGINX
    │
GET http://vote-service/votes
    │
    ▼
Vote Service
```

Notice something important.

The browser never knows that `vote-service` exists.

Only NGINX knows.

Since NGINX runs inside Kubernetes, it can resolve Kubernetes Service names.

---

# NGINX Reverse Proxy Configuration

```nginx
location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass http://vote-service;
}
```

Now when the browser requests

```
GET /api/votes
```

NGINX internally converts it into

```
GET http://vote-service/votes
```

The backend returns JSON.

NGINX sends that JSON back to the browser.

The browser never communicates with the backend directly.

---

# Request Flow

```
Browser

GET /api/votes

        │

        ▼

Frontend Service (NGINX)

        │

Proxy Request

        ▼

Vote Service

        │

SQL Query

        ▼

PostgreSQL
```

The response follows the reverse path.

```
PostgreSQL

        ▲

Vote Service

        ▲

NGINX

        ▲

Browser
```

---

# Why Use a Reverse Proxy?

It solves multiple problems.

### 1. Kubernetes DNS

The browser cannot resolve Kubernetes Service names.

NGINX can.

---

### 2. Single Entry Point

The browser only communicates with one server.

```
localhost:8080
```

instead of

```
localhost:3000
localhost:5000
localhost:9000
...
```

---

### 3. No CORS Issues

Without a reverse proxy,

the frontend and backend would have different origins.

Example:

```
Frontend

http://localhost:8080
```

Backend

```
http://localhost:3000
```

Different origins require CORS configuration.

With the reverse proxy,

everything appears to come from

```
http://localhost:8080
```

No CORS configuration is required.

---

### 4. Better Security

The backend is never exposed directly to users.

Only NGINX is publicly accessible.

---

### 5. Easier Scaling

Future services can easily be added.

Example:

```
/api/users

/api/orders

/api/products

/api/votes
```

NGINX simply routes each path to the appropriate microservice.

---

# Why Use `/api`?

The frontend serves static files like:

```
/
index.html
style.css
app.js
```

The backend exposes REST APIs.

To separate the two concerns,

all backend APIs are grouped under

```
/api
```

For example,

```
GET /api/votes
POST /api/vote
POST /api/reset
```

NGINX forwards these requests to the backend while continuing to serve the frontend files.

---

# Future Improvements

- ConfigMaps
- Secrets
- Persistent Volumes
- Readiness Probes
- Liveness Probes
- Horizontal Pod Autoscaler
- Helm Charts
- Kubernetes Ingress
- HTTPS using TLS
- CI/CD using Azure DevOps
- Deployment to Azure Kubernetes Service (AKS)

---

# Learning Outcomes

This project demonstrates:

- Kubernetes Deployments
- Kubernetes Services
- ClusterIP vs NodePort
- Kubernetes DNS
- Pod-to-Pod communication
- Pod-to-Service communication
- PostgreSQL in Kubernetes
- Multi-tier application deployment
- NGINX Reverse Proxy
- Docker image creation
- Environment variables
- Internal service discovery
- Microservice architecture
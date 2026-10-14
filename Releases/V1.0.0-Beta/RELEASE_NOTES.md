# Aarkam.IO Sovereign Storage Platform — Enterprise Release Notes
## Version: V1.0.0-Beta (Official Client-Facing Distribution)
**Release Date**: October 2026  
**Security Baseline**: Air-Gapped Zero-Trust Sovereign Architecture (RSA-4096 / SHA-512 PSS / AES-256)  
**Official Aarkam Customer Portal (AarkamCP)**: [https://aarkam.io/](https://aarkam.io/)

---

## 1. Executive Summary

This package represents the official **V1.0.0-Beta Enterprise Release** of the **Aarkam Sovereign Storage Platform** (`Aarkam.IO`) for enterprise client deployments. Aarkam is an autonomous, ultra-high-performance, distributed object storage platform engineered specifically for mission-critical air-gapped data centers, sovereign national clouds, and defense-grade environments.

The platform is designed around four primary deployable enterprise components:
1. **`AarkamIO`**: The Central Cluster Control Plane, S3-Compatible REST Gateway, and Web Management UI.
2. **`Rokka` (with Embedded Ahmodi)**: The Distributed Storage & Consensus Coordinator. It manages Raft leader election, cluster topology, and embeds **Ahmodi** as its high-speed Cauchy Reed-Solomon erasure coding and chunk persistence engine.
3. **`Abodi` (with Embedded Kdouja)**: The Node Daemon and Hardware Health Agent. Deployed on every physical storage node, Abodi monitors real-time hardware telemetry and embeds **Kdouja** as its ultra-fast local metadata, transaction log, and indexing engine.
4. **`Aarkam.AM` (CLI)**: The Aarkam Manager (`am` / `am.exe`) Command-Line Interface for administrative operations, disk lifecycle management, cluster topology inspection, and local health diagnostics.

> [!SECURITY]
> **License Security Model**:  
> In compliance with sovereign air-gapped security policies, **no license generation tooling is provided to client environments**. All cryptographic licensing and Genesis Ceremony bundles (`.arkbundle`) are minted exclusively via the official **Aarkam Customer Portal** at **[https://aarkam.io/](https://aarkam.io/)**.

---

## 2. Release Package Manifest

```
D:\repos\Aarkam.IO\V2\Aarkam.IO\Releases\V1.0.0-Beta\
│
├── AarkamIO\                      # Central Management UI, Control Plane & AWS S3-Compatible Gateway
│   ├── Aarkam.dll / Aarkam.exe    # ASP.NET Core 10 Web & S3 REST Engine
│   └── appsettings.json           # Gateway and storage engine connection topology
│
├── Rokka\                         # Cluster Consensus & Storage Coordinator (Embeds Ahmodi)
│   ├── Rokka.Coordinator.dll      # Raft consensus engine, cluster leader election, and topology sync
│   ├── Ahmodi.dll                 # [Embedded] High-throughput Cauchy matrix reconstruction engine
│   ├── Ahmodi.Core.dll            # [Embedded] SIMD/AVX-512 accelerated Galois field GF(2^8) math pipeline
│   └── appsettings.json           # Consensus fabric and chunk storage configuration
│
├── Abodi\                         # Node Daemon & Hardware Health Agent (Embeds Kdouja)
│   ├── Abodi.dll                  # Real-time daemon monitoring CPU, NVMe SMART health, memory, and NICs
│   ├── Kdouja.Engine.dll          # [Embedded] Zero-copy LSM tree and monotonic metadata engine
│   ├── Kdouja.Primitives.dll      # [Embedded] High-speed serialization primitives
│   └── appsettings.json           # Hardware threshold alarms and local metadata path settings
│
└── Aarkam.AM\                     # Aarkam Manager (AM) Command-Line Interface
    ├── am.exe / am                # Standalone CLI binary for cluster operators
    └── appsettings.json           # Operator CLI connection profiles
```

---

## 3. Architecture & Deployment Model

```mermaid
flowchart TD
    subgraph ClientApps["Client Applications & S3 Workloads"]
        S3Client["AWS CLI / Boto3 / S3 SDKs / Applications"]
        OperatorCLI["Cluster Operator (Aarkam.AM CLI / am)"]
    end

    subgraph AarkamPlatform["Aarkam Sovereign Storage Deployment"]
        direction TB

        subgraph IngressTier["1. Control & S3 Gateway Tier"]
            AarkamIO["AarkamIO Control Plane & S3 Gateway\n(Ports: 5000 HTTP, 5001 HTTPS, 8080 S3, 8443 S3-TLS)"]
        end

        subgraph ConsensusTier["2. Cluster Coordination & Storage Tier"]
            Rokka["Rokka Coordinator Service\n(Consensus & Placement Engine)\n+ [Embedded] Ahmodi (Cauchy Reed-Solomon EC)"]
        end

        subgraph NodeTier["3. Physical Node Tier (Every Storage Node)"]
            AbodiNode1["Node 1: Abodi Agent\n(Hardware Profiler & SMART Telemetry)\n+ [Embedded] Kdouja (Local Metadata Engine)"]
            AbodiNode2["Node 2: Abodi Agent\n(Hardware Profiler & SMART Telemetry)\n+ [Embedded] Kdouja (Local Metadata Engine)"]
            AbodiNodeN["Node N: Abodi Agent\n(Hardware Profiler & SMART Telemetry)\n+ [Embedded] Kdouja (Local Metadata Engine)"]
        end
    end

    subgraph Portal["Aarkam Customer Portal (Public Web)"]
        CP["AarkamCP: https://aarkam.io/\n- Organization Subscriptions\n- Cluster Fingerprint Binding\n- Sovereign Genesis Bundle (.arkbundle) Minting"]
    end

    S3Client -->|S3 REST API (SigV4)| AarkamIO
    OperatorCLI -->|Management RPC / Admin API| AarkamIO
    OperatorCLI -->|Local Node Status| AbodiNode1
    AarkamIO <-->|Cluster Fabric RPC| Rokka
    Rokka <-->|Storage Fabric & Node Telemetry| AbodiNode1
    Rokka <-->|Storage Fabric & Node Telemetry| AbodiNode2
    Rokka <-->|Storage Fabric & Node Telemetry| AbodiNodeN

    AbodiNode1 -.->|Physical Hardware Fingerprint ARK-FP-...| CP
    CP -.->|Air-Gapped Genesis Bundle (.arkbundle)| AarkamIO
```

---

## 4. Activation via AarkamCP (https://aarkam.io/)

All enterprise deployments follow this air-gapped activation ceremony:

1. **Deploy & Boot Node**: Launch `AarkamIO` on your management node.
2. **Retrieve Hardware Fingerprint**:
   Navigate in your browser to:
   ```text
   https://<node-ip>:5001/genesis
   ```
   Copy the displayed **Cluster Hardware Fingerprint** (`ARK-FP-...`).
3. **Register on AarkamCP**:
   - Access **[https://aarkam.io/](https://aarkam.io/)** and log into your enterprise account.
   - Go to **Administration -> Current Subscription** (`https://aarkam.io/Administration/CurrentSubscription`).
   - Click **Bind Fingerprint** and paste your `ARK-FP-...` hardware fingerprint along with your cluster identifier.
4. **Download Genesis Ceremony Bundle**:
   - Click **Genesis** to download `Aarkam-Genesis-<ClusterCode>.arkbundle`.
   - *Commercial paid subscriptions* unlock full PB-scale capacity, enterprise nodes, and SixFM AI.
   - *Unpaid / Community accounts* receive a Beta bundle cryptographically constrained to 3 nodes, 5 TB capacity, and SixFM disabled.
5. **Seal the Cluster**:
   - Transfer `.arkbundle` across the air-gap to the cluster console (`https://<node-ip>:5001/genesis`).
   - Upload the bundle, provide your local root password, and seal the cluster.
   - The 8-layer anti-tampering verification suite executes immediately, locking the cluster state (`IsBootstrapped = true`).

---

## 5. Summary Operational Commands

### 1. Launching Abodi Node Agent (On Every Node)
```bash
# Deployed as systemd service or container on each physical storage host
dotnet Abodi.dll --urls "http://0.0.0.0:9400"
```

### 2. Launching Rokka Storage & Consensus Coordinator
```bash
# Deployed across 3 or 5 quorum consensus nodes
dotnet Rokka.Coordinator.dll --urls "https://0.0.0.0:9100"
```

### 3. Launching AarkamIO Control Plane & S3 Gateway
```bash
# Deployed on gateway / management nodes
dotnet Aarkam.dll --urls "https://0.0.0.0:5001;http://0.0.0.0:5000"
```

### 4. Running Aarkam Manager (AM) CLI
```bash
# Query cluster health and storage nodes
./am cluster status

# Inspect disks and health telemetry
./am disk list
```

---
*(c) 2026 Aarkam Sovereign Object Storage Platform. All Rights Reserved.*

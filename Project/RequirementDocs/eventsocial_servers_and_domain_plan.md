
# EventSocial — Complete Servers & Domain Deployment Plan (AWS + Cost Breakdown)

============================================================
1. OBJECTIVE
============================================================

This document provides:

- Complete AWS infrastructure plan
- Domain & DNS configuration
- SSL setup
- Media hosting architecture
- Database deployment
- Cost estimation (monthly + yearly)
- Ultra-lean AWS alternative
- Scaling roadmap
- Total financial projection (Year 1)

Goal:
Launch Phase 1 as a free platform with controlled infrastructure costs.

============================================================
2. DOMAIN & DNS CONFIGURATION
============================================================

Primary Domain Required:
eventsocial.com (example)

Recommended TLD:
- .com (best balance of cost + credibility)
- .app (modern branding)
- .lk (local focus)

Domain Cost (Annual):
.com      $12–15
.app      $15–20
.io       $30–60
.lk       $20–30

Recommended choice: .com

If purchased via Route 53:
Domain: ~$12/year
Hosted Zone: $0.50/month ($6/year)

Total yearly via AWS:
~ $18–20/year

Equivalent monthly average:
~ $1.50/month

SSL Certificate:
AWS ACM (Free)
Cloudflare SSL (Free)

No SSL cost.

============================================================
3. AWS PRODUCTION ARCHITECTURE (OPTION 1)
============================================================

Architecture Components:

- ECS Fargate (NestJS Backend API)
- Application Load Balancer
- RDS PostgreSQL (PostGIS enabled)
- ElastiCache Redis
- S3 (Media storage)
- CloudFront CDN
- Route 53 (DNS)
- CloudWatch (Monitoring)

------------------------------------------------------------
Monthly Cost Estimate (Low Traffic Phase 1)
------------------------------------------------------------

ECS Fargate (1 small task)       $20–30
RDS db.t3.micro                  $18–25
ElastiCache Redis                $15
S3 Storage (100GB)               $3–5
CloudFront CDN                   $8–12
CloudWatch                       $5
Route 53 Hosted Zone             $0.50
-------------------------------------------
Total Monthly:
$70–95

Add domain average monthly:
+ $1.50

Final Monthly Estimate:
$72–97

------------------------------------------------------------
Yearly Estimate
------------------------------------------------------------

Infrastructure (~$85 avg × 12)  ≈ $1,020
Domain                           ≈ $18
-------------------------------------------
Estimated Yearly Total:
≈ $1,038

============================================================
4. AWS ULTRA-LEAN SETUP (OPTION 2)
============================================================

Architecture:

- EC2 t3.micro (Backend + Redis together)
- RDS db.t3.micro
- S3
- CloudFront
- Route 53

------------------------------------------------------------
Monthly Cost Estimate
------------------------------------------------------------

EC2 t3.micro                     $10–12
RDS db.t3.micro                  $18–25
S3                               $3–5
CloudFront                       $8–12
Route 53                         $0.50
-------------------------------------------
Total Monthly:
$40–55

Add domain monthly avg:
+ $1.50

Final Monthly Estimate:
$42–57

------------------------------------------------------------
Yearly Estimate
------------------------------------------------------------

Infrastructure (~$50 avg × 12)  ≈ $600
Domain                           ≈ $18
-------------------------------------------
Estimated Yearly Total:
≈ $618

============================================================
5. MEDIA HOSTING STRUCTURE
============================================================

Upload Flow:

User uploads reel →
Backend validates →
Upload to S3 →
CloudFront distributes globally →
Mobile streams via CDN

Storage Class:
S3 Standard (Phase 1)

If usage grows:
Switch to Intelligent Tiering

============================================================
6. DATABASE STRUCTURE (AWS)
============================================================

Service: RDS PostgreSQL
PostGIS extension enabled

Daily automated backups enabled.

Private subnet configuration:
Database not publicly accessible.

============================================================
7. SECURITY ARCHITECTURE
============================================================

- HTTPS via ACM
- ALB SSL termination
- RDS in private subnet
- Security groups restrict DB access
- IAM least privilege policies
- S3 private bucket with signed URLs
- Rate limiting via Redis

============================================================
8. MONITORING & ALERTS
============================================================

CloudWatch for:
- CPU alerts
- Memory alerts
- DB connection alerts

Sentry (Free tier) for error monitoring.

============================================================
9. SCALING ROADMAP
============================================================

When traffic increases:

Step 1: Increase ECS task count
Step 2: Upgrade RDS instance
Step 3: Add RDS read replica
Step 4: Separate worker ECS service
Step 5: Enable auto scaling

============================================================
10. COST COMPARISON SUMMARY
============================================================

Setup Type         | Monthly Cost | Yearly Cost
-------------------------------------------------
AWS Production     | $72–97       | ~$1,038
AWS Lean           | $42–57       | ~$618

============================================================
11. RECOMMENDATION FOR PHASE 1
============================================================

Since:
- Platform is free initially
- No revenue in early months
- Budget control important

Recommended approach:

Start with AWS Lean Setup (~$50/month).
When revenue starts:
Upgrade to AWS Production Setup.

============================================================
12. FINAL SUMMARY
============================================================

Minimum realistic AWS budget to launch:
~ $50 per month (Lean setup).

Production-ready scalable setup:
~ $85 per month.

Domain cost:
~ $18 per year.

Total estimated first-year cost (lean):
~ $618.

Total estimated first-year cost (production):
~ $1,038.

This setup provides:

- Secure AWS infrastructure
- PostGIS-ready geo filtering
- Scalable backend
- CDN optimized media
- Proper SSL and DNS setup
- Low initial risk
- Clear upgrade path

============================================================
END OF DOCUMENT
============================================================

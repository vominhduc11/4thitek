# Lo trinh nang cap Giam sat (Observability Roadmap)

> **Day la tai lieu de xuat, khong phai yeu cau trien khai ngay.** Cac buoc duoi day mo ta huong di khi he thong can giam sat sau hon va nen duoc thuc hien boi nguoi co kinh nghiem DevOps/SRE.

---

## 1. Hien trang va han che

He thong hien tai co:

| Giam sat | Trang thai | Ghi chu |
|---|---|---|
| Health check `/actuator/health` | Da co | Dung boi Docker Compose va UptimeRobot |
| Container logs | Da co | `docker compose logs`, json-file rotation |
| Uptime monitor | Khuyen nghi manual | Xem [RUNBOOK.md §9](RUNBOOK.md) |
| Disk / backup alert | Khuyen nghi manual | Xem [RUNBOOK.md §9](RUNBOOK.md) |
| CPU / RAM theo thoi gian | **Chua co** | — |
| Request rate / error rate | **Chua co** | — |
| Thoi gian phan hoi API (p95, p99) | **Chua co** | — |
| JVM metrics (heap, GC, thread) | **Chua co** | — |
| Alert tu dong theo nguong | **Chua co** | — |

**Han che thuc te:** Khi system chay cham hoac co error tang dot bien, doi van hanh phai `grep` log thu cong de tim nguon goc. Khong co bieu do lich su, kho phan tich xu huong hoac phat hien hoi qui truoc khi anh huong user.

---

## 2. Loi ich sau khi nang cap

Sau khi trien khai stack Prometheus + Grafana, doi van hanh co the:

- **Phat hien som:** thay CPU tang bat thuong 20 phut truoc khi service crash.
- **Phan tich hieu nang:** bieu do thoi gian phan hoi API theo tung endpoint, phan biet p50/p95/p99.
- **Theo doi JVM:** heap usage, GC pause time, thread pool saturation — phat hien memory leak truoc khi bi OOM kill.
- **Error rate alert:** tu dong nhan thong bao khi error rate vuot nguong (vi du > 1% request trong 5 phut).
- **Capacity planning:** du bao disk/RAM/CPU can them truoc khi thuc su thieu.

---

## 3. Kien truc de xuat

```
[ Backend Spring Boot ]
        |
  /actuator/prometheus          <- endpoint metrics (pull model)
        |
  [ Prometheus ]                <- scrape metrics theo interval, luu time-series
        |
  [ Grafana ]                   <- dashboard, alert rules, notification channels
        |
  [ Email / Telegram / Slack ]  <- canh bao den on-call
```

**Cac thanh phan:**

| Thanh phan | Vai tro | Ghi chu |
|---|---|---|
| Spring Boot Actuator | Da co san | Da them vao `pom.xml` |
| Micrometer | Adapter metrics | Co san qua actuator transitive dep |
| `micrometer-registry-prometheus` | Xuat metrics ra dinh dang Prometheus | **Chua them, can 1 dong pom.xml** |
| Prometheus | Thu thap va luu metrics | Chay them 1 container |
| Grafana | Dashboard, alert | Chay them 1 container |

> **Diem khoi dau tot:** Backend da co `spring-boot-starter-actuator` nen `/actuator/health` dang hoat dong. Nen them `micrometer-registry-prometheus` chi can them 1 dependency va expose 1 endpoint — khong phai viet lai logic.

---

## 4. Cac buoc trien khai tham khao

> Day la phac thao o muc cao — moi buoc con can nghien cuu cu the truoc khi thuc hien trong production.

### Buoc 1: Them dependency vao backend

Them vao `backend/pom.xml`:

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### Buoc 2: Expose endpoint `/actuator/prometheus`

Them vao `backend/src/main/resources/application.properties` (hoac `.yml`):

```properties
# Chi expose health + prometheus, an cac endpoint nhay cam khac
management.endpoints.web.exposure.include=health,prometheus
management.endpoint.prometheus.enabled=true
```

Sau khi khoi dong lai backend, kiem tra:

```bash
curl http://127.0.0.1:8080/actuator/prometheus | head -20
# Mong doi: thay cac dong bat dau bang # HELP, # TYPE, jvm_*, http_server_requests_*
```

> **Bao mat:** Endpoint `/actuator/prometheus` **khong nen expose ra internet.** Nginx chi cho phep Prometheus noi bo truy cap, block tat ca request tu ngoai. Xem mau Nginx config o buoc 4.

### Buoc 3: Chay Prometheus container

Them vao `docker-compose.yaml` (tham khao):

```yaml
prometheus:
  image: prom/prometheus:latest
  restart: unless-stopped
  ports:
    - "127.0.0.1:9090:9090"    # chi lo loopback, khong expose ra ngoai
  volumes:
    - ./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus-data:/prometheus
  command:
    - "--config.file=/etc/prometheus/prometheus.yml"
    - "--storage.tsdb.retention.time=30d"
```

Noi dung file `deploy/prometheus/prometheus.yml` (tham khao):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "4thitek-backend"
    static_configs:
      - targets: ["backend:8080"]
    metrics_path: /actuator/prometheus
```

### Buoc 4: Chay Grafana container

```yaml
grafana:
  image: grafana/grafana-oss:latest
  restart: unless-stopped
  ports:
    - "127.0.0.1:3001:3000"    # chi lo loopback
  volumes:
    - grafana-data:/var/lib/grafana
  environment:
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:?set GRAFANA_ADMIN_PASSWORD}
    GF_SERVER_ROOT_URL: https://grafana.yourdomain.com
```

Sau khi chay, them Prometheus vao Grafana:
- Vao Settings → Data Sources → Add → Prometheus
- URL: `http://prometheus:9090`

### Buoc 5: Import dashboard co san

Grafana co san cac dashboard cong dong cho Spring Boot / JVM Micrometer:

| Dashboard | ID | Noi dung |
|---|---|---|
| JVM Micrometer | `4701` | Heap, GC, threads, class loading |
| Spring Boot Statistics | `6756` | HTTP request rate, error rate, response time |
| Spring Boot 3.x | `19004` | Phien ban moi hon, phu hop Spring Boot 3+ |

Import: Grafana → Dashboards → Import → Nhap ID → Load.

### Buoc 6: Cau hinh Alert

Trong Grafana (phien ban 8.0+), tao alert rule ngay tren dashboard:

Mot so nguong canh bao de xuat:

| Chi so | Nguong canh bao | Nguong nghiem trong |
|---|---|---|
| Error rate HTTP 5xx | > 0.5% trong 5 phut | > 2% trong 2 phut |
| API p99 response time | > 2s | > 5s |
| JVM heap usage | > 80% | > 95% |
| CPU usage | > 70% trong 10 phut | > 90% trong 5 phut |
| Disk usage | > 75% | > 90% |

---

## 5. Nhung dieu can luu y truoc khi trien khai

1. **Bao mat endpoint metrics:** `/actuator/prometheus` co the bi khai thac de thu thap thong tin noi bo neu bi lo ra ngoai. Phai dam bao Nginx block hoan toan truoc khi expose container Prometheus.

2. **Dung luong luu tru:** Prometheus luu time-series data tren disk. Voi retention 30 ngay va scrape interval 15s, du kien can khoang 2–5 GB tuy so metrics. Tinh toan disk truoc khi bat.

3. **Grafana admin password:** Phai manh va duoc quan ly giong cac secret khac. Them `GRAFANA_ADMIN_PASSWORD` vao `.env` va xoay vong theo chinh sach bao mat.

4. **Staging truoc:** Trien khai tren staging it nhat 1 tuan truoc khi ap dung len production. Dam bao scrape khong gay overhead dang ke len backend (thuong rat nho, duoi 1% CPU).

5. **Nguon luc con nguoi:** Cai dat la buoc nho nhat — phan kho la viet alert rule co y nghia va xay dung on-call process. Nen co it nhat mot nguoi da lam viec voi Grafana/Prometheus truoc khi giao cho team tu quan ly.

---

## 6. Phuong an don gian hon (neu chua san sang voi Prometheus/Grafana)

Neu chua co nguon luc trien khai stack day du, mot so cong cu nhe hon co the bo sung ngay:

| Phuong an | Cong cu | Loi ich |
|---|---|---|
| Uptime + alert email | UptimeRobot (mien phi) | Biet ngay khi service down |
| Log-based alert | Papertrail hoac Logtail (co goi mien phi) | Tim pattern loi trong log tap trung |
| Infrastructure metrics | Netdata (cai 1 lenh) | CPU/RAM/disk/network theo thoi gian thuc, khong can cau hinh |
| Simple APM | Sentry (mien phi den 5k event/thang) | Bat exception tu dong, stacktrace, alert |

Day khong phai thay the cho Prometheus/Grafana, nhung co the la buoc dem phu hop hon voi team nho.

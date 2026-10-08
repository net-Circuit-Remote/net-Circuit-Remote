# net*CIRCUIT Remote

<div align="center">

**Languages / Ngôn ngữ:**  
[English](#english) | [Tiếng Việt](#tiếng-việt)

</div>

---

<a id="english"></a>
## English

**net*CIRCUIT Remote** is a Web-first remote digital-electronics laboratory platform designed to let users build experiments in a browser, validate/simulate them in software, and later execute the same experiment model on real logic IC hardware controlled by FPGA through a Raspberry Pi 5.

> **Repository status:** initial architecture + software scaffold. Virtual Hardware foundations are present. Physical FPGA control, SDRAM, Generator, Oscilloscope acquisition, routing hardware, and production deployment are **not implemented yet**.

### Table of Contents
- [V1 architecture baseline](#v1-architecture-baseline)
- [Core boundary](#core-boundary)
- [Repository structure](#repository-structure)
- [Read this before development](#read-this-before-development)
- [Quick start — verification](#quick-start--verification)
- [Quick start — Web frontend](#quick-start--web-frontend)
- [Quick start — Application Backend](#quick-start--application-backend)
- [Quick start — Hardware Service tests](#quick-start--hardware-service-tests)
- [Quick start — Circuit Simulator](#quick-start--circuit-simulator)
- [FPGA development path](#fpga-development-path)
- [Breadboard routing note](#breadboard-routing-note)
- [Raspberry Pi deployment](#raspberry-pi-deployment)
- [Project history and handoff](#project-history-and-handoff)
- [License](#license)

### V1 architecture baseline

| Layer | Baseline |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + Three.js boundary |
| Application backend | Python + FastAPI + Pydantic + SQLAlchemy + WebSocket |
| Hardware backend | Python + gRPC/Protobuf + Hardware Station abstraction |
| Database | SQLite |
| Main controller | Raspberry Pi 5, Raspberry Pi OS 64-bit |
| Web server | Nginx |
| Process manager | systemd |
| Prototype FPGA | Cyclone IV EP4CE6E22C8N, no SDRAM, Experiment Controller only |
| Final V1 FPGA | Cyclone IV EP4CE10E22C8N |
| Final V1 memory | 64 MB SDR SDRAM, 16-bit |
| Breadboard target | >= 2 physical breadboards |

### Core boundary

```text
Browser
   |
   | REST / WebSocket
   v
FastAPI Application Backend
   |
   | Hardware contract
   v
Hardware Service
   |
   v
Hardware Station
   |----------------------|
   v                      v
Virtual Hardware      Physical Hardware
(now)                 (FPGA later)
```

The Browser never directly writes FPGA registers, raw MUX addresses, or Linux SPI devices. It produces a **Circuit Graph**; backend layers validate and translate that graph before any physical action.

### Repository structure

```text
net-Circuit-Remote/
├── apps/web/                         Vue browser application
├── services/api/                     FastAPI application backend
├── services/hardware-service/        Hardware Station abstraction
├── simulator/circuit-simulator/      Virtual digital hardware simulator
├── fpga/                             Verilog/Quartus workspace
├── contracts/                        Circuit/API/hardware/FPGA contracts
├── device-library/                   Device and breadboard metadata
├── deployment/                       Nginx/systemd/Raspberry Pi templates
├── tests/                            Cross-subsystem tests
├── scripts/                          Context/development helpers
├── docs/                             Architecture and project context
└── .github/workflows/                CI starter workflows
```

### Read this before development

AI agents and human contributors should read in this order:

1. [`docs/CONTEXT.md`](docs/CONTEXT.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/ROADMAP.md`](docs/ROADMAP.md)
4. [`docs/DEV_LOG.md`](docs/DEV_LOG.md)
5. [`docs/CIRCUIT_SPEC.md`](docs/CIRCUIT_SPEC.md) when working on hardware/contracts

The approved architecture specification is in `docs/superpowers/specs/2026-10-08-net-circuit-remote-architecture-design.md`.

### Quick start — verification

From the repository root, in a development environment where the Python test dependencies for the relevant subsystems are installed:

```bash
python3 scripts/check_context.py
pytest -q
```

The scaffold's Python/static test suite does not require physical FPGA hardware. Each Python subsystem declares its own test dependencies in its `pyproject.toml`; CI workflows install the dependencies needed by their scope.

### Quick start — Web frontend

```bash
cd apps/web
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The current Web UI is a shell. The full Three.js breadboard/circuit editor belongs to later Web phases.

### Quick start — Application Backend

```bash
cd services/api
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Initial endpoints:

- `GET /api/health`
- `POST /api/circuits/validate`
- `GET /api/stations`
- `WS /ws/events`

### Quick start — Hardware Service tests

```bash
pytest -q services/hardware-service/tests
```

`VirtualHardwareStation` is the early-development implementation. `PhysicalHardwareStation` intentionally reports unavailable until a real FPGA driver is provided.

The gRPC server file is only a transport shell at this stage; generated Protobuf service bindings and handlers are not yet registered.

### Quick start — Circuit Simulator

```bash
pytest -q simulator/circuit-simulator/tests
```

The initial simulator contains deterministic digital primitives and a starter 74HC08 AND model. It is not a SPICE/timing-accurate analog simulator.

### FPGA development path

FPGA work starts only after the Web platform reaches **Milestone W1** in `docs/ROADMAP.md`.

```text
Web + Virtual Hardware
        |
        v
W1 ready for FPGA integration
        |
        v
EP4CE6E22C8N
Experiment Controller prototype
(no SDRAM)
        |
        v
EP4CE10E22C8N
+ 64 MB SDR SDRAM 16-bit
        |
        +-- Experiment Control Domain
        `-- Instrument Domain
```

The FPGA workspace currently contains only a compile-safe placeholder top module and documentation boundaries. It does **not** implement SPI, routing, SDRAM, Logic Analyzer, Generator, or Oscilloscope functions yet.

### Breadboard routing note

Physical breadboard holes are not equivalent to independent FPGA channels:

```text
Physical Contact
      -> Electrical Node
      -> Routing Resource
      -> MUX / Crosspoint / Switching Fabric
      -> FPGA-controlled Source or Destination
```

The exact independent routing count remains uncommitted until the switching architecture and electrical design are selected.

### Raspberry Pi deployment

Starter templates live in `deployment/`. The baseline topology is:

```text
Browser -> Nginx (:80/:443 later)
             |-> static Vue files
             `-> FastAPI 127.0.0.1:8000
                       |
                       `-> Hardware Service 127.0.0.1:50051
```

These are starter templates, not a production-security claim. TLS/authentication/firewall/secrets hardening remain future work.

### Project history and handoff

- `docs/CHANGELOG.md` — release-facing changes
- `docs/DEV_LOG.md` — current state, verification evidence, next task, AI handoff
- `docs/CONTEXT.md` — architectural rules that must not silently drift

### License

No project license has been selected in this scaffold. Add a `LICENSE` only after the project owner chooses one.

---

<a id="tiếng-việt"></a>
## Tiếng Việt

**net*CIRCUIT Remote** là nền tảng phòng thí nghiệm điện tử số từ xa ưu tiên giao diện Web (Web-first), được thiết kế để người dùng xây dựng các bài thí nghiệm ngay trên trình duyệt, kiểm tra và mô phỏng trên phần mềm, và sau đó thực thi chính mô hình thí nghiệm đó trên phần cứng IC logic thực tế được điều khiển bởi FPGA thông qua máy tính nhúng Raspberry Pi 5.

> **Trạng thái kho lưu trữ:** Kiến trúc ban đầu + khung sườn phần mềm (scaffold). Nền tảng Phần cứng Ảo (Virtual Hardware) đã sẵn sàng. Điều khiển FPGA vật lý, SDRAM, Máy phát xung (Generator), Thu thập tín hiệu Dao động ký (Oscilloscope), phần cứng định tuyến ma trận và triển khai môi trường production **chưa được cài đặt**.

### Mục lục
- [Nền tảng kiến trúc V1](#nền-tảng-kiến-trúc-v1)
- [Ranh giới cốt lõi](#ranh-giới-cốt-lõi)
- [Cấu trúc kho lưu trữ](#cấu-trúc-kho-lưu-trữ)
- [Đọc trước khi phát triển](#đọc-trước-khi-phát-triển)
- [Khởi động nhanh — Kiểm tra & Xác minh](#khởi-động-nhanh--kiểm-tra--xác-minh)
- [Khởi động nhanh — Giao diện Web (Frontend)](#khởi-động-nhanh--giao-diện-web-frontend)
- [Khởi động nhanh — Backend ứng dụng](#khởi-động-nhanh--backend-ứng-dụng)
- [Khởi động nhanh — Kiểm thử Dịch vụ phần cứng (Hardware Service)](#khởi-động-nhanh--kiểm-thử-dịch-vụ-phần-cứng-hardware-service)
- [Khởi động nhanh — Trình mô phỏng mạch (Circuit Simulator)](#khởi-động-nhanh--trình-mô-phỏng-mạch-circuit-simulator)
- [Lộ trình phát triển FPGA](#lộ-trình-phát-triển-fpga)
- [Lưu ý về định tuyến breadboard](#lưu-ý-về-định-tuyến-breadboard)
- [Triển khai trên Raspberry Pi](#triển-khai-trên-raspberry-pi)
- [Lịch sử dự án và chuyển giao](#lịch-sử-dự-án-và-chuyển-giao)
- [Giấy phép (License)](#giấy-phép-license)

### Nền tảng kiến trúc V1

| Tầng / Thành phần | Nền tảng kỹ thuật |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + ranh giới Three.js |
| Application backend | Python + FastAPI + Pydantic + SQLAlchemy + WebSocket |
| Hardware backend | Python + gRPC/Protobuf + trừu tượng hóa Hardware Station |
| Cơ sở dữ liệu | SQLite |
| Bộ điều khiển chính | Raspberry Pi 5, Raspberry Pi OS 64-bit |
| Web server | Nginx |
| Quản lý tiến trình | systemd |
| FPGA nguyên mẫu | Cyclone IV EP4CE6E22C8N, không SDRAM, chỉ điều khiển thí nghiệm (Experiment Controller only) |
| FPGA phiên bản V1 chính thức | Cyclone IV EP4CE10E22C8N |
| Bộ nhớ V1 chính thức | 64 MB SDR SDRAM, 16-bit |
| Mục tiêu Breadboard | >= 2 breadboard vật lý |

### Ranh giới cốt lõi

```text
Trình duyệt (Browser)
   |
   | REST / WebSocket
   v
FastAPI Application Backend
   |
   | Giao thức phần cứng (Hardware contract)
   v
Hardware Service
   |
   v
Hardware Station
   |----------------------|
   v                      v
Virtual Hardware      Physical Hardware
(Hiện tại)            (FPGA sau này)
```

Trình duyệt không bao giờ ghi trực tiếp vào thanh ghi FPGA, địa chỉ MUX thô hay các thiết bị SPI của Linux. Trình duyệt chỉ tạo ra **Đồ thị Mạch điện (Circuit Graph)**; các tầng backend sẽ xác thực và chuyển đổi đồ thị này trước khi thực thi bất kỳ tác vụ vật lý nào.

### Cấu trúc kho lưu trữ

```text
net-Circuit-Remote/
├── apps/web/                         Ứng dụng trình duyệt Vue (Vue browser application)
├── services/api/                     Backend ứng dụng FastAPI (FastAPI application backend)
├── services/hardware-service/        Lớp trừu tượng Hardware Station (Hardware Station abstraction)
├── simulator/circuit-simulator/      Trình mô phỏng phần cứng số ảo (Virtual digital hardware simulator)
├── fpga/                             Không gian làm việc Verilog/Quartus (Verilog/Quartus workspace)
├── contracts/                        Hợp đồng đặc tả Circuit/API/hardware/FPGA (Circuit/API/hardware/FPGA contracts)
├── device-library/                   Dữ liệu đặc tả linh kiện và breadboard (Device and breadboard metadata)
├── deployment/                       Mẫu cấu hình Nginx/systemd/Raspberry Pi (Nginx/systemd/Raspberry Pi templates)
├── tests/                            Kiểm thử tích hợp chéo giữa các hệ thống con (Cross-subsystem tests)
├── scripts/                          Tập lệnh hỗ trợ ngữ cảnh / phát triển (Context/development helpers)
├── docs/                             Tài liệu kiến trúc và ngữ cảnh dự án (Architecture and project context)
└── .github/workflows/                Quy trình tự động hóa CI khởi đầu (CI starter workflows)
```

### Đọc trước khi phát triển

Các AI agent và lập trình viên nên đọc tài liệu theo thứ tự sau:

1. [`docs/CONTEXT.md`](docs/CONTEXT.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/ROADMAP.md`](docs/ROADMAP.md)
4. [`docs/DEV_LOG.md`](docs/DEV_LOG.md)
5. [`docs/CIRCUIT_SPEC.md`](docs/CIRCUIT_SPEC.md) khi làm việc về phần cứng hoặc các hợp đồng giao tiếp

Tài liệu đặc tả kiến trúc đã được phê chuẩn nằm tại `docs/superpowers/specs/2026-10-08-net-circuit-remote-architecture-design.md`.

### Khởi động nhanh — Kiểm tra & Xác minh

Từ thư mục gốc của kho lưu trữ, trong môi trường phát triển đã cài đặt đầy đủ các phụ thuộc kiểm thử Python cho các hệ thống con tương ứng:

```bash
python3 scripts/check_context.py
pytest -q
```

Bộ kiểm thử tĩnh/Python của khung sườn dự án không yêu cầu phần cứng FPGA vật lý. Mỗi hệ thống con Python tự khai báo các phụ thuộc kiểm thử riêng trong file `pyproject.toml` của nó; các quy trình CI sẽ cài đặt các phụ thuộc phù hợp theo từng phạm vi.

### Khởi động nhanh — Giao diện Web (Frontend)

```bash
cd apps/web
npm install
npm run dev
```

Đóng gói bản phát hành (Production build):

```bash
npm run build
```

Giao diện Web hiện tại là khung ban đầu (shell). Trình chỉnh sửa breadboard/mạch điện Three.js đầy đủ thuộc về các giai đoạn Web tiếp theo.

### Khởi động nhanh — Backend ứng dụng

```bash
cd services/api
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Các endpoint ban đầu:

- `GET /api/health`
- `POST /api/circuits/validate`
- `GET /api/stations`
- `WS /ws/events`

### Khởi động nhanh — Kiểm thử Dịch vụ phần cứng (Hardware Service)

```bash
pytest -q services/hardware-service/tests
```

`VirtualHardwareStation` là bản triển khai trong giai đoạn phát triển ban đầu. `PhysicalHardwareStation` chủ ý báo trạng thái chưa khả dụng cho đến khi có driver FPGA thực tế.

Tệp gRPC server ở giai đoạn này mới chỉ là vỏ bọc giao vận (transport shell); các binding và handler của dịch vụ Protobuf chưa được đăng ký.

### Khởi động nhanh — Trình mô phỏng mạch (Circuit Simulator)

```bash
pytest -q simulator/circuit-simulator/tests
```

Trình mô phỏng ban đầu chứa các phần tử logic số nguyên thủy tất định và mô hình cổng AND 74HC08 cơ bản. Đây không phải là trình mô phỏng tương tự chính xác theo thời gian kiểu SPICE.

### Lộ trình phát triển FPGA

Công việc FPGA chỉ bắt đầu sau khi nền tảng Web đạt mốc **Milestone W1** trong `docs/ROADMAP.md`.

```text
Web + Virtual Hardware
        |
        v
W1 sẵn sàng tích hợp FPGA
        |
        v
EP4CE6E22C8N
Nguyên mẫu bộ điều khiển thí nghiệm
(không SDRAM)
        |
        v
EP4CE10E22C8N
+ 64 MB SDR SDRAM 16-bit
        |
        +-- Miền điều khiển thí nghiệm
        `-- Miền thiết bị đo lường
```

Không gian làm việc FPGA hiện tại chỉ chứa module top giữ chỗ an toàn khi biên dịch và tài liệu phân định phạm vi. Hiện tại **chưa** triển khai các chức năng SPI, routing, SDRAM, Logic Analyzer, Máy phát xung, hay Dao động ký (Oscilloscope).

### Lưu ý về định tuyến breadboard

Các lỗ cắm trên breadboard vật lý không tương đương với các kênh FPGA độc lập:

```text
Tiếp xúc vật lý (Physical Contact)
      -> Nút điện (Electrical Node)
      -> Tài nguyên định tuyến (Routing Resource)
      -> Ma trận chuyển mạch MUX / Crosspoint
      -> Nguồn hoặc Đích điều khiển bởi FPGA
```

Số lượng kết nối định tuyến độc lập chính xác sẽ chưa được cam kết cho đến khi kiến trúc chuyển mạch và thiết kế phần cứng điện tử được chốt hoàn tất.

### Triển khai trên Raspberry Pi

Các tệp cấu hình mẫu khởi đầu nằm trong thư mục `deployment/`. Cấu trúc mạng cơ sở:

```text
Browser -> Nginx (cổng :80/:443 sau này)
             |-> tệp tĩnh Vue
             `-> FastAPI 127.0.0.1:8000
                       |
                       `-> Hardware Service 127.0.0.1:50051
```

Đây chỉ là các mẫu khởi đầu, không phải cam kết bảo mật cho production. Việc thiết lập bảo mật TLS/xác thực/tường lửa/bí mật (secrets) sẽ được thực hiện trong tương lai.

### Lịch sử dự án và chuyển giao

- `docs/CHANGELOG.md` — thay đổi liên quan đến các bản phát hành
- `docs/DEV_LOG.md` — trạng thái hiện tại, minh chứng xác minh, nhiệm vụ tiếp theo, chuyển giao AI
- `docs/CONTEXT.md` — các nguyên tắc kiến trúc bất biến, không được phép lệch lạc

### Giấy phép (License)

Chưa có giấy phép dự án nào được chọn trong khung sườn này. Chỉ thêm `LICENSE` sau khi chủ sở hữu dự án quyết định.

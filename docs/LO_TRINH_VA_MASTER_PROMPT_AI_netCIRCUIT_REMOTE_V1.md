# LỘ TRÌNH PHÁT TRIỂN + MASTER PROMPT AI
# DỰ ÁN net*CIRCUIT Remote V1

**Repository:** `https://github.com/net-Circuit-Remote/net-Circuit-Remote`  
**Ngôn ngữ tài liệu:** Tiếng Việt  
**Mục tiêu:** Dùng tài liệu này làm lộ trình phát triển chính và làm Prompt chuẩn để giao cho AI/Codex/ChatGPT tiếp tục xây dựng dự án mà không bị lệch kiến trúc hoặc “quên ngữ cảnh”.

---

# PHẦN I — BỐI CẢNH VÀ CÁC QUYẾT ĐỊNH ĐÃ CHỐT

## 1. Mục tiêu tổng thể

`net*CIRCUIT Remote` là nền tảng phòng thí nghiệm điện tử số từ xa.

Người dùng sẽ:

1. mở giao diện Web;
2. đặt linh kiện số lên breadboard ảo;
3. nối dây trực quan;
4. tạo Circuit Graph/Netlist;
5. chạy mô phỏng trên Virtual Hardware trước;
6. quan sát Logic Analyzer/waveform;
7. sau khi nền Web hoàn thiện, cùng project đó có thể chạy trên phần cứng thật;
8. Raspberry Pi 5 quản lý WebServer, session, tài nguyên và Hardware Service;
9. FPGA xử lý các tác vụ timing-critical;
10. IC logic thật được kết nối thông qua routing fabric/MUX/crosspoint.

---

## 2. Kiến trúc V1 đã khóa

Không được tự ý thay đổi các lựa chọn sau nếu chưa được người dùng chấp thuận:

### Main Controller

- Raspberry Pi 5
- Raspberry Pi OS 64-bit
- Nginx
- systemd
- SQLite cho V1

### Frontend

- Vue 3
- TypeScript
- Vite
- Pinia
- Three.js
- SVG/Canvas khi phù hợp
- WebSocket cho realtime data

### Application Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- REST API
- WebSocket

### Hardware Backend

- Python
- gRPC
- Protobuf
- Hardware Abstraction Layer
- Hardware Station abstraction

### FPGA Prototype

- Cyclone IV `EP4CE6E22C8N`
- Không SDRAM
- Chỉ dùng để kiểm chứng `Experiment Controller`

### FPGA Final V1

- Cyclone IV `EP4CE10E22C8N`
- Một FPGA cho V1
- SDR SDRAM ngoài:
  - 64 MB
  - bus 16-bit

### Breadboard

- Tối thiểu 2 breadboard vật lý
- Không được hiểu:
  - 260 lỗ breadboard = 260 FPGA GPIO
  - 260 lỗ breadboard = 260 routing channel độc lập

Phải phân biệt:

```text
Physical Hole
    ↓
Electrical Node
    ↓
Routing Resource
    ↓
MUX / Crosspoint / Switching Fabric
    ↓
FPGA-controlled endpoint
```

---

# PHẦN II — NGUYÊN TẮC PHÁT TRIỂN

## 3. Thứ tự phát triển bắt buộc

Dự án phải phát triển theo thứ tự:

```text
Architecture
    ↓
Web Platform
    ↓
Circuit Workspace
    ↓
Simulator
    ↓
Backend
    ↓
Hardware Service
    ↓
Virtual End-to-End
    ↓
Raspberry Pi Deployment
    ↓
MILESTONE W1
    ↓
EP4CE6 Experiment Controller
    ↓
Pi ↔ FPGA
    ↓
Routing Hardware
    ↓
EP4CE10
    ↓
SDRAM
    ↓
Logic Analyzer
    ↓
Generator
    ↓
Oscilloscope
    ↓
2+ Breadboards
    ↓
Multi-user
    ↓
Thesis V1
```

Không được nhảy thẳng sang FPGA khi W1 chưa đạt.

---

## 4. Quy tắc về abstraction

Frontend không được biết:

- địa chỉ register FPGA;
- địa chỉ SPI Linux;
- địa chỉ MUX;
- số chân FPGA vật lý;
- chuỗi switching hardware cụ thể.

Frontend chỉ làm việc với:

```text
Circuit Graph
Station Capability
Experiment
Instrument
Waveform
Logical Resources
```

Hardware-specific translation phải nằm trong:

```text
Application Backend
        ↓
Hardware Service
        ↓
Hardware Driver
        ↓
FPGA
```

---

## 5. Hardware Station

Phần mềm phải nhìn phần cứng dưới dạng:

```text
HardwareStation
├── Experiment Controller
├── Instrument Controller
├── Routing Fabric
├── Breadboard[]
├── Logic IC Resources
└── Measurement Resources
```

Không hard-code rằng một station vĩnh viễn chỉ có một FPGA.

V1 sử dụng một FPGA, nhưng kiến trúc phải cho phép tương lai tách Instrument Domain sang FPGA thứ hai mà không phải sửa Frontend.

---

## 6. Simulation-first

Hai implementation:

```text
HardwareStation
│
├── VirtualHardwareStation
└── PhysicalHardwareStation
```

Cùng một interface logic:

```text
get_capabilities()
validate_configuration()
apply_circuit()
set_input()
configure_clock()
configure_generator()
configure_trigger()
arm_capture()
run()
stop()
read_capture()
safe_state()
reset()
```

Frontend và Application Backend không được phụ thuộc trực tiếp vào implementation bên dưới.

---

# PHẦN III — LỘ TRÌNH PHÁT TRIỂN CHI TIẾT

# PHASE 0 — PROJECT ARCHITECTURE [X]

## Trạng thái

**Đã hoàn thành ở mức nền tảng.**

Đã có:

- modular monorepo;
- documentation baseline;
- contracts baseline;
- frontend shell;
- backend shell;
- HardwareStation abstraction;
- simulator starter;
- FPGA workspace;
- CI workflows;
- Raspberry Pi deployment template.

## Việc nên làm ngay khi bắt đầu phiên AI mới

AI phải kiểm tra:

```text
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/DEV_LOG.md
```

Sau khi CI đã xanh, cập nhật `DEV_LOG.md` để loại bỏ trạng thái blocking frontend build cũ nếu file chưa được cập nhật.

---

# PHASE 1 — WEB FOUNDATION

## Mục tiêu

Tạo bộ khung Web ổn định để toàn bộ tính năng sau này phát triển trên đó.

## Hạng mục

### 1. Application Layout

Thiết kế giao diện chính:

```text
┌────────────────────────────────────────────────────────────┐
│ Top Bar                                                    │
├──────────────┬──────────────────────────────┬───────────────┤
│ Component    │                              │ Properties /  │
│ Library      │      Lab Workspace           │ Inspector     │
│              │                              │               │
├──────────────┴──────────────────────────────┴───────────────┤
│ Instrument / Logic Analyzer / Console                      │
└────────────────────────────────────────────────────────────┘
```

### 2. Main Pages

Tối thiểu:

```text
/
├── Dashboard
├── Laboratory
├── Circuits
├── Stations
├── Experiments
└── Settings
```

Trong giai đoạn đầu ưu tiên:

```text
Laboratory
Circuits
Stations
```

### 3. App State

Pinia stores nên chia:

```text
stores/
├── circuit.ts
├── workspace.ts
├── station.ts
├── experiment.ts
├── instrument.ts
└── ui.ts
```

### 4. Typed API

Không gọi `fetch()` rải rác.

Tạo layer:

```text
src/services/
├── api/
│   ├── client.ts
│   ├── circuits.ts
│   ├── stations.ts
│   └── experiments.ts
└── websocket/
```

### 5. Status Model

Frontend phải phân biệt:

```text
SIMULATION
HARDWARE_AVAILABLE
HARDWARE_BUSY
HARDWARE_OFFLINE
FAULT
```

## Acceptance Criteria Phase 1

- `npm run build` PASS.
- layout responsive ở desktop.
- Pinia stores tách rõ.
- API service typed.
- WebSocket client có reconnect strategy cơ bản.
- không tồn tại import FPGA/hardware driver trong frontend.
- frontend CI PASS.

---

# PHASE 2 — CIRCUIT WORKSPACE

## Mục tiêu

Xây dựng giao diện phòng lab số trực quan.

## Kiến trúc rendering khuyến nghị

```text
Three.js
    ↓
3D / pseudo-3D laboratory scene
    ↓
Breadboard
IC
Switch
LED
Instrument connectors

SVG/Canvas Overlay
    ↓
Wires
selection
drag feedback
labels
connection indicators
```

Không bắt buộc mọi thứ đều là 3D mesh.

Ưu tiên:

- dễ thao tác;
- nhìn rõ pin;
- wiring chính xác;
- hiệu năng ổn định.

## Chức năng

### Component Library

Ban đầu:

```text
INPUT
- Toggle Switch
- Push Button
- Clock

OUTPUT
- LED
- Logic Probe

LOGIC IC
- 74HC08 AND
- 74HC32 OR
- 74HC04 NOT
- 74HC00 NAND
- 74HC02 NOR
- 74HC86 XOR

LATER
- Flip-Flop
- Counter
- Shift Register
- Decoder
- MUX
```

### Workspace

Phải hỗ trợ:

```text
place component
move component
rotate component
select
delete
wire
unwire
zoom
pan
undo
redo
```

### Breadboard

Breadboard metadata phải khai báo node groups.

Ví dụ:

```json
{
  "id": "BB0",
  "contacts": [],
  "electrical_nodes": []
}
```

Không dùng pixel position làm electrical identity.

## Circuit Graph

Mọi thao tác người dùng cuối cùng phải ánh xạ thành:

```text
modules[]
connections[]
metadata
schema_version
```

## Acceptance Criteria Phase 2

Người dùng có thể:

1. đặt 2 switch;
2. đặt IC 74HC08;
3. đặt LED;
4. nối dây;
5. tạo Circuit Graph hợp lệ;
6. save/load lại vẫn đúng topology.

---

# PHASE 3 — DIGITAL CIRCUIT SIMULATOR

## Mục tiêu

Cho phép toàn bộ Web hoạt động trước khi có FPGA.

## Simulator Layers

```text
Circuit Graph
    ↓
Graph Parser
    ↓
Net Resolver
    ↓
Device Models
    ↓
Event Engine
    ↓
Simulation State
    ↓
Waveform/Capture
```

## Giai đoạn 3A — Combinational Logic

Implement:

```text
AND
OR
NOT
NAND
NOR
XOR
```

Phải có unit test truth table.

## Giai đoạn 3B — Sequential

Sau combinational:

```text
D Flip-Flop
JK Flip-Flop
T Flip-Flop
Counter
Shift Register
```

Cần xử lý:

```text
clock edge
reset
state
propagation event
```

## Giai đoạn 3C — Virtual Clock

Clock model:

```text
frequency
period
duty_cycle
enabled
```

## Giai đoạn 3D — Virtual Logic Analyzer

Output:

```text
timestamp
channel
value
```

Tạo waveform data cho frontend.

## Acceptance Criteria Phase 3

Một circuit:

```text
Clock → Counter → LED
```

phải chạy được hoàn toàn trong simulator.

---

# PHASE 4 — APPLICATION BACKEND

## Mục tiêu

Backend trở thành control plane thực sự của hệ thống.

## Modules

```text
services/api/app/
├── api/
├── models/
├── schemas/
├── services/
│   ├── circuit_service.py
│   ├── experiment_service.py
│   ├── station_service.py
│   └── resource_service.py
├── repositories/
└── websocket/
```

## Circuit Validation

Phân tầng:

```text
Schema Validation
    ↓
Graph Validation
    ↓
Electrical/Logical Validation
    ↓
Resource Validation
```

Ví dụ lỗi:

```text
INVALID_SCHEMA
FLOATING_INPUT
MULTIPLE_OUTPUT_DRIVERS
UNKNOWN_COMPONENT
UNKNOWN_PIN
UNSUPPORTED_ROUTE
RESOURCE_EXHAUSTED
```

Không chỉ trả:

```json
{"error": "error"}
```

## Persistence

SQLite lưu:

```text
Circuit
Experiment
User/Session
Station metadata
Execution history
```

## Acceptance Criteria Phase 4

- save/load circuit;
- version circuit schema;
- validation có structured errors;
- API tests PASS;
- database migration strategy rõ ràng.

---

# PHASE 5 — HARDWARE SERVICE

## Mục tiêu

Tách hoàn toàn Web/application logic khỏi hardware implementation.

## gRPC

Implement service:

```text
GetCapabilities
ValidateConfiguration
ApplyCircuit
SetInput
ConfigureClock
ConfigureGenerator
ConfigureTrigger
ArmCapture
Run
Stop
ReadCapture
SafeState
Reset
```

## Adapter

```text
HardwareService
      ↓
StationManager
      ↓
HardwareStation
     / \
Virtual Physical
```

## Physical Station

Ở thời điểm này Physical implementation vẫn có thể trả:

```text
NOT_AVAILABLE
NOT_IMPLEMENTED
```

Không được giả lập success nếu FPGA chưa tồn tại.

## Acceptance Criteria Phase 5

- gRPC generated code;
- server start;
- VirtualHardwareStation hoạt động qua gRPC;
- backend gọi Hardware Service thành công;
- PhysicalHardwareStation fail-safe khi chưa có hardware.

---

# PHASE 6 — VIRTUAL END-TO-END

## Mục tiêu

Hoàn chỉnh vòng đời experiment mà không cần FPGA.

## Flow bắt buộc

```text
Browser
    ↓
Circuit Graph
    ↓
FastAPI
    ↓
Validation
    ↓
Acquire Virtual Station
    ↓
Hardware Service
    ↓
VirtualHardwareStation
    ↓
Simulator
    ↓
Capture
    ↓
WebSocket
    ↓
Waveform Viewer
```

## Experiment State Machine

Khuyến nghị:

```text
CREATED
VALIDATING
READY
QUEUED
CONFIGURING
ARMED
RUNNING
CAPTURING
COMPLETED

ERROR
CANCELLED
```

## Resource Lock

Một Hardware Station không được bị hai experiment cùng điều khiển nếu tài nguyên vật lý không cho phép.

## Acceptance Criteria Phase 6

E2E test:

```text
SW1
SW2
 ↓
74HC08
 ↓
LED
```

Khi:

```text
SW1 = 1
SW2 = 1
```

Kết quả:

```text
LED = ON
Logic Analyzer:
A = 1
B = 1
Y = 1
```

---

# PHASE 7 — RASPBERRY PI DEPLOYMENT

## Mục tiêu

Đưa toàn bộ software stack lên Raspberry Pi 5.

## Deployment

```text
Nginx
├── static Vue dist
├── /api → FastAPI
└── /ws → FastAPI WebSocket

systemd
├── netcircuit-api.service
└── netcircuit-hardware.service
```

Hardware Service:

```text
127.0.0.1
hoặc
Unix Domain Socket
```

Không expose trực tiếp ra Internet.

## Acceptance Criteria

- reboot Pi;
- services tự khởi động;
- Web truy cập được;
- Virtual experiment chạy được;
- logs xem được qua journalctl;
- restart backend không làm hỏng cấu hình hệ thống.

---

# MILESTONE W1 — WEB PLATFORM READY FOR FPGA

Chỉ được bắt đầu FPGA sau khi W1 đạt.

## W1 Checklist

```text
[ ] Frontend application shell hoàn chỉnh
[ ] Laboratory workspace
[ ] Breadboard model
[ ] Component library cơ bản
[ ] Wiring
[ ] Circuit Graph
[ ] Save/load
[ ] Circuit Validator
[ ] Simulator combinational
[ ] Simulator sequential cơ bản
[ ] Virtual Clock
[ ] Virtual Logic Analyzer
[ ] Waveform Viewer
[ ] FastAPI
[ ] WebSocket
[ ] Hardware Service gRPC
[ ] VirtualHardwareStation
[ ] Experiment state machine
[ ] Resource locking
[ ] Structured errors
[ ] Raspberry Pi deployment
[ ] Automated integration test
[ ] Virtual E2E PASS
```

---

# PHASE 8 — EP4CE6 EXPERIMENT CONTROLLER

## Mục tiêu

EP4CE6 chỉ dùng để bring-up Experiment Controller.

Không phát triển SDRAM, Oscilloscope hoặc AWG trên EP4CE6.

## RTL Structure

```text
fpga/
├── common/
│   ├── reset_sync.v
│   ├── sync_2ff.v
│   ├── fifo/
│   └── protocol/
│
└── experiment-controller/
    └── rtl/
        ├── top.v
        ├── experiment_controller.v
        ├── gpio_controller.v
        ├── clock_generator.v
        ├── routing_controller.v
        ├── safe_state_fsm.v
        └── register_bank.v
```

## Bring-up Order

```text
1. Clock
2. Reset
3. LED heartbeat
4. DEVICE_ID
5. FW_VERSION
6. PROTOCOL_VERSION
7. GPIO
8. Clock Generator
9. Safe State
10. Routing control
```

## Acceptance Criteria

Pi đọc được:

```text
DEVICE_ID
FW_VERSION
PROTOCOL_VERSION
STATUS
```

và điều khiển GPIO test.

---

# PHASE 9 — RASPBERRY PI ↔ FPGA

## Baseline

Ưu tiên SPI.

Architecture:

```text
Raspberry Pi 5
      ↓
SPI
      ↓
FPGA Protocol Decoder
      ↓
Register Bank
      ↓
Experiment Controller
```

Protocol cần:

```text
magic
protocol_version
command
address
length
payload
CRC/check
status/error
```

Không để Browser gửi packet FPGA trực tiếp.

---

# PHASE 10 — ROUTING HARDWARE

Đây là phase phải nghiên cứu kỹ trước khi chọn linh kiện.

## Cần xác định

- số node thật sự cần controllable;
- routing topology;
- MUX;
- analog/digital switch;
- crosspoint;
- fanout;
- voltage compatibility;
- logic family;
- protection;
- switching delay;
- signal integrity.

## Không được giả định

```text
260 holes = 260 switches
```

## Deliverable

Tạo:

```text
docs/ROUTING_ARCHITECTURE.md
```

trước khi thiết kế PCB.

---

# PHASE 11 — EP4CE10 MIGRATION

Sau khi Experiment Controller ổn định trên EP4CE6:

```text
EP4CE6 RTL
    ↓
portable common RTL
    ↓
EP4CE10 target
```

Kiểm tra:

```text
Logic Elements
RAM blocks
PLL
GPIO
Fmax
timing slack
```

Không dùng source phụ thuộc pin EP4CE6 trong logic core.

---

# PHASE 12 — SDR SDRAM 64 MB

Chỉ bắt đầu khi part number chính thức được chọn.

## Quy trình

```text
Select SDRAM
    ↓
Read Datasheet
    ↓
Timing Parameters
    ↓
SDRAM Controller
    ↓
Init
    ↓
Refresh
    ↓
Read/Write
    ↓
Burst
    ↓
Memory Test
```

## Memory Clients

Sau này:

```text
SDRAM Arbiter
├── Logic Analyzer
├── Oscilloscope Acquisition
├── Generator Waveform
└── Raspberry Pi Readback
```

---

# PHASE 13 — LOGIC ANALYZER

## Pipeline

```text
Digital Input
    ↓
Synchronizer / Input Frontend
    ↓
Sampler
    ↓
Trigger
    ↓
FIFO
    ↓
SDRAM
    ↓
Pi
    ↓
WebSocket Binary
    ↓
Browser
```

## Features

- sample rate;
- channel selection;
- trigger edge;
- pre-trigger;
- post-trigger;
- capture length.

---

# PHASE 14 — GENERATOR

Tách hai loại:

## Digital Generator

FPGA tạo trực tiếp:

```text
clock
square
pulse
pattern
```

## Analog/AWG

Nếu cần:

```text
FPGA
 ↓
DAC
 ↓
Filter
 ↓
Output Driver
```

Không gọi digital GPIO generator là analog function generator.

---

# PHASE 15 — OSCILLOSCOPE

Nếu đo analog:

```text
Input
 ↓
Protection
 ↓
Attenuator
 ↓
Amplifier / AFE
 ↓
ADC
 ↓
FPGA
 ↓
FIFO/SDRAM
 ↓
Raspberry Pi
```

Phải chọn:

- ADC;
- sample rate;
- resolution;
- input range;
- AFE;
- protection;
- bandwidth.

Không được tuyên bố “oscilloscope hoạt động” chỉ vì FPGA đã capture digital signal.

---

# PHASE 16 — 2+ BREADBOARD PHYSICAL INTEGRATION

## Mục tiêu

Map logical workspace sang node vật lý.

## Mapping

```text
Virtual Module Pin
      ↓
Logical Net
      ↓
Physical Breadboard Node
      ↓
Routing Resource
      ↓
Switching Fabric
```

## Requirement

Mapping phải data-driven.

Không hard-code:

```text
if breadboard == 1...
if breadboard == 2...
```

Dùng:

```text
breadboards[]
nodes[]
resources[]
```

---

# PHASE 17 — MULTI-USER VALIDATION

30–50 user có thể sử dụng Web đồng thời, nhưng không có nghĩa 30–50 experiment vật lý độc lập.

Backend cần:

```text
Session Manager
Queue
Reservation
Ownership
Station Lock
Timeout
Recovery
```

## Test

- 50 Web sessions;
- many circuit edits;
- limited physical stations;
- queue fairness;
- disconnect recovery;
- station fault quarantine.

---

# PHASE 18 — THESIS V1

## Deliverables

- source code;
- architecture;
- schematic/PCB;
- FPGA RTL;
- Raspberry Pi image/deployment;
- Web UI;
- tests;
- measured latency;
- measured switching behavior;
- capture performance;
- system limitations;
- demo experiment;
- thesis diagrams;
- final tagged release.

Suggested tag:

```text
v1.0.0-thesis
```

---

# PHẦN IV — CHIẾN LƯỢC VERSION

## Application

```text
0.1.x architecture/scaffold
0.2.x Web foundation
0.3.x Circuit workspace
0.4.x Simulator
0.5.x Backend/Hardware Service
0.6.x W1
0.7.x EP4CE6
0.8.x EP4CE10/SDRAM
0.9.x physical integration
1.0.0 Thesis V1
```

Không bắt buộc exact version này nếu Git history hiện tại khác.

## Contract Versions

Version riêng:

```text
Circuit Schema
Web API
Hardware RPC
FPGA Protocol
FPGA Register Map
```

Không buộc trùng application version.

---

# PHẦN V — MASTER PROMPT GIAO CHO AI BUILD

Sao chép toàn bộ prompt dưới đây khi giao project cho AI.

---

## MASTER PROMPT — net*CIRCUIT Remote

Bạn là **Senior Full-Stack + Embedded Linux + FPGA System Architect** phụ trách tiếp tục phát triển repository:

```text
https://github.com/net-Circuit-Remote/net-Circuit-Remote
```

Tên dự án:

```text
net*CIRCUIT Remote
```

Mục tiêu dự án là xây dựng một **phòng thí nghiệm điện tử số từ xa**, trong đó người dùng thao tác circuit trên Web, chạy Simulation trước, sau đó cùng kiến trúc phần mềm có thể chạy trên IC logic thật thông qua Raspberry Pi 5 + FPGA + routing hardware.

---

### A. QUY TẮC BẮT BUỘC TRƯỚC KHI VIẾT CODE

Trước khi chỉnh sửa bất kỳ source code nào, hãy đọc đầy đủ:

```text
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/DEV_LOG.md
docs/CIRCUIT_SPEC.md
```

Sau đó đọc:

```text
README.md
contracts/
source code liên quan
tests liên quan
GitHub Actions workflow liên quan
```

Không được sửa code chỉ dựa trên prompt này mà chưa đọc context repository.

Nếu nội dung prompt này mâu thuẫn với `docs/CONTEXT.md`, hãy:

1. dừng việc thay đổi kiến trúc;
2. chỉ ra mâu thuẫn;
3. ưu tiên quyết định đã khóa trong `CONTEXT.md`;
4. không tự ý đổi architecture.

---

### B. CÁC QUYẾT ĐỊNH KIẾN TRÚC KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI

```text
Main Controller:
Raspberry Pi 5

OS:
Raspberry Pi OS 64-bit

Frontend:
Vue 3
TypeScript
Vite
Pinia
Three.js

Backend:
Python
FastAPI
Pydantic
SQLAlchemy
WebSocket

Hardware Backend:
Python
gRPC
Protobuf

Database V1:
SQLite

Deployment:
Nginx
systemd

Prototype FPGA:
EP4CE6E22C8N
No SDRAM
Experiment Controller only

Final FPGA V1:
EP4CE10E22C8N

External Memory:
64 MB SDR SDRAM
16-bit bus

V1 FPGA architecture:
Single FPGA

Breadboards:
>= 2

Development strategy:
Web-first
Simulation-first
FPGA later
```

Không được tự đổi sang:

- React;
- Next.js;
- Node.js backend;
- PostgreSQL;
- STM32 thay FPGA;
- FPGA khác;
- hai FPGA ngay trong V1;

trừ khi người dùng yêu cầu rõ ràng.

---

### C. KIẾN TRÚC BẮT BUỘC

Luồng hệ thống:

```text
Browser
   ↓
Nginx
   ↓
FastAPI Application Backend
   ↓
Hardware Service
   ↓
HardwareStation
    ├── VirtualHardwareStation
    └── PhysicalHardwareStation
```

Frontend tuyệt đối không được truy cập trực tiếp:

```text
FPGA register
SPI device
MUX address
crosspoint address
physical pin
```

Frontend chỉ gửi logical intent.

Ví dụ đúng:

```text
Connect SW1.OUT → U1.A
```

Không gửi:

```text
write 0x0024 = 0x17
```

---

### D. CIRCUIT GRAPH

Circuit Graph là contract trung tâm.

Mọi component phải có logical identity.

Mọi connection phải là logical connection.

Ví dụ:

```json
{
  "schema_version": "1.0",
  "modules": [
    {
      "id": "SW1",
      "type": "DIGITAL_SWITCH"
    },
    {
      "id": "U1",
      "type": "74HC08"
    }
  ],
  "connections": [
    {
      "source": "SW1.OUT",
      "destination": "U1.1"
    }
  ]
}
```

Không bypass Circuit Graph.

---

### E. BREADBOARD MODEL

Không được dùng pixel coordinate làm electrical identity.

Phải phân biệt:

```text
Visual Position
Physical Contact
Electrical Node
Logical Net
Routing Resource
FPGA Endpoint
```

Không được giả định:

```text
1 breadboard hole = 1 routing channel
```

---

### F. VIRTUAL HARDWARE TRƯỚC

Hiện tại ưu tiên:

```text
VirtualHardwareStation
```

Không triển khai FPGA hardware sớm nếu milestone W1 chưa hoàn thành.

PhysicalHardwareStation khi hardware chưa tồn tại phải:

```text
report unavailable
hoặc
return NOT_IMPLEMENTED
```

Không giả success.

---

### G. CODE QUALITY

Bắt buộc:

- module nhỏ;
- single responsibility;
- typed interfaces;
- structured errors;
- không duplicate logic;
- không hard-code resource count chưa được chứng minh;
- comments giải thích architectural constraints;
- source hardware-specific không được lọt vào frontend.

Python:

- type hints;
- Pydantic models;
- pytest.

TypeScript:

- strict mode;
- typed API;
- không dùng `any` bừa bãi.

Verilog:

- synthesizable RTL;
- reset rõ ràng;
- không unintended latch;
- không arbitrary gated clock;
- xử lý CDC;
- testbench trước hardware.

---

### H. TEST-DRIVEN DEVELOPMENT

Trước mỗi feature quan trọng:

```text
write failing test
    ↓
verify RED
    ↓
implement minimum change
    ↓
verify GREEN
    ↓
run regression tests
```

Không tuyên bố hoàn thành nếu chưa chạy test.

Nếu môi trường không cho phép verify:

```text
IMPLEMENTED — NOT VERIFIED
```

---

### I. KHÔNG REWRITE SOURCE KHÔNG CẦN THIẾT

Trước khi sửa:

1. đọc source hiện tại;
2. tìm code tương tự;
3. giữ conventions hiện có;
4. chỉ sửa đúng phạm vi;
5. không refactor cả project chỉ vì thích style khác.

---

### J. CI

Mọi thay đổi phải giữ GitHub Actions xanh.

Kiểm tra:

```text
Frontend
Backend
Hardware Service
Simulator
Integration
Docs
FPGA
```

Nếu CI fail:

1. đọc log;
2. tìm root cause;
3. sửa nguyên nhân;
4. không tắt test để CI xanh;
5. không thêm `continue-on-error` để che lỗi.

---

### K. DOCUMENTATION LIFECYCLE

Sau một development task đáng kể, cập nhật:

```text
docs/DEV_LOG.md
```

Nếu architecture thay đổi:

```text
docs/ARCHITECTURE.md
docs/CONTEXT.md
```

Nếu hardware/electrical/protocol thay đổi:

```text
docs/CIRCUIT_SPEC.md
contracts/
```

Nếu roadmap thay đổi:

```text
docs/ROADMAP.md
```

Nếu release-visible:

```text
docs/CHANGELOG.md
```

---

### L. AI HANDOFF

Cuối mỗi session phải ghi vào `docs/DEV_LOG.md`:

```text
What I changed
Files modified
Decisions made
Tests executed
Known failures
Next recommended task
Context required for next session
```

Mục tiêu là AI khác có thể tiếp quản mà không cần đọc lại toàn bộ lịch sử chat.

---

### M. QUY TẮC FPGA

Chưa bắt đầu FPGA physical nếu W1 chưa PASS.

Khi tới EP4CE6:

```text
EP4CE6 = Experiment Controller prototype
```

Scope:

```text
clock/reset
DEVICE_ID
FW_VERSION
PROTOCOL_VERSION
GPIO
safe-state
basic clock
routing control
communication
```

Không implement trên EP4CE6:

```text
64 MB SDRAM
Oscilloscope analog
full Generator/AWG
full capture system
```

Sau EP4CE6 mới migrate:

```text
EP4CE10E22C8N
+
64 MB SDR SDRAM
```

---

### N. QUY TẮC OSCILLOSCOPE/GENERATOR

Không được nhầm digital capture với analog oscilloscope.

Analog Oscilloscope cần:

```text
Input
→ Protection
→ AFE
→ ADC
→ FPGA
```

Analog/AWG Generator cần:

```text
FPGA
→ DAC
→ Filter
→ Output Stage
```

Không chọn ADC/DAC/SDRAM part number nếu chưa được người dùng duyệt hoặc chưa có datasheet.

---

### O. SAFE STATE

Hardware fault phải đi về:

```text
FAULT
↓
STOP CLOCK
↓
DISABLE GENERATOR
↓
SAFE ROUTING
↓
STOP CAPTURE
↓
ERROR STATUS
↓
LOG
↓
RELEASE/QUARANTINE STATION
```

Safety quan trọng hơn việc giữ experiment tiếp tục chạy.

---

### P. CÁCH LÀM VIỆC TRONG MỖI TASK

Khi tôi yêu cầu một task, hãy thực hiện theo trình tự:

#### 1. Analyze

Đọc source và giải thích ngắn:

```text
Current behavior
Relevant files
Root architecture
Dependencies
Potential risks
```

#### 2. Plan

Đề xuất thay đổi nhỏ nhất:

```text
Files to modify
Files to create
Contracts affected
Tests required
Docs affected
```

#### 3. Implement

Viết source hoàn chỉnh.

#### 4. Verify

Chạy:

```text
tests
build
lint/type-check nếu có
```

#### 5. Review

Kiểm tra:

```text
architecture drift
frontend/hardware boundary
security/safety
regression
```

#### 6. Handoff

Cập nhật `DEV_LOG.md`.

---

### Q. DEFINITION OF DONE

Một task chỉ được xem là DONE khi:

```text
implementation complete
+
relevant tests PASS
+
no known regression
+
affected docs updated
+
DEV_LOG updated
```

Nếu không đủ:

```text
IMPLEMENTED — NOT VERIFIED
```

---

# PHẦN VI — PROMPT DÙNG NGAY CHO PHASE HIỆN TẠI

Dùng Prompt này cho AI ở phiên phát triển tiếp theo.

---

## PROMPT PHASE 1 — WEB FOUNDATION

Hãy mở và phân tích repository:

```text
https://github.com/net-Circuit-Remote/net-Circuit-Remote
```

Trước khi chỉnh sửa source, bắt buộc đọc:

```text
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/DEV_LOG.md
README.md
```

Hiện repository đã có initial scaffold và CI hiện đã không còn lỗi.

Mục tiêu phiên này:

> **Thực hiện Phase 1 — Web Foundation.**

Không triển khai FPGA physical.

Không thay đổi architecture nền.

### Yêu cầu 1 — Cập nhật context hiện tại

Kiểm tra `docs/DEV_LOG.md`.

Nếu vẫn còn ghi frontend build đang blocking hoặc awaiting CI rerun trong khi CI hiện đã PASS, hãy cập nhật trạng thái chính xác.

Không xóa lịch sử; chỉ cập nhật current state.

---

### Yêu cầu 2 — Frontend application layout

Thiết kế layout desktop cho Laboratory:

```text
Top Bar

Left:
Component Library

Center:
Lab Workspace

Right:
Properties / Inspector

Bottom:
Logic Analyzer / Instrument / Console
```

Yêu cầu:

- professional;
- phong cách khoa học/điện tử;
- rõ ràng;
- ưu tiên usability;
- không chạy theo style website marketing hiện đại;
- không dùng quá nhiều gradient;
- không lạm dụng animation;
- responsive ở mức desktop/laptop;
- chuẩn bị cho Three.js workspace.

---

### Yêu cầu 3 — Navigation

Tạo routing/pages foundation cho:

```text
Laboratory
Circuits
Stations
Settings
```

Nếu router chưa được cài, hãy đánh giá và dùng Vue Router nếu phù hợp.

Không tạo page thừa.

---

### Yêu cầu 4 — Pinia State Boundaries

Tổ chức store:

```text
circuit
workspace
station
experiment
instrument
ui
```

Không nhồi tất cả state vào một store.

---

### Yêu cầu 5 — Typed API Layer

Refactor API layer thành:

```text
services/api/client.ts
services/api/circuits.ts
services/api/stations.ts
```

Tạo type rõ ràng.

Frontend không chứa hardware register/SPIDEV/MUX detail.

---

### Yêu cầu 6 — WebSocket Client

Tạo WebSocket client có:

```text
connect
disconnect
reconnect
connection status
message dispatch
error handling
```

Không over-engineer.

---

### Yêu cầu 7 — Station Capability

Tạo TypeScript model cho:

```text
station_id
status
mode
breadboards[]
experiment_controller
instruments
```

Ví dụ mode:

```text
simulation
hardware
```

Ví dụ status:

```text
available
busy
offline
fault
```

Không hard-code resource counts ngoài mock/default data cần thiết cho UI.

---

### Yêu cầu 8 — Testing

Phải bổ sung test cho:

```text
layout shell
station state
API types/service
frontend boundary
build
```

Chạy:

```text
npm run build
```

và các frontend tests hiện có.

Không được bỏ type-check.

---

### Yêu cầu 9 — Documentation

Sau khi hoàn tất:

Cập nhật:

```text
docs/ROADMAP.md
docs/DEV_LOG.md
docs/CHANGELOG.md
```

chỉ khi nội dung thực sự thay đổi.

---

### Yêu cầu 10 — Không làm trong Phase 1

Không làm:

```text
FPGA RTL
SPI driver
SDRAM
routing PCB
physical breadboard mapping
ADC
DAC
Oscilloscope hardware
Generator hardware
```

Không implement Three.js circuit editor hoàn chỉnh trong Phase 1.

Phase 1 chỉ xây foundation để Phase 2 làm workspace.

---

### Kết quả mong muốn

Sau task này:

```text
npm run build → PASS
frontend CI → PASS
```

Project có:

```text
stable app shell
navigation
state architecture
typed API layer
WebSocket foundation
station capability model
clean layout
```

Sau đó cập nhật:

```text
Phase 1 = COMPLETE
Next = Phase 2 Circuit Workspace
```

chỉ khi acceptance criteria thực sự đạt.

---

# PHẦN VII — TEMPLATE PROMPT CHO MỖI PHASE SAU

Dùng template sau:

```text
Hãy đọc repository net-Circuit-Remote/net-Circuit-Remote.

Bắt buộc đọc:
- docs/CONTEXT.md
- docs/ARCHITECTURE.md
- docs/ROADMAP.md
- docs/DEV_LOG.md
- docs/CIRCUIT_SPEC.md nếu task liên quan hardware
- contracts liên quan

Task hiện tại:
[PHASE / FEATURE]

Mục tiêu:
[MÔ TẢ]

Trước khi viết code:
1. Phân tích source hiện tại.
2. Chỉ ra files liên quan.
3. Chỉ ra dependencies.
4. Kiểm tra architecture boundary.
5. Đưa plan thay đổi tối thiểu.

Sau đó:
1. Viết failing test.
2. Chạy test để xác nhận RED.
3. Implement.
4. Chạy test GREEN.
5. Chạy regression/build.
6. Không che lỗi CI.
7. Không thay architecture đã khóa.
8. Cập nhật DEV_LOG.
9. Cập nhật ROADMAP/CHANGELOG nếu cần.

Không được:
- rewrite toàn project không cần thiết;
- tự đổi stack;
- tự đổi FPGA;
- tự bịa part number;
- tự bịa pinout;
- tự bịa timing;
- để frontend truy cập FPGA trực tiếp;
- tuyên bố PASS nếu chưa verify.

Cuối cùng báo:
- Files changed
- Features implemented
- Tests run
- Build result
- Known issues
- Architecture changes (nếu có)
- Next recommended task
```

---

# PHẦN VIII — CÁC CHECKPOINT QUAN TRỌNG

## Checkpoint A — Web Foundation

```text
Phase 1 complete
```

## Checkpoint B — Virtual Lab

```text
Phase 2 + Phase 3 complete
```

## Checkpoint C — Software Platform

```text
Phase 4 + Phase 5 + Phase 6 complete
```

## Checkpoint D — Raspberry Pi

```text
Phase 7 complete
```

## Checkpoint W1

```text
Web Platform Ready for FPGA
```

Không đi qua checkpoint này nếu Virtual E2E chưa PASS.

## Checkpoint F1

```text
EP4CE6 Experiment Controller validated
```

## Checkpoint F2

```text
Pi ↔ FPGA protocol validated
```

## Checkpoint H1

```text
Routing hardware validated
```

## Checkpoint F3

```text
EP4CE10 + SDRAM validated
```

## Checkpoint I1

```text
Instrument subsystem validated
```

## Checkpoint V1

```text
Full thesis system validated
```

---

# PHẦN IX — ƯU TIÊN THỰC TẾ

Nếu thời gian luận văn bị giới hạn, ưu tiên theo thứ tự:

```text
1. Stable Web UI
2. Circuit Graph
3. Simulator
4. Backend
5. Hardware Service
6. Virtual E2E
7. Raspberry Pi deployment
8. EP4CE6 Experiment Controller
9. Physical routing for basic digital IC experiment
10. EP4CE10 migration
11. Logic Analyzer
12. SDRAM
13. 2 breadboards
14. Generator
15. Oscilloscope analog
16. advanced multi-user
```

Generator/Oscilloscope analog là phần phức tạp và có thể tách thành phạm vi mở rộng nếu thời gian thesis không đủ, nhưng kiến trúc phần mềm vẫn phải chuẩn bị cho chúng.

---

# PHẦN X — NGUYÊN TẮC CUỐI CÙNG

Mục tiêu của dự án không phải viết thật nhiều source code.

Mục tiêu là tạo một kiến trúc mà:

```text
Simulation
    ↓
same logical experiment
    ↓
Physical Hardware
```

và:

```text
Frontend
    ↓
stable contracts
    ↓
Backend
    ↓
Hardware Service
    ↓
FPGA / routing / IC
```

có thể thay đổi phần implementation mà không phá toàn hệ thống.

Mọi quyết định phải ưu tiên:

```text
Correctness
Safety
Testability
Maintainability
Extensibility
Thesis feasibility
```

trước việc thêm tính năng nhanh.

---

**END OF MASTER DEVELOPMENT ROADMAP & AI PROMPT**

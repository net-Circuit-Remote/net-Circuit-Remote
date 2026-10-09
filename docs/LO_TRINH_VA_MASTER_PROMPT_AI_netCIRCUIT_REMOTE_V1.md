# LỘ TRÌNH PHÁT TRIỂN & MASTER PROMPT AI — net*CIRCUIT Remote V1

**Ngày cập nhật kiến trúc UI:** 2026-10-09  
**UI architecture:** Single Workspace  
**Repository:** `net-Circuit-Remote/net-Circuit-Remote`

**Trạng thái thực thi Phase 1 — 2026-10-09:** Single Workspace shell đã được triển khai; acceptance và bằng chứng hiện tại nằm trong `docs/DEV_LOG.md`. Các phần bên dưới mô tả mục tiêu của từng phase, không phải tất cả đã hoạt động. Task frontend tiếp theo là Phase 2: đặt linh kiện theo metadata, picking và chỉnh Circuit Graph. File bar hiện dùng JSON cục bộ; tool editing, Run/Step và thiết bị đo cần contract/model của các phase tiếp theo. Không dựng lại navigation nhiều trang.

---

# 1. MỤC TIÊU DỰ ÁN

`net*CIRCUIT Remote` là nền tảng phòng thí nghiệm điện tử số từ xa.

Người dùng không làm việc theo kiểu website nhiều trang. Người dùng mở một **bàn thí nghiệm điện tử ảo duy nhất**, kéo thả board/breadboard/linh kiện, nối dây, chạy Simulation, mở Oscilloscope/Generator/Signal Monitor ngay trên workspace và sau này dùng chính Circuit Graph đó để điều khiển thí nghiệm IC logic thật.

Kiến trúc tổng:

```text
Single Workspace Browser UI
        ↓
Circuit Graph + logical commands
        ↓
FastAPI Application Backend
        ↓
Hardware Service
        ↓
HardwareStation
     /             \
Virtual          Physical
Simulator        FPGA + routing
```

---

# 2. QUYẾT ĐỊNH NỀN KHÔNG ĐƯỢC TỰ Ý ĐỔI

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
16-bit

FPGA V1:
Single FPGA

Breadboard:
>= 2

Strategy:
Web-first
Simulation-first
FPGA after W1
```

---

# 3. QUYẾT ĐỊNH UI MỚI ĐÃ KHÓA

Thiết kế UI nhiều trang cũ:

```text
Dashboard
Laboratory
Circuits
Stations
Experiments
Settings
```

đã **BỊ SUPERSEDED**.

Không tiếp tục phát triển theo mô hình đó.

UI chính thức:

```text
Single Workspace
```

Khi vào `/`, hiển thị trực tiếp bàn thí nghiệm.

---

# 4. SINGLE WORKSPACE — BỐ CỤC CHUẨN

```text
┌────────────────────────────────────────────────────────────────────┐
│ net*CIRCUIT Remote | New | Open | Save | Undo | Redo             │
├────────────────────────────────────────────────────────────────────┤
│ COMPONENT RIBBON                                                   │
│ Structure | Passive | Active | Output | Input | Logic ICs |       │
│ Arithmetic ICs | Memory | Display | Instruments | Notation        │
├────────┬─────────────────────────────────────────────────┬─────────┤
│ TOOL   │                                                 │ VIEW /  │
│ RAIL   │              THREE.JS WORKSPACE                 │ OVERLAY │
│        │                                                 │         │
│ Select │       board / breadboard / IC / wires           │         │
│ Wire   │                                                 │         │
│ Move   │                                                 │         │
│ Rotate │                                                 │         │
│ Delete │                                                 │         │
│ Scope  │                                                 │         │
│ Probe  │                                                 │         │
├────────┴─────────────────────────────────────────────────┴─────────┤
│ ▶ Simulation | Mode | Frequency | Step | Components | Wires       │
└────────────────────────────────────────────────────────────────────┘
```

---

# 5. CẢM HỨNG GIAO DIỆN

Giao diện và workflow tham khảo 5 ảnh người dùng đã cung cấp.

Mục tiêu gần với trải nghiệm của phần mềm CRUMB ở:

- một workspace duy nhất;
- palette/ribbon linh kiện;
- 3D breadboard;
- kéo/thả;
- wire trực tiếp;
- công cụ Select/Move/Rotate/Delete;
- Oscilloscope nổi;
- Function Generator nổi;
- Signal Monitor nổi;
- xem thông tin IC;
- memory Hex Editor;
- run/stop Simulation;
- status bar.

Không sao chép:

- source;
- branding;
- logo;
- icon độc quyền;
- asset proprietary;
- pixel-perfect layout.

---

# 6. PHÂN TÍCH SOURCE HIỆN TẠI

Source trong Project hiện vẫn là UI cũ.

Các điểm chính:

```text
App.vue
 -> RouterLink
 -> RouterView
 -> main navigation

router/index.ts
 -> /
 -> /laboratory
 -> /circuits
 -> /stations
 -> /experiments
 -> /settings

LaboratoryPage.vue
 -> ComponentLibrary
 -> LabWorkspace
 -> PropertiesInspector
 -> InstrumentDock
```

Cần migrate, không rewrite toàn bộ backend/frontend infrastructure.

Nên tái sử dụng:

```text
Pinia stores
typed API services
WebSocket client
Circuit Graph types
station/experiment types
frontend tests
```

---

# 7. LỘ TRÌNH PHÁT TRIỂN

## PHASE 0 — Architecture

Đã chốt:

- monorepo;
- Hardware Station;
- Circuit Graph;
- Web-first;
- EP4CE6 -> EP4CE10;
- Single Workspace.

---

## PHASE 1 — Single Workspace Shell Migration

Đây là phase frontend hiện tại.

### 1.1 App Shell

Thay App.vue bằng shell chỉ chứa workbench.

Không còn visible page navigation.

### 1.2 Router

Target:

```text
/ -> SingleWorkspace
```

Có thể giữ Vue Router tạm để redirect legacy URL.

Không để router quyết định workflow lab.

### 1.3 App/File Bar

```text
New
Open
Save
Undo
Redo
```

### 1.4 Component Ribbon

```text
Structure
Passive
Active
Output
Input
Logic ICs
Arithmetic ICs
Memory
Display
Embedded/Controller
Instruments
Notation
```

### 1.5 Tool Rail

```text
Select
Wire
Move
Rotate
Delete
Scope
Probe
```

### 1.6 Workspace Shell

Workspace chiếm vùng lớn nhất.

Chuẩn bị Three.js lifecycle.

### 1.7 Status Bar

```text
Run/Stop
Simulation state
Mode
Frequency
Step
Component count
Wire count
Connection/Fault
```

### 1.8 Floating Window Manager

Chung cho:

```text
Oscilloscope
Function Generator
Signal Monitor
Component Info
Inspector
Hex Editor
```

### Acceptance Phase 1

```text
/ mở workbench
không visible multi-page nav
ribbon có
tool rail có
workspace chính có
status bar có
floating windows shell có
npm test PASS
npm run build PASS
browser verification PASS
```

---

## PHASE 2 — Interactive Circuit Workspace

### 2.1 Scene

Three.js:

```text
Scene
Camera
Lights
Grid/work surface
Picking
Render loop
Resize lifecycle
```

### 2.2 Structure

Kéo thả:

```text
breadboard
board
power supply visual
```

Power supply visual trong scene không đồng nghĩa nguồn điện vật lý đã tồn tại.

### 2.3 Passive

```text
resistor
capacitor
```

### 2.4 Input

```text
push button
toggle switch
DIP switch
clock
```

### 2.5 Output

```text
LED
7-segment
probe
display
```

### 2.6 Logic IC

Metadata-driven.

### 2.7 Arithmetic

Chuẩn bị abstraction cho:

```text
Adder
Multiplier
```

Không hard-code part number nếu device-library chưa xác nhận.

### 2.8 Memory

Memory component có contract riêng.

### 2.9 Interaction

```text
place
select
move
rotate
delete
wire
unwire
zoom
pan/orbit
snap
undo
redo
```

### 2.10 Circuit Graph

Mọi thao tác vật lý ảo cập nhật logical graph đúng cách.

Visual geometry không phải electrical truth.

---

## PHASE 3 — Simulator

### Combinational

```text
AND
OR
NOT
NAND
NOR
XOR
```

### Sequential

```text
DFF
JK
T
counter
shift register
```

### Virtual Clock

### LED/Display State

### Virtual Logic Analyzer

### Simulated Oscilloscope Window

### Simulated Function Generator Window

### Memory Model / Hex Editor

Mục tiêu là 5 loại scene reference có thể được mô phỏng theo từng bước mà chưa cần hardware.

---

## PHASE 4 — Backend

- save/open projects;
- validation;
- persistence;
- experiment lifecycle;
- session;
- station capability.

Single Workspace gọi backend qua API, không qua page riêng.

---

## PHASE 5 — Hardware Service

Implement gRPC.

Same UI works with:

```text
VirtualHardwareStation
PhysicalHardwareStation
```

---

## PHASE 6 — Virtual End-to-End

Flow:

```text
Workspace
↓
Circuit Graph
↓
FastAPI
↓
Hardware Service
↓
Virtual Station
↓
Simulator
↓
Waveform
↓
Floating Scope/Monitor
```

---

## PHASE 7 — Raspberry Pi

Deploy Single Workspace qua Nginx.

Systemd:

```text
netcircuit-api
netcircuit-hardware
```

---

# 8. MILESTONE W1

Không làm FPGA trước khi đạt:

```text
Single Workspace
Component ribbon
Tool rail
Interactive workspace
Circuit Graph
Save/load
Simulator
Clock
Logic Analyzer
Waveform
Floating instruments
FastAPI
WebSocket
Hardware Service
Virtual E2E
Resource lock
Fault handling
Pi deployment
Tests
```

---

# 9. FPGA PHASES

## Phase 8 — EP4CE6 Experiment Controller

Chỉ:

```text
Clock/reset
DEVICE_ID
FW_VERSION
PROTOCOL_VERSION
GPIO
Safe State
Basic routing
Experiment clock
Communication
```

Không SDRAM/Oscilloscope/AWG.

## Phase 9 — Pi ↔ FPGA

SPI baseline.

## Phase 10 — Routing Hardware

Không dùng:

```text
breadboard holes = routing channels
```

## Phase 11 — EP4CE10

Migrate portable RTL.

## Phase 12 — SDRAM 64 MB

Chỉ sau khi chốt part number/datasheet.

## Phase 13 — Logic Analyzer

Feed floating Signal Monitor/Logic Analyzer.

## Phase 14 — Generator

Digital first.

Analog/AWG:

```text
FPGA -> DAC -> filter -> output
```

## Phase 15 — Oscilloscope

Analog:

```text
input -> protection -> AFE -> ADC -> FPGA
```

## Phase 16 — 2+ breadboard

Data-driven node mapping.

## Phase 17 — Multi-user

Sessions / Queue / Ownership / Station Lock.

## Phase 18 — Thesis V1

Measured/reproducible release.

---

# 10. MASTER PROMPT CHO AI

Sao chép phần dưới khi giao AI tiếp tục build.

---

## MASTER PROMPT

Bạn là **Senior Full-Stack + Vue/Three.js + Digital Circuit Simulator + Embedded Linux + FPGA System Architect** phụ trách dự án:

```text
net*CIRCUIT Remote
```

Repository:

```text
https://github.com/net-Circuit-Remote/net-Circuit-Remote
```

### Trước khi sửa code

Bắt buộc đọc:

```text
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/DEV_LOG.md
docs/superpowers/specs/2026-10-09-single-workspace-ui-design.md
docs/PROMPT_SINGLE_WORKSPACE_UI_AI.md
apps/web/README.md
```

Sau đó đọc source/tests liên quan.

### Quy tắc UI cao nhất

Đây không còn là website nhiều trang.

Không phát triển thêm:

```text
Dashboard
Circuits
Stations
Experiments
Settings
```

Người dùng làm việc trong **một Single Workspace duy nhất**.

Khi vào:

```text
/
```

phải thấy bàn thí nghiệm.

### Giao diện mục tiêu

```text
App/File Bar
↓
Component Ribbon
↓
Left Tool Rail + Three.js Workspace + contextual overlays
↓
Bottom Simulation Status Bar

Floating:
Oscilloscope
Generator
Signal Monitor
IC Info
Inspector
Hex Editor
```

### Reference

Nếu có 5 ảnh `interface_1.png` -> `interface_5.png`, hãy dùng vision phân tích trước khi code.

Dùng chúng để học:

- bố cục;
- density;
- workflow;
- cách floating instruments không che mất toàn bộ workspace.

Không clone proprietary UI pixel-for-pixel.

### CRUMB

Mục tiêu workflow gần CRUMB:

```text
choose component
drag to board
wire
run
inspect signal
open instruments in-place
```

Nhưng code/assets/branding phải là của net*CIRCUIT Remote.

### Migration

Phân tích source hiện tại trước.

Ưu tiên reuse:

```text
stores
typed API
WebSocket
types
Circuit Graph
tests
```

Không rewrite transport đang hoạt động nếu không cần.

### Source target

Khuyến nghị:

```text
components/workbench/
  AppTitleBar.vue
  ComponentRibbon.vue
  ToolRail.vue
  CircuitWorkspace3D.vue
  ViewportControls.vue
  SimulationStatusBar.vue

components/windows/
  FloatingWindow.vue
  FloatingWindowManager.vue
  OscilloscopeWindow.vue
  FunctionGeneratorWindow.vue
  SignalMonitorWindow.vue
  ComponentInfoWindow.vue
  InspectorWindow.vue
  HexEditorWindow.vue
```

Tên có thể điều chỉnh theo conventions.

### Router

Mục tiêu:

```text
/ -> Single Workspace
```

Legacy route có thể redirect `/` trong migration.

Không còn main navigation.

### Component Ribbon

Metadata-driven:

```text
Structure
Passive
Active
Output
Input
Logic ICs
Arithmetic ICs
Memory
Display
Embedded/Controller
Instruments
Notation
```

### Interaction

```text
Select
Wire
Move
Rotate
Delete
Scope
Probe
```

### Three.js

Không để toàn logic scene trong Vue component.

Tách scene manager/renderers/controllers.

Không lưu raw Three.js object trong Circuit Graph.

### Electrical model

```text
Visual Position
!= Physical Contact
!= Electrical Node
!= Logical Net
!= Routing Resource
!= FPGA GPIO
```

### Floating Windows

Một framework chung.

Không copy drag logic vào từng tool.

### Oscilloscope/Generator

Simulation-first.

Không tuyên bố physical analog hoạt động khi ADC/DAC chưa có.

### Backend boundary

Frontend không được biết:

```text
FPGA register
SPI path
MUX address
physical pin
switching sequence
```

### Test

TDD:

```text
RED -> GREEN -> regression
```

Chạy ít nhất:

```bash
cd apps/web
npm test
npm run build

cd ../..
python -m pytest -q tests/frontend
```

### Browser checks

Kiểm tra desktop:

```text
1920x1080
1440x900
1366x768
1280x720
```

### Documentation

Cuối task cập nhật:

```text
docs/ROADMAP.md
docs/DEV_LOG.md
docs/CHANGELOG.md
apps/web/README.md
```

### Done

Không nói DONE nếu chưa có bằng chứng:

```text
tests PASS
build PASS
browser check PASS
docs updated
```

Nếu chưa:

```text
IMPLEMENTED — NOT VERIFIED
```

---

# 11. PROMPT NGAY CHO TASK TIẾP THEO

Dùng file sau làm nguyên tắc kiến trúc và lịch sử yêu cầu shell; Phase 1 đã được kiểm chứng trong DEV_LOG:

```text
docs/PROMPT_SINGLE_WORKSPACE_UI_AI.md
```

Task tiếp theo là:

> **Phase 2: đặt một module theo metadata canonical vào Single Workspace, render hình học riêng với logical graph, triển khai picking/select và đưa mọi thay đổi Circuit Graph qua undo/redo. Giữ nguyên shell, typed API/WebSocket và boundary hardware.**

Không làm FPGA.

Không làm full simulator trong cùng một commit lớn.

Phát triển từng slice editor trên shell đã có, với test và browser evidence; không migrate lại shell.

---

# 12. NGUYÊN TẮC CUỐI

Frontend mới phải giữ người dùng trong “bàn thí nghiệm”:

```text
Place
Wire
Run
Measure
Inspect
Edit
```

mà không bắt người dùng chuyển trang.

Đây là UX principle cao nhất của net*CIRCUIT Remote từ 2026-10-09.

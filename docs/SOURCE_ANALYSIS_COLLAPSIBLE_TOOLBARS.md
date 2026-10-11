# Phân tích source và thuật toán panel — 2026-10-11

Phiên bản hiện hành: thu gọn hoàn toàn và thay đổi kích thước. Báo cáo `verification/2026-10-11-collapsible-toolbars-browser.md` là bằng chứng lịch sử của phiên bản còn strip 36 px/rail 38 px. Bằng chứng hiện hành: `verification/2026-10-11-resizable-panels-browser.md`.

## Kiến trúc liên quan trong toàn project

Đối chiếu kiến trúc toàn project và các báo cáo source hiện hành, sau đó đọc sâu luồng shell → toolbar → store → editor/scene/window. Thay đổi này thuộc bố cục frontend; không yêu cầu thay thuật toán điện, contracts hay hardware. `SOURCE_ANALYSIS_STABILITY_AUDIT.md` và `SOURCE_ANALYSIS_ZOOM_TO_AREA.md` ghi các thuật toán graph, tài nguyên và camera đã được phân tích trong các lượt trước.

| Khối | Trách nhiệm và ranh giới |
| --- | --- |
| App/router/SingleWorkspaceShell | Một workbench tại `/`; title/status ngoài vùng flex workbench. Observer đo vùng khả dụng để tính giới hạn responsive, độc lập kích thước canvas. |
| ComponentRibbon + ribbon metadata | Mười hai nhóm; click mở palette được neo theo DOM, chọn/drag linh kiện gọi workspace hoặc mở instrument. Resize/scroll tính lại vị trí palette. |
| ToolRail + workspace store | Bảy chế độ dùng chung; Scope/Probe còn mở cửa sổ. Tool, selection, placement, pending port, snap và zoom tách khỏi trạng thái bố cục. |
| Circuit store/files | Graph, command, lịch sử Undo/Redo và fingerprint saved/validation. Thu gọn giao diện không được tạo command hoặc làm dirty mạch. |
| SceneManager + model factories + WireLayer | Graph được chiếu thành model/dây; camera/renderer, picking, gizmo và tài nguyên thuộc scene. Hình học không tự tạo node điện. |
| useCircuitEditor | Preview/capture tạm; release ghi command, cancel khôi phục hình học hiện hành. Tọa độ pointer phụ thuộc viewport nên resize phải hủy gesture đang chạy. |
| UI store + FloatingWindow | Hai cờ thu gọn, kích thước mở rộng ưu tiên, workbench size, palette và cửa sổ. Focus opener ẩn trả về toggle qua wrapper. |
| usePanelResize | Thuật toán chung hai trục: capture, clamp, keyboard, commit/cancel và teardown; không thêm listener global. |
| FastAPI/WebSocket/Hardware Service/simulator/FPGA | Nhận graph/contract hợp lệ qua các ranh giới đã định nghĩa; bố cục toolbar không phát lệnh hardware hoặc sửa schema. Engine timing/capture và FPGA thực còn thuộc Phase 3+. |

## Thiết kế và chuyển trạng thái

Hai cờ boolean nằm trong `ui`: `componentToolbarCollapsed`, `toolsSidebarCollapsed`. Ban đầu cả hai false. Không serialize vào circuit JSON hoặc local storage; reload khôi phục bố cục mở rộng. Bốn tổ hợp bố cục đều hợp lệ và không phụ thuộc nhau.

`toggleComponentToolbar()` đảo cờ và đặt `activeRibbonGroup = null`. `toggleRibbon()` không mở nhóm khi ribbon thu gọn; computed palette cũng chặn trạng thái thu gọn. Vì vậy palette không còn phủ canvas khi ribbon bị ẩn, và mở lại không tự khôi phục palette cũ. `toggleToolsSidebar()` chỉ đảo cờ của rail, không chọn lại tool và không đóng instrument.

Nút mũi tên nằm ngoài toàn bộ section/aside bị ẩn. Components đóng dùng nút floating cạnh trên canvas; Tools dùng nút floating cạnh trái canvas. `aria-expanded` biểu diễn phần nội dung đang hiện; `aria-controls` trỏ đến toàn bộ `component-toolbar`/`tools-sidebar`. `title` và nhãn chính xác Collapse Components, Expand Components, Collapse Tools, Expand Tools. Nút HTML tự hỗ trợ Enter/Space.

## DOM, bố cục và tính liên tục

`v-show` ẩn toàn bộ section/aside bằng `display: none`: header, nền, border, nhãn và icon biến mất khỏi layout/focus/accessibility, nhưng vẫn giữ DOM/scroll/opener. Palette dùng `v-if` vì đã đóng. Không tạo lại scene, renderer, canvas hay model.

Wrapper Components đóng có height0; wrapper Tools đóng có width0/min-width0/flex-shrink0. Wrapper không có padding/border/background. Stage có flex1/min-height0, tự nhận toàn bộ diện tích giải phóng. Shell bỏ min-height560; media query giữ width mặc định66/54 ở wrapper, không áp width cạnh tranh lên aside. Ribbon giữ icon và dành margin phải36 px cho toggle. Context Components20 nằm trên Tools10 để popup Structure không bị sidebar rộng che. Animation height/width160 ms tắt khi kéo hoặc reduced motion.

Rail giữ min-height0/overflow-y:auto cho danh sách và flex-shrink0 cho button: tool list cuộn trong phần còn lại trên màn hình thấp. Toggle nằm ngoài nội dung/scroller.

## Kích thước và thuật toán resize

`componentToolbarHeight`/`toolsSidebarWidth` khởi tạo null; mount đo giao diện hiện có một lần. Setter bỏ qua non-finite và clamp96–260 px /54–180 px. Đóng panel chỉ đảo cờ, không ghi đè preference. Workbench W×H là vùng giữa title/status, độc lập canvas:

```text
maxHeight = max(96, min(260, H - 180))
maxWidth  = max(54, min(180, W - 200))
rendered  = collapsed ? 0 : min(preferred, responsiveMax)
```

Responsive clamp chỉ sửa kích thước render; width ưu tiên150 trở thành120 tại viewport320 rồi tự trở về150 khi có chỗ. Không tạo feedback loop giữa canvas và giới hạn panel. Viewport cực nhỏ hơn min vẫn ưu tiên khả năng dùng panel; nhỏ nhất được browser kiểm chứng là320×480.

Pointerdown nhận primary/nút trái trên separator mở, tọa độ hữu hạn; lưu ID, tọa độ đầu, preference gốc và baseline đã clamp. Focus/capture separator, chặn event vào canvas. Pointermove đúng ID áp dụng `clamp(baseline + coordinate - start)`. Pointerup dùng tọa độ cuối, giữ preference mới và xóa gesture trước release để lostcapture bình thường không rollback.

Escape, pointercancel đúng ID, capture mất, move không còn button, collapse hoặc scope dispose khôi phục preference gốc và release capture. Pointer khác không tác động. Cancel ở màn hình hẹp khôi phục raw preference. Arrow theo trục tăng/giảm8 px, Shift20 px; Home/End đến min/max. Handler yêu cầu currentTarget role=separator nên toggle không thể resize. Không thêm global listener/timer.

## Resize và thuật toán camera/cửa sổ

```text
toggle → Vue cập nhật display/width → flex tính lại stage
       → ResizeObserver của CircuitWorkspace3D
       → editor.cancel() → manager.resize(width,height)
       → ui.setViewport(width,height) → clamp các cửa sổ
```

Camera giữ position/quaternion/FOV và magnification; chỉ set renderer size, cập nhật aspect/projection và yêu cầu redraw. Không fit/reset camera khi resize. Model matrix/graph pose/endpoint không đổi. Gizmo obstacle scan thêm các floating toggle ở workbench cha. Cửa sổ giữ bounds hiện có: kích thước ưu tiên từ `windowDefinitions`, tọa độ clamp vào `[0, viewportSize - windowSize]`.

Resize hủy preview/capture và Zoom To Area đang bật, vì gốc/tỷ lệ tọa độ vùng đã thay đổi. Chế độ editing, model selection, loại linh kiện chuẩn bị đặt và pending logical port vẫn tồn tại; hủy gesture không commit thêm Undo. Hai action thu gọn chỉ sửa UI; không import circuit/workspace hay gọi API.

Chi phí đảo cờ O(1); resize cửa sổ O(W) theo số cửa sổ hiện có. Layout/render của trình duyệt và scene dùng đường xử lý sẵn có, không quét hoặc clone circuit graph. Không thêm tài nguyên WebGL, timer hoặc subscription bên ngoài lifecycle của component.

## Focus và lifecycle

Nếu nội dung/separator sắp ẩn đang giữ focus, watcher chuyển về toggle sau `nextTick`. Click/Enter/Space giữ focus ở nút. Instrument Escape kiểm tra opener hiển thị; nếu ẩn, tìm toggle qua outer `.component-panel`/`.tools-panel`. `v-show` giữ opener liên kết DOM, nên `isConnected` đơn thuần chưa đủ.

Palette vẫn neo lại khi resize/scroll và vẫn đóng qua outside/Escape như trước. Listener/ResizeObserver hiện có được teardown trong component; watcher của Vue tự dừng khi unmount.

## Kiểm chứng

Giữ hai test collapse bằng store thật; thêm hai sizing test, năm composable pointer/keyboard test và một SceneManager camera/model/connection resize test. Sizing FAIL trước API; foreign-pointer cancel FAIL trước ownership guard. Final frontend171/171 và production build PASS (134 modules, advisory bundle lớn hiện có). Native browser kiểm chứng zero height/width, kéo min/max, nhớ kích thước, Enter/Space, focus Scope, responsive320×480 đến1920×1080, popup trên rail và mạch2 component/1 wire/110% zoom giữ nguyên.

Kết quả thực sự chạy, ảnh, danh sách file và giới hạn kiểm chứng nằm trong `verification/2026-10-11-resizable-panels-browser.md` và DEV_LOG. Không thay API/schema/metadata/artwork hoặc thêm dependency. Full backend/hardware suites không chạy lại cho feature UI này; không claim execution/capture chưa triển khai và không commit/push/deploy.

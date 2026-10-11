# Phân tích source và thuật toán thu gọn toolbar — 2026-10-11

## Kiến trúc liên quan trong toàn project

Đối chiếu kiến trúc toàn project và các báo cáo source hiện hành, sau đó đọc sâu luồng shell → toolbar → store → editor/scene/window. Thay đổi này thuộc bố cục frontend; không yêu cầu thay thuật toán điện, contracts hay hardware. `SOURCE_ANALYSIS_STABILITY_AUDIT.md` và `SOURCE_ANALYSIS_ZOOM_TO_AREA.md` ghi các thuật toán graph, tài nguyên và camera đã được phân tích trong các lượt trước.

| Khối | Trách nhiệm và ranh giới |
| --- | --- |
| App/router/SingleWorkspaceShell | Một workbench tại `/`, chia title bar, ribbon, rail, stage và status bar bằng flex. Canvas/window manager cùng nằm trong stage. |
| ComponentRibbon + ribbon metadata | Mười hai nhóm; click mở palette được neo theo DOM, chọn/drag linh kiện gọi workspace hoặc mở instrument. Resize/scroll tính lại vị trí palette. |
| ToolRail + workspace store | Bảy chế độ dùng chung; Scope/Probe còn mở cửa sổ. Tool, selection, placement, pending port, snap và zoom tách khỏi trạng thái bố cục. |
| Circuit store/files | Graph, command, lịch sử Undo/Redo và fingerprint saved/validation. Thu gọn giao diện không được tạo command hoặc làm dirty mạch. |
| SceneManager + model factories + WireLayer | Graph được chiếu thành model/dây; camera/renderer, picking, gizmo và tài nguyên thuộc scene. Hình học không tự tạo node điện. |
| useCircuitEditor | Preview/capture tạm; release ghi command, cancel khôi phục hình học hiện hành. Tọa độ pointer phụ thuộc viewport nên resize phải hủy gesture đang chạy. |
| UI store + FloatingWindow | Palette, thứ tự/focus và tọa độ cửa sổ; bounds theo stage. Đây là nơi phù hợp cho hai cờ thu gọn. |
| FastAPI/WebSocket/Hardware Service/simulator/FPGA | Nhận graph/contract hợp lệ qua các ranh giới đã định nghĩa; bố cục toolbar không phát lệnh hardware hoặc sửa schema. Engine timing/capture và FPGA thực còn thuộc Phase 3+. |

## Thiết kế và chuyển trạng thái

Hai cờ boolean nằm trong `ui`: `componentToolbarCollapsed`, `toolsSidebarCollapsed`. Ban đầu cả hai false. Không serialize vào circuit JSON hoặc local storage; reload khôi phục bố cục mở rộng. Bốn tổ hợp bố cục đều hợp lệ và không phụ thuộc nhau.

`toggleComponentToolbar()` đảo cờ và đặt `activeRibbonGroup = null`. `toggleRibbon()` không mở nhóm khi ribbon thu gọn; computed palette cũng chặn trạng thái thu gọn. Vì vậy palette không còn phủ canvas khi ribbon bị ẩn, và mở lại không tự khôi phục palette cũ. `toggleToolsSidebar()` chỉ đảo cờ của rail, không chọn lại tool và không đóng instrument.

Nút mũi tên nằm ngoài nội dung thu gọn. Ribbon dùng mũi tên lên khi mở, xuống khi đóng; rail dùng trái khi mở, phải khi đóng. `aria-expanded` biểu diễn phần nội dung đang hiện; `aria-controls` trỏ đến ID cố định `component-families` hoặc `editing-tools`. `title` và nhãn truy cập thay đổi giữa Collapse/Expand. Nút HTML tự hỗ trợ Enter/Space.

## DOM, bố cục và tính liên tục

`v-show` ẩn danh sách bằng `display: none`: nút linh kiện/công cụ vẫn giữ DOM và scroll, nhưng không chiếm kích thước, không tham gia Tab hoặc accessibility tree khi ẩn. Palette dùng `v-if` vì trạng thái lựa chọn đã đóng. Không tạo lại scene, renderer, canvas hay model.

Ribbon mở rộng giữ hàng icon hiện có và dành chỗ riêng cho nút. Khi đóng, chỉ còn hàng Components/nút cao khoảng 36 px. Rail desktop giảm 66 → 38 px, rail hẹp giảm 54 → 38 px. Stage có `flex: 1`, nên tự nhận diện tích giải phóng. Không dùng transform để giả thu gọn, không cần listener global hay animation resize.

Ở viewport 698×560, thêm nút cố định làm nút Probe vượt cạnh dưới rail nếu danh sách không được co lại. Browser tái hiện Probe bottom531 > rail bottom492. Sửa bằng `min-height: 0`, `overflow-y: auto` cho danh sách và `flex-shrink: 0` cho nút; danh sách cuộn trong phần còn lại, toggle luôn ở đầu. Sau sửa, click Probe tự cuộn đến bottom461, bên trong rail; cửa sổ Monitor cũng được clamp đúng stage334 px.

## Resize và thuật toán camera/cửa sổ

```text
toggle → Vue cập nhật display/width → flex tính lại stage
       → ResizeObserver của CircuitWorkspace3D
       → editor.cancel() → manager.resize(width,height)
       → ui.setViewport(width,height) → clamp các cửa sổ
```

Camera giữ pose/FOV, cập nhật aspect và projection theo renderer. Các model không bị scale; graph pose và endpoint không đổi. Cửa sổ có kích thước ưu tiên từ `windowDefinitions`, giới hạn bởi stage; tọa độ x/y clamp vào đoạn `[0, viewportSize - windowSize]`. Mở rộng stage có thể khôi phục kích thước cửa sổ ưu tiên, nhưng không tự trả lại tọa độ trước khi clamp.

Resize hủy preview/capture và Zoom To Area đang bật, vì gốc/tỷ lệ tọa độ vùng đã thay đổi. Chế độ editing, model selection, loại linh kiện chuẩn bị đặt và pending logical port vẫn tồn tại; hủy gesture không commit thêm Undo. Hai action thu gọn chỉ sửa UI; không import circuit/workspace hay gọi API.

Chi phí đảo cờ O(1); resize cửa sổ O(W) theo số cửa sổ hiện có. Layout/render của trình duyệt và scene dùng đường xử lý sẵn có, không quét hoặc clone circuit graph. Không thêm tài nguyên WebGL, timer hoặc subscription bên ngoài lifecycle của component.

## Focus và lifecycle

Nếu nội dung sắp bị ẩn đang giữ focus, watcher chuyển về toggle sau `nextTick`. Click/Enter/Space trên toggle giữ focus ở chính nút đó. Khi đóng instrument bằng Escape, FloatingWindow kiểm tra opener có hình chữ nhật hiển thị hay không; nếu opener thuộc toolbar đã thu gọn, focus về toggle còn hiện. `v-show` giữ opener liên kết DOM, nên kiểm tra `isConnected` đơn thuần là chưa đủ.

Palette vẫn neo lại khi resize/scroll và vẫn đóng qua outside/Escape như trước. Listener/ResizeObserver hiện có được teardown trong component; watcher của Vue tự dừng khi unmount.

## Kiểm chứng

Hai test mới dùng Pinia/store thật: đóng/chặn palette, bốn tổ hợp độc lập và graph/history/saved/tool/selection/pending-port/zoom/placement không bị hai action làm thay đổi. Đã quan sát FAIL trước khi thêm state/action, sau đó frontend163/163 PASS. Browser kiểm chứng DOM/canvas thật, Enter/Space, đặt Breadboard khi cả hai toolbar đóng, focus từ instrument về toggle, hủy Area khi resize và bốn tổ hợp tại 1280×720, 1366×768, 1920×1080, 390×844, cộng viewport mặc định và chiều cao560.

Kết quả thực sự chạy, ảnh và giới hạn kiểm chứng nằm trong `verification/2026-10-11-collapsible-toolbars-browser.md` và DEV_LOG. Không có thay đổi API/schema/metadata/model artwork hoặc yêu cầu triển khai hardware.

# DS108.P21 - Tối ưu hóa chi phí khách sạn

## Giới thiệu
Dự án phát triển một hệ thống gợi ý khách sạn dựa trên dữ liệu thực tế thu thập từ nền tảng Agoda.com. Mục tiêu của hệ thống là giúp người dùng tìm được nơi lưu trú có chi phí hợp lý nhất, đồng thời đáp ứng các nhu cầu về tiện ích cá nhân trong bối cảnh thị trường du lịch ngày càng đa dạng.

## Bộ dữ liệu
* **Nguồn dữ liệu:** Thu thập hoàn toàn tự động từ Agoda thông qua công cụ mã nguồn mở Selenium WebDriver để xử lý các thành phần web động.
* **Quy mô:** Gần 18,000 bản ghi dữ liệu khách sạn tại TP. Hồ Chí Minh và Đắk Lắk trong giai đoạn 29/04 - 06/05/2025.
* **Tiền xử lý:** Dữ liệu được làm sạch, loại bỏ trùng lặp, điền giá trị thiếu và chuẩn hóa bằng thư viện pandas, kết quả giữ lại 16,270 dòng với 22 đặc trưng.

## Phương pháp & Thuật toán
Hệ thống sử dụng đường ống (pipeline) kết hợp nhiều phương pháp học máy và tối ưu hóa:
* **KMeans Clustering:** Phân cụm các khách sạn dựa trên vector tiện nghi nhị phân nhằm nhóm các khách sạn có đặc điểm tương đồng, hỗ trợ phát hiện xu hướng sở thích khi dữ liệu người dùng còn hạn chế.
* **Ridge Regression:** Huấn luyện mô hình để học trọng số cho từng tiện nghi dựa trên lịch sử yêu thích/không yêu thích của người dùng, từ đó cá nhân hóa điểm giá trị.
* **Netflix Smoothing:** Hiệu chỉnh điểm đánh giá tổng thể của cộng đồng dựa trên công thức Bayesian để tránh thiên lệch với các khách sạn có ít lượt đánh giá.
* **Knapsack (Linear Programming):** Mô hình hóa việc chọn lịch trình lưu trú thành bài toán quy hoạch tuyến tính để tối đa hóa giá trị thực của khách sạn mà không vượt quá giới hạn ngân sách.

## Đánh giá & Phân tích
* Qua phân tích tương quan, các tiện nghi như bếp, máy giặt, đưa đón sân bay và bãi đỗ xe có tác động tích cực và rõ rệt đến mức độ hài lòng (điểm đánh giá) của khách hàng.
* Việc áp dụng KMeans trước khi dùng Ridge Regression giúp mô hình học được các trọng số tiện nghi rõ ràng và đặc trưng hơn hẳn so với việc không phân cụm.

## Hướng phát triển tương lai
* **Dữ liệu người dùng:** Thu thập thêm lịch sử đặt phòng thực tế để triển khai mô hình gợi ý lai (Hybrid Recommendation System) kết hợp giữa Content-Based và Collaborative Filtering.
* **Cơ sở dữ liệu:** Chuyển đổi từ việc lưu trữ bằng file CSV sang hệ quản trị cơ sở dữ liệu quan hệ (SQL) để tăng tốc độ truy vấn và bảo mật.
* **Trích xuất hình ảnh:** Ứng dụng mạng nơ-ron tích chập (CNN) để trích xuất đặc trưng hình ảnh phòng (phong cách, không gian, nội thất) nhằm cải thiện độ hấp dẫn và cá nhân hóa của hệ thống.

## Demo Web

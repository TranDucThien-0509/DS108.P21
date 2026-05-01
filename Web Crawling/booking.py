from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import StaleElementReferenceException
import booking.constants as const
import time
import pandas as pd
import re

class Booking(webdriver.Chrome):
    def __init__(self, teardown=False):
        self.teardown = teardown

        # Cấu hình Chrome
        options = Options()
        options.add_experimental_option("detach", True)  # Giữ trình duyệt không tự đóng
        options.add_argument("--disable-blink-features=AutomationControlled")  # Vô hiệu hóa kiểm soát tự động
        options.add_argument("--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies")  # Tắt preload

        # Tự động cài driver tương thích
        service = Service(ChromeDriverManager().install())
        super(Booking, self).__init__(service=service, options=options)
        
        self.implicitly_wait(15)
        self.maximize_window()

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.teardown:
            self.quit()

    def land_first_page(self):
        self.get(const.BASE_URL)

    def select_place_to_go(self, place_to_go):
        wait = WebDriverWait(self, 10)
        
        try:
            close_qr = WebDriverWait(self, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Close']"))
            )
            close_qr.click()
        except Exception:
            print("Không tìm thấy popup QR để đóng, tiếp tục...")

        # Chọn đúng thẻ input (KHÔNG dùng ID "autocomplete-box")
        search_input = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[aria-label*='Nhập điểm du lịch']"))
        )

        search_input.click()
        search_input.clear()
        search_input.send_keys(place_to_go)

        # Thêm độ trễ giữa các thao tác
        time.sleep(1)  # Độ trễ 1 giây

        # Đợi gợi ý đầu tiên xuất hiện và click vào
        first_result = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "li[data-element-place-type='0']"))
        )
        first_result.click()

        # Thêm độ trễ giữa các thao tác
        time.sleep(1)  # Độ trễ 1 giây

    def select_dates(self, check_in_date, check_out_date):
        try:
            # Chọn ngày check-in
            checkin_elem = WebDriverWait(self, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, f'span[data-selenium-date="{check_in_date}"]'))
            )
            checkin_elem.click()

            # Chọn ngày check-out
            checkout_elem = WebDriverWait(self, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, f'span[data-selenium-date="{check_out_date}"]'))
            )
            checkout_elem.click()

        except Exception as e:
            print(f"Không thể chọn ngày: {e}")

        try:
            # Tìm và nhấn vào nút "TÌM"
            search_button = WebDriverWait(self, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='TÌM']"))
            )
            search_button.click()
        except Exception as e:
            print(f"Không thể nhấn vào nút 'TÌM': {e}")
            
        # Xử lý nhiều tab
        WebDriverWait(self, 5).until(lambda driver: len(driver.window_handles) > 1)  # Chờ tab mới mở
        tabs = self.window_handles  # Lấy danh sách các tab
        self.switch_to.window(tabs[1])  # Chuyển sang tab thứ hai (tab mới mở)
        
    def go_to_page(self, target_page):
        current_page = 1
        while current_page < target_page:
            try:
                # Scroll xuống cuối để hiện nút "Trang kế"
                for _ in range(35):
                    self.execute_script("window.scrollBy(0, 800);")
                    time.sleep(0.3)

                next_button = WebDriverWait(self, 10).until(
                    EC.element_to_be_clickable((By.ID, "paginationNext"))
                )
                if "disabled" in next_button.get_attribute("class"):
                    print("🚫 Không thể đi tiếp. Đã đến trang cuối.")
                    break

                next_button.click()
                time.sleep(3)
                current_page += 1
                print(f"➡️ Đã đến trang {current_page}")
            except Exception as e:
                print(f"❌ Lỗi khi chuyển sang trang {current_page + 1}: {e}")
                break


    def extract_hotel_data(self, limit=99):
        hotel_data_list = []
        hotel_data_raw = []

        try:
            # Scroll để Booking load thêm khách sạn
            total_scrolls = 40
            for i in range(total_scrolls):
                self.execute_script("window.scrollBy(0, 800);")
                time.sleep(0.5)

            # Lấy tất cả thẻ khách sạn
            hotel_cards = WebDriverWait(self, 10).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li[data-hotelid]"))
            )

            for card in hotel_cards:
                try:
                    link_elem = card.find_element(By.CSS_SELECTOR, "a.PropertyCard__Link")
                    link = link_elem.get_attribute("href")

                    # Giá trước (nếu có)
                    try:
                        original_price = card.find_element(By.CSS_SELECTOR, "div[data-element-name='first-cor']").text.strip()
                    except:
                        original_price = "Không có giá trước"

                    # Giá sau (hiện tại)
                    try:
                        final_price = card.find_element(By.CSS_SELECTOR, "span[data-selenium='display-price']").text.strip()
                    except:
                        final_price = "Không có giá sau"

                    hotel_data_raw.append({
                        "link": link,
                        "original_price": original_price,
                        "final_price": final_price
                    })

                except Exception as e:
                    print(f"❌ Không lấy được info thẻ khách sạn: {e}")

        except Exception as e:
            print(f"❌ Không lấy được danh sách khách sạn: {e}")
            return pd.DataFrame()

        # Mở 1 tab chi tiết, dùng lại cho tất cả khách sạn
        main_tab = self.current_window_handle
        self.execute_script("window.open('');")
        detail_tab = self.window_handles[-1]

        for index, hotel in enumerate(hotel_data_raw[:limit]):
            try:
                self.switch_to.window(detail_tab)
                self.get(hotel["link"])

                data = self.scrape_hotel_detail()
                data["Giá trước"] = hotel["original_price"]
                data["Giá sau"] = hotel["final_price"]
                hotel_data_list.append(data)

                print(f"✅ Đã lấy {index + 1}/{min(len(hotel_data_raw), limit)}: {data.get('name', 'Chưa rõ tên')}")

            except Exception as e:
                print(f"❌ Lỗi khi scrape chi tiết khách sạn: {e}")
                continue

        # Đóng tab chi tiết và quay lại tab chính
        self.switch_to.window(detail_tab)
        self.close()
        self.switch_to.window(main_tab)

        return pd.DataFrame(hotel_data_list)

    def open_hotel_detail_tab(self, hotel_link):
        try:
            old_tabs = self.window_handles
            self.execute_script("window.open(arguments[0], '_blank');", hotel_link)

            WebDriverWait(self, 10).until(lambda d: len(d.window_handles) > len(old_tabs))
            new_tab = list(set(self.window_handles) - set(old_tabs))[0]
            self.switch_to.window(new_tab)

            WebDriverWait(self, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "h2"))
            )
            time.sleep(1)
        except Exception as e:
            print(f"⚠️ Lỗi khi mở tab chi tiết: {e}")
            raise e


    def scrape_hotel_detail(self):
        hotel_data = {
            "name": "Không tìm thấy tên",
            "address": "Không có địa chỉ",
            "review_score": "Không có điểm đánh giá",
            "review_count": "Không có số nhận xét",
            "Vị trí": "Không có",
            "Dịch vụ": "Không có",
            "Đáng giá tiền": "Không có",
            "Cơ sở vật chất": "Không có",
            "Độ sạch sẽ": "Không có",
        }

        # Tên khách sạn
        hotel_data["name"] = self.safe_find_text(
            By.XPATH, "//h1[@data-selenium='hotel-header-name']", hotel_data["name"]
        )

        # Địa chỉ
        hotel_data["address"] = self.safe_find_text(
            By.XPATH, "//span[@data-selenium='hotel-address-map']", hotel_data["address"]
        )

        # Điểm đánh giá + số nhận xét
        try:
            review_box = self.find_element(By.CSS_SELECTOR, 'div[data-element-name="review-score"]')
            hotel_data["review_score"] = review_box.get_attribute('data-review-score-property-on-ssr') or hotel_data["review_score"]
            hotel_data["review_count"] = review_box.get_attribute('data-review-count-property-on-ssr') or hotel_data["review_count"]
        except:
            pass

        # Danh sách các nhãn điểm chi tiết
        score_labels = ["Vị trí", "Dịch vụ", "Đáng giá tiền", "Cơ sở vật chất", "Độ sạch sẽ"]

        # Bảng điểm chi tiết (ưu tiên)
        try:
            detailed_scores = self.find_elements(By.CSS_SELECTOR, "li.aab5e-box.aab5e-fill-inherit.aab5e-text-inherit")
            for el in detailed_scores:
                text = el.text.strip()
                for label in score_labels:
                    if label in text:
                        match = re.search(r"(\d{1,2}[.,]?\d{0,2})", text)
                        if match:
                            score = match.group(1).replace(",", ".")
                            try:
                                hotel_data[label] = float(score)
                            except:
                                hotel_data[label] = score
        except Exception as e:
            print(f"[⚠️ LỖI bảng điểm chính]: {e}")

        # Fallback: highlight (nếu bảng chi tiết không có đủ)
        try:
            highlight_els = self.find_elements(
                By.CSS_SELECTOR, "div[data-element-name='highlight-facility-mentions-sentiment'] span"
            )
            for el in highlight_els:
                text = el.text.strip()
                for label in score_labels:
                    if label in text and hotel_data[label] == "Không có":
                        score = text.replace(label, "").strip().replace(",", ".")
                        try:
                            hotel_data[label] = float(score)
                        except:
                            hotel_data[label] = score
        except Exception as e:
            print(f"[LỖI highlight điểm tốt]: {e}")
            
        # Kiểm tra tiện nghi đặc biệt
        amenity_keywords = {
            "bep": "bếp",
            "bua_sang": "bữa sáng",
            "san_gon": "sân gôn",
            "may_giat": "máy giặt",
            "dua_don_san_bay": "đưa đón sân bay",
            "phong_tap": "phòng tập",
            "don_phong_hang_ngay": "dọn phòng hằng ngày",
            "duoc_phep_mang_thu_nuoi": "được phép đưa thú nuôi vào",
            "bai_do_xe": "bãi đỗ xe"
        }

        for key in amenity_keywords:
            hotel_data[key] = 0  # Mặc định là không có

        try:
            amenities_texts = self.find_elements(By.CSS_SELECTOR, "div[data-testid='kite-box'] span")
            for el in amenities_texts:
                text = el.text.strip().lower()
                for key, keyword in amenity_keywords.items():
                    if keyword in text:
                        hotel_data[key] = 1
        except Exception as e:
            print(f"[LỖI khi kiểm tra tiện nghi đặc biệt]: {e}")

        return hotel_data

    def safe_find_text(self, by, selector, default=""):
        try:
            return self.find_element(by, selector).text
        except Exception:
            return default

    def close_current_tab_and_return(self, main_tab):
        try:
            self.close()
            self.switch_to.window(main_tab)
            time.sleep(1)
        except Exception as e:
            print(f"⚠️ Lỗi khi quay lại tab chính: {e}")

    def scrape_all_pages(self, max_pages=21):
        all_data = []
        page_num = 1

        while page_num <= max_pages:
            print(f"\n📄 Đang xử lý trang {page_num}...")
            df = self.extract_hotel_data()
            all_data.append(df)

            # 💾 Gộp và lưu tạm sau mỗi trang
            current_df = pd.concat(all_data, ignore_index=True)
            current_df.to_csv("backup.csv", index=False)
            print(f"✅ Đã lưu tạm backup.csv với {len(current_df)} khách sạn")

            try:
                next_page_btn = WebDriverWait(self, 10).until(
                    EC.element_to_be_clickable((By.ID, "paginationNext"))
                )
                next_page_btn.click()
                print("➡️ Đã chuyển sang trang kế tiếp.")
                time.sleep(3)
            except Exception:
                print("❌ Không tìm thấy hoặc không thể nhấn nút 'Trang kế'. Kết thúc.")
                break

            page_num += 1

        final_df = pd.concat(all_data, ignore_index=True)
        print(f"\n✅ Đã thu thập tổng cộng {len(final_df)} khách sạn từ {page_num-1} trang.")
        return final_df
